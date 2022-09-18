const express = require('express')
const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const { exec } = require("child_process");
const { createCanvas, loadImage } = require('canvas');

const app = express()
const port = 3000

function savePNG (canvas, name) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(name)
    const stream = canvas.createPNGStream()
    stream.pipe(out)
    out.on('finish', () =>  {
      console.log('save: ' + name);
      resolve();
    })
    out.on('error', () => {
      reject();
    })
  }); 
  
}

app.use(express.json());

app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':
      'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });

  // intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

app.get('/print', (req, res) => {
  const file = fs.createWriteStream("temp.png");
  const request = http.get(`https://api.mapbox.com/styles/STYLE_URL/static/${req.query.lng},${req.query.lat},${req.query.zoom},0/400x600?access_token=ACCESS_TOKEN`, function(response) {
     response.pipe(file);
     file.on("finish", () => {
        file.close();
        exec("python ../print.py --darker C:/Users/conta/Documents/GitHub/VISLAB/catprinter/media/cartohacklogos.png", (error, stdout, stderr) => {
          console.log(stdout, error, stderr);
          setTimeout(() => {
            const canvas = createCanvas(400, 300);
            const ctx = canvas.getContext('2d')
            ctx.font = '30px Arial'
            loadImage('temp.png').then(async (image) => {
              console.log('image loaded')
              ctx.drawImage(image, 0, 0, 400, 300, 0, 0, 400, 300);
              await savePNG(canvas, 'map-top.png');
              setTimeout(async () => {
                ctx.drawImage(image, 0, 300, 400, 300, 0, 0, 400, 300);
                await savePNG(canvas, 'map-bottom.png');
                setTimeout(() => {
                  exec("python ../print.py --darker C:/Users/conta/Documents/GitHub/VISLAB/catprinter/server/map-top.png", (error, stdout, stderr) => {
                    console.log(stdout, error, stderr);
                    setTimeout(() => {
                      exec("python ../print.py --darker C:/Users/conta/Documents/GitHub/VISLAB/catprinter/server/map-bottom.png", async (error, stdout, stderr) => {
                        console.log(stdout, error, stderr);
                        setTimeout(async () => {
                          ctx.fillStyle = '#ffffff';
                          ctx.beginPath();
                          ctx.rect(0, 0, 400, 300);
                          ctx.fill()
                          ctx.fillStyle = '#000000';
                          ctx.fillText('LAT: ' + req.query.lat, 0, 40)
                          ctx.fillText('LNG: ' + req.query.lng, 0, 80)
                          await savePNG(canvas, 'text.png');
                          setTimeout(() => {
                            exec("python ../print.py --darker C:/Users/conta/Documents/GitHub/VISLAB/catprinter/server/text.png", (error, stdout, stderr) => {
                              console.log(stdout, error, stderr);
                              console.log('all printed');
                            });
                          }, 5000)
                        }, 5000);
                      });
                    }, 5000);
                  });
                }, 5000);
              }, 5000);
            }).catch((err) => {
              console.log(err);
            })
          }, 1000);
        });
     });
  });
  res.send('Printing!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

/*





const draw = (
  colorIds,
  intensities,
  ctx,
  width,
  height
) => {

  radiusMin = height * 0.22
  maxIter = 10
  offset = width * 0.04
  radiusRand = width * 0.3

  pointSet = []
  for (let i = 0; i < 4; i += 1) {
    const points = []
    for (let i = 0; i <= maxIter; i += 1) {
      points.push(random() * radiusRand)
    }
    points.push(points[0])
    pointSet.push(points)
  }

  if (ctx) {
    

    const fullIntensity = intensities.reduce((sum, val) => sum + val, 0)
    ctx.clearRect(0, 0, width, height)

    for (let c = 3; c >= 0; c -= 1) {
      if (tempCtx) {
        tempCtx.clearRect(0, 0, width, height)
        tempCtx.translate(width / 2, height / 2)
        tempCtx.strokeStyle = colorValues[colorIds[c]]
        drawCircle(intensities[c], c, tempCtx, width)
        tempCtx.translate(-width / 2, -height / 2)
        ctx.drawImage(
          tempCanvas,
          0, 0,
          width, height,
          0,
          height / 2
            - (height / 4 * (1.25 + 0.75 * (fullIntensity / 400)))
            + (height / 25 * (c - c * (fullIntensity / 400))),
          width, height / (2 - (fullIntensity / 400))
        )
      }
    }
  }
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function createAvatar() {

  const canvas = createCanvas(width, height)
  const context = canvas.getContext('2d')
  const seed = cyrb128(Math.round((Math.round(new Date() / 1000) * Math.random())).toString())
  random = sfc32(seed[0], seed[1], seed[2], seed[3])

  const maxColors = Math.round(1 + Math.random() * 4);
  const colors = [...shuffle(colorValueIds.slice(1, 5)).slice(0, maxColors), colorValueIds[0], colorValueIds[0], colorValueIds[0], colorValueIds[0]];

  const intensities = [];
  for (let i = 0; i < 4; i += 1) {
    if (colors[i] === colorValueIds[0]) {
      intensities.push(0);
    } else {
      intensities.push(Math.random() * exhibitCount[colors[i]]);
    } 
  }

  draw(
    colors.slice(0, 4),
    intensities.slice(0, 4).map((intensity, i) => Math.min(95, Math.cbrt(intensity / exhibitCount[colors[i]]) * 95)),
    context,
    width,
    height
  );

  return canvas;
}



const shareWidth = 1200;
const shareHeight = 630;
const shareCanvas = createCanvas(shareWidth, shareHeight)
const shareContext = shareCanvas.getContext('2d')

const rows = 6;
const cols = 4;

async function createSet() {
  for (let i = 1; i <= 20; i += 1) {
    shareContext.clearRect(0, 0, shareWidth, shareHeight);
    for (let x = 0; x < rows; x += 1) {
      for (let y = 0; y < cols; y += 1) {
        const avatar = createAvatar();
        shareContext.drawImage(
          avatar,
          0, 0,
          width, height,
          shareWidth / rows * x,
          shareHeight / cols * y,
          shareWidth / rows,
          shareWidth / rows
        )
      }
    }
    await savePNG(shareCanvas, 'export-' + i);
  }
}

createSet();
*/
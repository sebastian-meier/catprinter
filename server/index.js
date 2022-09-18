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

const express = require("express")
const app = express()

const env = require("dotenv")
env.config()

const path = require("path")
const musicService = require("./musicService")

const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
})

const exphbs = require('express-handlebars')
app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  // defaultLayout: 'main',
  // layoutsDir: 'views/layouts',
  // partialsDir: 'views/partials'
}))
app.set('view engine', '.hbs')

const HTTP_PORT = process.env.PORT || 8080

function onHttpStart() {
  console.log("Express Server is running on PORT: " + HTTP_PORT + " 🚀🚀🚀")
}

app.use(express.static("public"));

const upload = multer(); // no { storage: storage } since we are not using disk storage

app.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/index.html"))
  res.redirect("/albums")
  // res.json("nice!")
})

app.get("/albums", (req, res) => {
  // if (req.query.genre) {
  //   musicService.getAlbumsByGenre(req.query.genre).then((genreAlbumsData) => {
  //     res.render('index', {
  //       data: genreAlbumsData,
  //       layout: 'main'
  //     })
  //   }).catch((err) => {
  //     console.log(err)
  //   })
  // } else {
    musicService.getAlbums().then((albumsData) => {
      console.log(albumsData)
      res.render('index', {
        data: albumsData,
        layout: 'main'
      })
    }).catch((err) => {
      console.log(err)
    })
  // }
})

app.get("/albums/new", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/albumForm.html"))
  res.render('albumForm')
  
  // musicService.getGenres().then((genres) => {
  //   res.render('albumForm', {
  //     data: genres, 
  //     layout: 'main'
  //   })
  // })
})

// app.get("/albums/:id", (req, res) => {
//   musicService.getAlbumById(req.params.id).then((album) => {
//     let albumArray = []
//     albumArray.push(album)
//     res.render('index', {
//       data: albumArray, 
//       layout: 'main'
//     })
//     // res.json(album)
//   }).catch((err) => {
//     res.json({ message: err })
//   })
// })

app.post("/albums/new", upload.single("albumCover"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      return result;
    }

    upload(req).then((uploaded) => {
      processAlbum(uploaded.url);
    });
  } else {
    processAlbum("");
  }

  function processAlbum(imageUrl) {
    req.body.albumCover = imageUrl;

    console.log(req.body)

    musicService.addAlbum(req.body).then(() => {
      res.redirect("/albums")
    })
  }

})


// app.get("/genres", (req, res) => {
//   musicService.getGenres().then((genres) => {
//     // res.json(genres)
    
//     res.render('genres', {
//       data: genres,
//       layout: 'main'
//     })
//   }).catch((err) => {
//     res.render('genres', {
//       message: "no results"
//     })
//   })

//   // what the final response should look like: res.json(albumsData)
// })


app.get('/albums/delete/:id', (req, res) => {
  musicService.deleteAlbum(req.params.id).then(() => {
    res.redirect('/albums')
  }).catch((err) => {
    res.status(500).send("ERROR - ALBUM DELETE FAILURE")
  })
})

app.use((req, res) => {
  // res.status(404).send("Page Not Found")
  res.render('404', {
    data: null,
    layout: 'main'
  })
})


musicService.initialize().then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log(err)
})

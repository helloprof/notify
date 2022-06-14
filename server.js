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


const HTTP_PORT = process.env.PORT || 8080

function onHttpStart() {
  console.log("Express Server is running on PORT: " + HTTP_PORT + " 🚀🚀🚀")
}

app.use(express.static("public"));

const upload = multer(); // no { storage: storage } since we are not using disk storage

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/index.html"))
})

app.get("/albums", (req, res) => {
  musicService.getAlbums().then((albumsData) => {
    res.json(albumsData)
  }).catch((err) => {
    console.log(err)
  })

  // what the final response should look like: res.json(albumsData)
})

app.get("/albums/new", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/albumForm.html"))
})

app.get("/albums/:id", (req, res) => {
  musicService.getAlbumById(req.params.id).then((album) => {
    res.json(album)
  }).catch((err) => {
    res.json({ message: err })
  })
})

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
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    req.body.albumCover = imageUrl;

    // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts
  }

})


app.get("/genres", (req, res) => {
  musicService.getGenres().then((data) => {
    res.json(data)
  }).catch((err) => {
    console.log(err)
  })

  // what the final response should look like: res.json(albumsData)
})



app.use((req, res) => {
  res.status(404).send("Page Not Found")
})


musicService.initialize().then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log(err)
})

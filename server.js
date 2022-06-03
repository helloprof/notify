const express = require("express")
const app = express()

const env = require("dotenv")
env.config()

const musicService = require("./musicService")

const HTTP_PORT = process.env.PORT || 8080

function onHttpStart() {
  console.log("Express Server is running on PORT: " + HTTP_PORT + " 🚀🚀🚀")
}

app.get("/", (req, res) => {
  res.send("NOT-ify")
})

app.get("/albums", (req, res) => {
  musicService.getAlbums().then((albumsData) => {
    res.json(albumsData)
  }).catch((err) => {
    console.log(err)
  })

  // what the final response should look like: res.json(albumsData)
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

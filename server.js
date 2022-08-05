const express = require("express")
const app = express()

const env = require("dotenv")
env.config()

const clientSessions = require("client-sessions")

const path = require("path")
const musicService = require("./musicService")
const userService = require("./userService")

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

app.use(clientSessions({
  cookieName: "session",
  secret: "week12notifymusicappexample12308052022",
  duration: 2 * 60 * 1000,
  activeDuration: 60 * 1000
}))

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  // res.sendFile(path.join(__dirname, "/views/index.html"))
  res.redirect("/albums")
  // res.json("nice!")
})

app.get("/albums", ensureLogin, (req, res) => {
  if (req.query.genre) {
    musicService.getAlbumsByGenre(req.query.genre).then((genreAlbumsData) => {
      res.render('index', {
        data: genreAlbumsData,
        layout: 'main'
      })
    }).catch((err) => {
      console.log(err)
    })
  } else {
    musicService.getAlbums().then((albumsData) => {
      console.log(albumsData)
      res.render('index', {
        data: albumsData,
        layout: 'main'
      })
    }).catch((err) => {
      console.log(err)
    })
  }
})

app.get("/albums/new", ensureLogin, (req, res) => {
  // res.render('albumForm')

  musicService.getGenres().then((genres) => {
    res.render('albumForm', {
      data: genres,
      layout: 'main'
    })
  })
})

app.get("/albums/:id", ensureLogin, (req, res) => {
  musicService.getAlbumById(req.params.id).then((album) => {
    res.render('index', {
      data: album,
      layout: 'main'
    })
    // res.json(album)
  }).catch((err) => {
    res.json({ message: err })
  })
})

app.post("/albums/new", ensureLogin, upload.single("albumCover"), (req, res) => {
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


app.get("/genres", ensureLogin, (req, res) => {
  musicService.getGenres().then((genres) => {
    res.render('genres', {
      data: genres,
      layout: 'main'
    })
  }).catch((err) => {
    console.log(err)
  })
})

app.get("/genres/new", ensureLogin, (req, res) => {
  res.render('genreForm')
})

app.post("/genres/new", ensureLogin, (req, res) => {
  musicService.addGenre(req.body).then(() => {
    res.redirect('/genres')
  }).catch((err) => {
    res.status(500).send(err)
  })
})

app.get('/genres/delete/:id', ensureLogin, (req, res) => {
  musicService.deleteGenre(req.params.id).then(() => {
    res.redirect('/genres')
  }).catch((err) => {
    res.status(500).send("ERROR - GENRE DELETE FAILURE")
  })
})

app.get('/albums/delete/:id', ensureLogin, (req, res) => {
  musicService.deleteAlbum(req.params.id).then(() => {
    res.redirect('/albums')
  }).catch((err) => {
    res.status(500).send("ERROR - ALBUM DELETE FAILURE")
  })
})

app.get("/songs/new", ensureLogin, (req, res) => {
  musicService.getAlbums().then((albumsData) => {
    res.render('songForm', {
      data: albumsData,
      layout: 'main'
    })
  }).catch((err) => {
    console.log(err)
  })})

app.post("/songs/new", ensureLogin, upload.single("songFile"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          {resource_type: 'video',
          use_filename: true },
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
      processSong(uploaded.url);
    });
  } else {
    processSong("");
  }

  function processSong(imageUrl) {
    req.body.songFile = imageUrl;

    console.log(req.body)

    musicService.addSong(req.body).then((albumID) => {
      res.redirect(`/songs/${albumID}`)
    })
  }
})

app.get("/songs/:id", ensureLogin, (req, res) => {
  musicService.getSongs(req.params.id).then((songs) => {
    res.render('songs', {
      data: songs,
      layout: 'main'
    })
  }).catch((err) => {
    console.log(err)
  })
})

app.get('/songs/delete/:id', ensureLogin, (req, res) => {
  musicService.deleteSong(req.params.id).then((albumID) => {
    res.redirect(`/songs/${albumID}`)
  }).catch((err) => {
    res.status(500).send("ERROR - SONG DELETE FAILURE")
  })
})

app.get("/register", (req, res) => {
  res.render('registerForm')
})

app.post("/register", (req, res) => {
  userService.registerUser(req.body).then((data) => {
    console.log(data)
    res.render('registerForm', {
      layout: 'main',
      successMessage: "USER SUCCESSFULLY CREATED!"
    })
  }).catch((err) => {
    console.log(err)
    res.render('registerForm', {
      layout: 'main',
      errorMessage: "USER REGISTRATION FAILED ERROR: "+err
    })
  })
})

app.get("/login", (req, res) => {
  res.render('loginForm')
})

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent')
  userService.loginUser(req.body).then((user) => {
    // add session stuff
    req.session.user = {
      username: user.username,
      email: user.email,
      loginHistory: user.loginHistory
    }
    
    res.redirect("/albums")
  }).catch((err) => {
    console.log(err)
    res.render('loginForm', {
      layout: 'main',
      errorMessage: "USER LOGIN FAILED: "+err
    })
  })
})

app.get("/loginHistory", ensureLogin, (req, res) => {
  res.render('loginHistory')
})

app.get("/logout", ensureLogin, (req,res) => {
  req.session.reset()
  res.redirect("/login")
})

app.use((req, res) => {
  // res.status(404).send("Page Not Found")
  res.render('404', {
    data: null,
    layout: 'main'
  })
})


musicService.initialize()
.then(userService.initialize())
.then(() => {
  app.listen(HTTP_PORT, onHttpStart)
}).catch((err) => {
  console.log(err)
})
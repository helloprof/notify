const fs = require("fs")

let albums = []
let genres = []

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('./data/albums.json', 'utf8', (err, data) => {
            if (err) {
                reject(err)
                console.log("ERROR: " +err)
                
            } else {

                albums = JSON.parse(data)

                fs.readFile('./data/genres.json', 'utf8', (err, data) => {
                    if (err) {
                        reject(err)
                        console.log("ERROR: " +err)
                    } else {
                        genres = JSON.parse(data)
                        resolve("SUCCESS!")
                    }
                })
            }
        })
    })

}

module.exports.getAlbums = () => {
    return new Promise((resolve, reject) => {
        if (albums) {
            resolve(albums)
        } else {
            reject("no albums")
        }
    })
}

module.exports.getAlbumById = (id) => {
    return new Promise((resolve, reject) => {
        var album;
        for (let i = 0; i < albums.length; i++) {
            if(albums[i].id == id) {
                album = albums[i]
            } 
        }
        // can also use FIND function (selects one object)
        // let album = albums.find(album => album.id == id)

        if (album) {
            resolve(album)
        } else {
            reject("no album found with that id!")
        }
    })
}

// module.exports.getPublishedAlbums = () => {
//     return new Promise((resolve, reject) => {
//         let albumsArray = []
//         for (let i = 0; i < albums.length; i++) {
//             if (albums[i].published == true) {
//                 albumsArray.push(albums[i])
//             }
//           }
//         if (albumsArray) {
//             resolve(albumsArray)
//         } else {
//             reject("no published")
//         }
//     })
// }

module.exports.getGenres = () => {
    return new Promise((resolve, reject) => {
        if (genres) {
            resolve(genres)
        } else {
            reject("no genres")
        }
    })
}





var mongoose = require("mongoose")
var Schema = mongoose.Schema

const env = require("dotenv")
env.config()

var userSchema = new Schema({
  "username": {
    type: String,
    unique: true
  },
  "password": String,
  "email": String,
  "loginHistory": [{
    dateTime: Date,
    userAgent: String
  }]
})

let User

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGO_URI_STRING)

    db.on('error', (err) => {
      reject(err) // reject the promise with the provided error
    })
    db.once('open', () => {
      User = db.model("users", userSchema)
      console.log("MONGO DB CONNECTED!")
      resolve()
    })
  })
}

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password != userData.password2) {
      reject("PASSWORDS DO NOT MATCH!")
    } else {
      let newUser = new User(userData)
      newUser.save((err) => {
        if (err) {
          if(err.code == 11000) {
            reject("USERNAME TAKEN!")
          } else {
            reject("ERROR: "+err)
          }
        } else {
          console.log("success")
          resolve()
        }
      })
    }
  })
}

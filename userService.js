var mongoose = require("mongoose")
var Schema = mongoose.Schema
const bcryptjs = require('bcryptjs');

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
      bcryptjs.hash(userData.password, 10).then((hash) => {
        userData.password = hash
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
      }).catch((error) => {
        reject("ERROR WITH PASSWORD ENCRYPTION: "+error)
      })
    }
  })
}

module.exports.loginUser = function(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({username: userData.username})
    .exec()
    .then((user) => {
      if(!user) {
        reject("UNABLE TO FIND USER: "+userData.username)
      } else {
        bcryptjs.compare(userData.password, user.password).then((result) => {
          if (result === true) {
            // save session stuff
            console.log(user)
            user.loginHistory.push({dateTime: new Date(), userAgent: userData.userAgent})
            
            User.updateOne({ username: user.username}, 
              { $set: { loginHistory: user.loginHistory}}
            ).exec()
            .then(() => {
              resolve(user)
            }).catch((err) => {
              reject("ERROR UPDATING USER'S LOGIN HISTORY!")
            })
          } else {
            reject("PASSWORD WAS INCORRECT!")
          }
        }).catch((error) => {
          reject("UNABLE TO DECRYPT PASSWORD!")
        })
      }
    })
  })
}

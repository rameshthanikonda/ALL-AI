const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: String,
  passwordHash: String,
  googleId: String,
  favorites: [String],
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('User', UserSchema)

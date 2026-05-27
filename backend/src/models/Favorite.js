const mongoose = require('mongoose')

const FavoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  createdAt: { type: Date, default: Date.now }
})

// Uniqueness check: A user can only favorite a tool once
FavoriteSchema.index({ user: 1, tool: 1 }, { unique: true })
FavoriteSchema.index({ tool: 1 }) // For aggregating trending counts fast

module.exports = mongoose.model('Favorite', FavoriteSchema)

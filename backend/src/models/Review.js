const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Optional for anonymous/guest reviews
  userName: { type: String, required: true, trim: true }, // Display name or custom guest name
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
})

// Indexing: optimized for retrieving reviews for a tool in reverse chronological order
ReviewSchema.index({ tool: 1, createdAt: -1 })

module.exports = mongoose.model('Review', ReviewSchema)

const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Compass' }, // Lucide icon name or emoji
  createdAt: { type: Date, default: Date.now }
})

// Indexing for fast search and listing by category slug
CategorySchema.index({ slug: 1 })

module.exports = mongoose.model('Category', CategorySchema)

const mongoose = require('mongoose')

const ToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  url: String,
  category: String,
  tags: [String],
  recentUpdates: [String],
  enterprise: { type: Boolean, default: false },
  logoUrl: String,
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Text index to support simple search across name/description/tags
ToolSchema.index({ name: 'text', description: 'text', tags: 'text' })

module.exports = mongoose.model('Tool', ToolSchema)

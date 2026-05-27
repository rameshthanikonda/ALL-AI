const mongoose = require('mongoose')

const ToolSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', trim: true },
  url: { type: String, required: true, trim: true },
  category: { type: String, default: 'Uncategorized', trim: true },
  tags: { type: [String], default: [] },
  recentUpdates: { type: [String], default: [] },
  enterprise: { type: Boolean, default: false },
  logoUrl: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  pricing: { type: String, default: 'Free', trim: true }, // Free, Freemium, Paid, Trial
  features: { type: [String], default: [] },
  source: { type: String, default: 'manual', trim: true }, // toolify, futurepedia, github, producthunt, manual
  normalizedName: { type: String, lowercase: true, trim: true }, // For duplicate checks
  trendingScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

// Indexes to optimize querying, sorting, and indexing space
ToolSchema.index({ slug: 1 })
ToolSchema.index({ category: 1 })
ToolSchema.index({ normalizedName: 1 })
ToolSchema.index({ trendingScore: -1 })
ToolSchema.index({ featured: -1, createdAt: -1 })

// Text index for MongoDB Text Search fallback
ToolSchema.index({ name: 'text', description: 'text', tags: 'text' })

module.exports = mongoose.model('Tool', ToolSchema)

const mongoose = require('mongoose')

const ContentItemSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['tool', 'internship', 'job', 'coding_problem', 'gate_resource', 'ai_news', 'dashboard_card'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  source: { type: String, default: 'manual', index: true },
  sourceType: { type: String, default: 'cache' },
  provider: { type: String, default: '' },
  category: { type: String, default: '', index: true },
  tags: [{ type: String }],
  difficulty: { type: String, default: '' },
  location: { type: String, default: '' },
  company: { type: String, default: '' },
  publishedAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  searchText: { type: String, default: '' },
  status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

ContentItemSchema.index({ kind: 1, slug: 1 }, { unique: true })

module.exports = mongoose.model('ContentItem', ContentItemSchema)

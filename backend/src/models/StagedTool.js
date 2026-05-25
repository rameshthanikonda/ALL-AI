const mongoose = require('mongoose')

const StagedToolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  description: String,
  url: String,
  category: String,
  tags: [String],
  logoUrl: String,
  source: String,
  enterprise: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  stagedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('StagedTool', StagedToolSchema)

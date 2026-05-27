const mongoose = require('mongoose')

const AnalyticsSchema = new mongoose.Schema({
  tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true },
  action: { type: String, enum: ['view', 'click', 'favorite'], required: true },
  timestamp: { type: Date, default: Date.now }
})

// Indexing for quick filtering and aggregation over date ranges
AnalyticsSchema.index({ tool: 1, action: 1 })
AnalyticsSchema.index({ timestamp: -1 })

module.exports = mongoose.model('Analytics', AnalyticsSchema)

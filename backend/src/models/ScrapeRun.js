const mongoose = require('mongoose')

const ScrapeRunSchema = new mongoose.Schema({
  pipeline: { type: String, default: 'scraping-automation', index: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
  status: { type: String, enum: ['running', 'completed', 'failed', 'partial'], default: 'running' },
  scraperResults: [{
    source: { type: String, required: true },
    fetched: { type: Number, default: 0 },
    newTools: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // milliseconds
    errorMessages: [{ type: String }],
  }],
  stats: {
    totalFetched: { type: Number, default: 0 },
    totalNew: { type: Number, default: 0 },
    totalDuplicates: { type: Number, default: 0 },
    totalErrors: { type: Number, default: 0 },
    totalToolsInDB: { type: Number, default: 0 },
    imagesOptimized: { type: Number, default: 0 },
    trendingUpdated: { type: Number, default: 0 },
  },
  notes: [{ type: String }],
})

ScrapeRunSchema.index({ startedAt: -1 })
ScrapeRunSchema.index({ status: 1 })

module.exports = mongoose.model('ScrapeRun', ScrapeRunSchema)

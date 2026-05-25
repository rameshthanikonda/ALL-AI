const mongoose = require('mongoose')

const ImportRunSchema = new mongoose.Schema({
  pipeline: { type: String, required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  stats: {
    fetched: { type: Number, default: 0 },
    cleaned: { type: Number, default: 0 },
    stored: { type: Number, default: 0 },
    indexed: { type: Number, default: 0 },
  },
  notes: [{ type: String }],
})

module.exports = mongoose.model('ImportRun', ImportRunSchema)

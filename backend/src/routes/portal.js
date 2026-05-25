const express = require('express')
const ContentItem = require('../models/ContentItem')
const ImportRun = require('../models/ImportRun')
const { fetchPortalOverview, runStudentAutomationPipeline } = require('../services/contentPipeline')
const { runInternshipAutomation } = require('../services/internshipAutomation')
const { runAINewsAutomation } = require('../services/aiNewsAutomation')

const router = express.Router()

router.get('/overview', async (req, res) => {
  try {
    const overview = await fetchPortalOverview()
    res.json(overview)
  } catch (error) {
    console.error('Portal overview failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.get('/feed', async (req, res) => {
  try {
    const kind = String(req.query.kind || '').trim()
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12))
    const filter = { status: 'active' }
    if (kind) filter.kind = kind

    const items = await ContentItem.find(filter).sort({ publishedAt: -1 }).limit(limit).lean()
    res.json({ items })
  } catch (error) {
    console.error('Portal feed failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.get('/runs', async (req, res) => {
  try {
    const runs = await ImportRun.find({}).sort({ startedAt: -1 }).limit(10).lean()
    res.json({ runs })
  } catch (error) {
    console.error('Portal runs failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/bootstrap', async (req, res) => {
  try {
    const run = await runStudentAutomationPipeline()
    res.json({ ok: true, run })
  } catch (error) {
    console.error('Portal bootstrap failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.get('/internships/status', async (req, res) => {
  try {
    const recentThreshold = new Date()
    recentThreshold.setDate(recentThreshold.getDate() - 30)

    const latestRun = await ImportRun.findOne({ pipeline: { $in: ['internship-automation', 'daily-internship-automation'] } }).sort({ startedAt: -1 }).lean()
    const latestItems = await ContentItem.find({
      kind: { $in: ['internship', 'job'] },
      status: 'active',
      publishedAt: { $gte: recentThreshold },
    })
      .sort({ publishedAt: -1 })
      .limit(12)
      .lean()

    res.json({
      latestRun,
      items: latestItems,
    })
  } catch (error) {
    console.error('Internship status failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/internships/refresh', async (req, res) => {
  try {
    const run = await runInternshipAutomation()
    res.json({ ok: true, run })
  } catch (error) {
    console.error('Internship refresh failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/news/refresh', async (req, res) => {
  try {
    const run = await runAINewsAutomation()
    res.json({ ok: true, run })
  } catch (error) {
    console.error('AI news refresh failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

module.exports = router

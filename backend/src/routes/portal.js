const express = require('express')
const ContentItem = require('../models/ContentItem')
const ImportRun = require('../models/ImportRun')
const { fetchPortalOverview, runStudentAutomationPipeline } = require('../services/contentPipeline')
const { runInternshipAutomation } = require('../services/internshipAutomation')
const { runAINewsAutomation } = require('../services/aiNewsAutomation')
const { cache } = require('../services/memoryCache')

const router = express.Router()

// Cache TTLs
const OVERVIEW_CACHE_TTL = 2 * 60 * 1000    // 2 minutes
const FEED_CACHE_TTL = 2 * 60 * 1000        // 2 minutes
const INTERNSHIP_CACHE_TTL = 2 * 60 * 1000  // 2 minutes

router.get('/overview', async (req, res) => {
  try {
    const cached = cache.get('portal:overview')
    if (cached) return res.json(cached)

    const overview = await fetchPortalOverview()
    cache.set('portal:overview', overview, OVERVIEW_CACHE_TTL)
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

    const cacheKey = `portal:feed:${kind}:${limit}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const filter = { status: 'active' }
    if (kind) filter.kind = kind

    const items = await ContentItem.find(filter).sort({ publishedAt: -1 }).limit(limit).lean()
    const result = { items }
    cache.set(cacheKey, result, FEED_CACHE_TTL)
    res.json(result)
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
    // Invalidate caches after bootstrap
    cache.invalidatePrefix('portal:')
    cache.invalidatePrefix('tools:')
    res.json({ ok: true, run })
  } catch (error) {
    console.error('Portal bootstrap failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.get('/internships/status', async (req, res) => {
  try {
    const cached = cache.get('portal:internships:status')
    if (cached) return res.json(cached)

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

    const result = { latestRun, items: latestItems }
    cache.set('portal:internships:status', result, INTERNSHIP_CACHE_TTL)
    res.json(result)
  } catch (error) {
    console.error('Internship status failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/internships/refresh', async (req, res) => {
  try {
    const run = await runInternshipAutomation()
    cache.invalidatePrefix('portal:')
    res.json({ ok: true, run })
  } catch (error) {
    console.error('Internship refresh failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/news/refresh', async (req, res) => {
  try {
    const run = await runAINewsAutomation()
    cache.invalidatePrefix('portal:')
    res.json({ ok: true, run })
  } catch (error) {
    console.error('AI news refresh failed', error)
    res.status(500).json({ error: 'server_error' })
  }
})

module.exports = router

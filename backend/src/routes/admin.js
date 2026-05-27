const express = require('express')
const router = express.Router()
const StagedTool = require('../models/StagedTool')
const Tool = require('../models/Tool')
const ScrapeRun = require('../models/ScrapeRun')
const { meiliSearchClient } = require('../search/meiliSearch')
const { runFullPipeline, runSelectedScrapers, ALL_SCRAPERS } = require('../automation/pipeline/scrapingPipeline')
const { getSchedulerStatus } = require('../automation/scheduler/cronScheduler')
const { calculateTrendingScores } = require('../automation/processors/trendingCalculator')

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  return res.status(401).json({ error: 'unauthenticated' })
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) return next()
  return res.status(403).json({ error: 'forbidden' })
}

// ─── Staged Tools Management ───────────────────────────────────────

// List staged items
router.get('/staged', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const items = await StagedTool.find({}).sort({ stagedAt: -1 }).lean()
    res.json({ items })
  } catch (err) {
    console.error('Staged list failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Approve staged item and move to public tools
router.post('/staged/:slug/approve', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const slug = req.params.slug
    const staged = await StagedTool.findOne({ slug }).lean()
    if (!staged) return res.status(404).json({ error: 'not_found' })

    const doc = {
      name: staged.name,
      slug: staged.slug,
      description: staged.description || '',
      url: staged.url || '',
      category: staged.category || '',
      tags: staged.tags || [],
      logoUrl: staged.logoUrl || '',
      enterprise: Boolean(staged.enterprise),
    }

    await Tool.updateOne({ slug }, { $set: doc }, { upsert: true })
    // update search index
    const all = await Tool.find({}).lean()
    await meiliSearchClient.syncIfNeeded(all).catch(() => {})

    await StagedTool.deleteOne({ slug })
    res.json({ ok: true })
  } catch (err) {
    console.error('Approve failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Reject staged item
router.post('/staged/:slug/reject', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const slug = req.params.slug
    await StagedTool.deleteOne({ slug })
    res.json({ ok: true })
  } catch (err) {
    console.error('Reject failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// ─── Scraping Automation Management ─────────────────────────────────

// Get automation dashboard status
router.get('/automation/status', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const [toolCount, stagedCount, latestRuns, schedulerStatus] = await Promise.all([
      Tool.countDocuments({}),
      StagedTool.countDocuments({}),
      ScrapeRun.find({}).sort({ startedAt: -1 }).limit(10).lean(),
      Promise.resolve(getSchedulerStatus()),
    ])

    // Source breakdown
    const sourceBreakdown = await Tool.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    res.json({
      totalTools: toolCount,
      stagedTools: stagedCount,
      sources: sourceBreakdown.map(s => ({ source: s._id || 'unknown', count: s.count })),
      scheduler: schedulerStatus,
      availableScrapers: ALL_SCRAPERS.map(s => s.name),
      recentRuns: latestRuns,
    })
  } catch (err) {
    console.error('Automation status failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Trigger a full scraping pipeline run
router.post('/automation/run', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { scrapers, parallel } = req.body || {}

    // Start the pipeline in the background
    res.json({
      ok: true,
      message: 'Scraping pipeline started in background',
      scrapers: scrapers || ALL_SCRAPERS.map(s => s.name),
      parallel: Boolean(parallel),
    })

    // Run after sending response
    setImmediate(async () => {
      try {
        if (scrapers && Array.isArray(scrapers)) {
          await runSelectedScrapers(scrapers)
        } else {
          await runFullPipeline({ parallel: Boolean(parallel) })
        }
      } catch (err) {
        console.error('[Admin] Background pipeline run failed:', err.message)
      }
    })
  } catch (err) {
    console.error('Automation run trigger failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Get scraping run history
router.get('/automation/runs', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20))

    const [runs, total] = await Promise.all([
      ScrapeRun.find({}).sort({ startedAt: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
      ScrapeRun.countDocuments({}),
    ])

    res.json({ runs, total, page, perPage })
  } catch (err) {
    console.error('Automation runs fetch failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Get specific run details
router.get('/automation/runs/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const run = await ScrapeRun.findById(req.params.id).lean()
    if (!run) return res.status(404).json({ error: 'not_found' })
    res.json({ run })
  } catch (err) {
    console.error('Run detail fetch failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Trigger trending score recalculation
router.post('/automation/trending', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const result = await calculateTrendingScores()
    res.json({ ok: true, ...result })
  } catch (err) {
    console.error('Trending recalculation failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

module.exports = router

const express = require('express')
const router = express.Router()
const StagedTool = require('../models/StagedTool')
const Tool = require('../models/Tool')
const { meiliSearchClient } = require('../search/meiliSearch')

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  return res.status(401).json({ error: 'unauthenticated' })
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) return next()
  return res.status(403).json({ error: 'forbidden' })
}

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

module.exports = router

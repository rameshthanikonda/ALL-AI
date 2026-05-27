const express = require('express')
const router = express.Router()
const Tool = require('../models/Tool')
const { meiliSearchClient } = require('../search/meiliSearch')
const { performLiveFallbackSearch } = require('../search/liveSearch')

const PRIORITY_TOOL_ORDER = [
  'Windsurf',
  'Antigravity',
  'Gemini',
  'Claude',
  'ChatGPT',
  'Cursor',
  'Codex',
  'Perplexity',
  'DeepSeek',
  'Manus',
]

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  return res.status(401).json({ error: 'unauthenticated' })
}

function parseTags(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildFacets(tools) {
  const categories = Array.from(
    new Set(tools.map((tool) => String(tool.category || '').trim()).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right))

  const tags = Array.from(
    new Set(
      tools
        .flatMap((tool) => tool.tags || [])
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right))

  return { categories, tags }
}

function getToolPriority(name) {
  const index = PRIORITY_TOOL_ORDER.findIndex((item) => item.toLowerCase() === String(name || '').trim().toLowerCase())
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function compareTools(left, right, normalizedQuery = '') {
  if (normalizedQuery) {
    const leftName = String(left.name || '').toLowerCase()
    const rightName = String(right.name || '').toLowerCase()
    const leftExact = leftName === normalizedQuery ? 2 : leftName.includes(normalizedQuery) ? 1 : 0
    const rightExact = rightName === normalizedQuery ? 2 : rightName.includes(normalizedQuery) ? 1 : 0
    if (leftExact !== rightExact) return rightExact - leftExact
  }

  const leftPriority = getToolPriority(left.name)
  const rightPriority = getToolPriority(right.name)
  if (leftPriority !== rightPriority) return leftPriority - rightPriority

  if (Boolean(left.featured) !== Boolean(right.featured)) return Number(right.featured) - Number(left.featured)

  const leftName = String(left.name || '')
  const rightName = String(right.name || '')
  return leftName.localeCompare(rightName)
}

function applyFallbackSearch(tools, { query, category, tags, page, perPage }) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean)

  let filtered = tools.filter((tool) => {
    if (category && String(tool.category || '').trim() !== category) return false

    if (tags.length) {
      const toolTags = (tool.tags || []).map((tag) => String(tag).trim())
      if (!tags.every((tag) => toolTags.includes(tag))) return false
    }

    if (!normalizedQuery) return true

    const haystack = [
      tool.name,
      tool.description,
      tool.category,
      ...(tool.tags || []),
      tool.slug,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return queryTerms.every((term) => haystack.includes(term))
  })

  filtered = filtered.sort((left, right) => compareTools(left, right, normalizedQuery))

  const total = filtered.length
  const paged = filtered.slice((page - 1) * perPage, page * perPage).map((tool) => ({
    ...tool,
    _search: {
      score: 0,
      engine: 'Database fallback',
      strategy: normalizedQuery
        ? 'Basic keyword search across name, description, category, and tags'
        : 'Browse ranking',
      reasons: normalizedQuery ? ['keyword match'] : ['sorted for browsing'],
    },
  }))

  return { total, tools: paged }
}

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const category = String(req.query.category || '').trim()
    const tags = parseTags(req.query.tags)
    const page = Math.max(1, Number(req.query.page) || 1)
    const perPage = Math.min(50, Math.max(1, Number(req.query.perPage) || 20))

    const tools = await Tool.find({}).lean()
    const facets = buildFacets(tools)

    if (meiliSearchClient.isConfigured()) {
      await meiliSearchClient.syncIfNeeded(tools)
      const searchResult = await meiliSearchClient.search({ query: q, category, tags, page, perPage })
      if (searchResult) {
        let finalTools = searchResult.tools
        let finalTotal = searchResult.total
        let searchMetadata = {
          engine: 'Meilisearch',
          strategy: q
            ? 'Keyword search across name, description, category, and tags'
            : 'Simple browse ranking',
          query: q,
          filters: { category, tags },
        }

        if (finalTotal === 0 && q) {
          const liveResults = await performLiveFallbackSearch(q)
          if (liveResults.length > 0) {
            finalTools = liveResults
            finalTotal = liveResults.length
            searchMetadata = {
              engine: 'Live Web Search',
              strategy: 'Real-time scraping fallback',
              query: q,
              filters: { category, tags }
            }
          }
        }

        return res.json({
          tools: finalTools,
          total: finalTotal,
          facets,
          search: searchMetadata,
        })
      }
    }

    const fallbackResult = applyFallbackSearch(tools, { query: q, category, tags, page, perPage })
    let finalTools = fallbackResult.tools
    let finalTotal = fallbackResult.total
    let searchMetadata = {
      engine: 'Database fallback',
      strategy: q
        ? 'Basic keyword search across name, description, category, and tags'
        : 'Simple browse ranking',
      query: q,
      filters: { category, tags },
    }

    if (finalTotal === 0 && q) {
      const liveResults = await performLiveFallbackSearch(q)
      if (liveResults.length > 0) {
        finalTools = liveResults
        finalTotal = liveResults.length
        searchMetadata = {
          engine: 'Live Web Search',
          strategy: 'Real-time scraping fallback',
          query: q,
          filters: { category, tags }
        }
      }
    }

    res.json({
      tools: finalTools,
      total: finalTotal,
      facets,
      search: searchMetadata,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Returns list of categories with counts
router.get('/categories', async (req, res) => {
  try {
    const tools = await Tool.find({}).lean()
    const counts = tools.reduce((acc, t) => {
      const c = String(t.category || '').trim()
      if (!c) return acc
      acc[c] = (acc[c] || 0) + 1
      return acc
    }, {})
    const list = Object.keys(counts)
      .map((name) => ({ name, count: counts[name] }))
      .sort((a, b) => b.count - a.count)
    res.json({ categories: list })
  } catch (err) {
    console.error('Categories fetch failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const tool = await Tool.findOne({ slug: req.params.slug }).lean()
    if (!tool) return res.status(404).json({ error: 'not_found' })
    res.json({ tool })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

router.post('/', ensureAuth, async (req, res) => {
  try {
    const { name, slug, description, url, category, tags, logoUrl, featured } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'missing_fields' })

    const existing = await Tool.findOne({ slug })
    if (existing) return res.status(409).json({ error: 'slug_exists' })

    const tool = await Tool.create({ name, slug, description, url, category, tags, logoUrl, featured })

    await meiliSearchClient.upsertTool(tool).catch((error) => {
      console.warn('Meilisearch upsert failed after create:', error.message)
    })

    res.status(201).json({ tool })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

// Bulk import endpoint: accepts JSON array or CSV upload (requires auth)
router.post('/bulk', ensureAuth, async (req, res) => {
  try {
    let toolsData = []

    // If body is an array, assume JSON bulk import
    if (Array.isArray(req.body)) {
      toolsData = req.body
    } else if (req.is('text/csv') || req.headers['content-type'] === 'text/csv') {
      // CSV parsing (synchronous) to avoid extra middleware
      const parse = require('csv-parse/sync')
      const text = req.body.toString ? req.body.toString() : String(req.body)
      const records = parse.parse(text, { columns: true, skip_empty_lines: true })
      toolsData = records.map((r) => ({
        name: r.name,
        slug: r.slug || (r.name && r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
        description: r.description,
        url: r.url,
        category: r.category,
        tags: r.tags ? r.tags.split(',').map((t) => t.trim()) : [],
        logoUrl: r.logoUrl,
        featured: String(r.featured || '').toLowerCase() === 'true',
      }))
    } else if (req.body && typeof req.body === 'object') {
      // Single object wrapped with tools key
      if (Array.isArray(req.body.tools)) toolsData = req.body.tools
      else if (Array.isArray(req.body.data)) toolsData = req.body.data
      else return res.status(400).json({ error: 'invalid_payload' })
    } else {
      return res.status(400).json({ error: 'invalid_payload' })
    }

    const results = []
    for (const item of toolsData) {
      if (!item || !item.name) continue
      const slug = item.slug || String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const normalized = {
        name: item.name,
        slug,
        description: item.description || '',
        url: item.url || '',
        category: item.category || '',
        tags: Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        logoUrl: item.logoUrl || '',
        featured: Boolean(item.featured),
      }

      await Tool.updateOne({ slug }, { $set: normalized }, { upsert: true })
      results.push({ slug, status: 'upserted' })
    }

    // Attempt to sync to search index in background
    const allTools = await Tool.find({}).lean()
    await meiliSearchClient.syncIfNeeded(allTools).catch(() => {})

    res.json({ imported: results.length, results })
  } catch (err) {
    console.error('Bulk import failed', err)
    res.status(500).json({ error: 'server_error' })
  }
})

router.put('/:slug', ensureAuth, async (req, res) => {
  try {
    const updates = req.body || {}
    const tool = await Tool.findOneAndUpdate({ slug: req.params.slug }, { $set: updates }, { new: true })
    if (!tool) return res.status(404).json({ error: 'not_found' })

    await meiliSearchClient.upsertTool(tool).catch((error) => {
      console.warn('Meilisearch upsert failed after update:', error.message)
    })

    res.json({ tool })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

router.delete('/:slug', ensureAuth, async (req, res) => {
  try {
    const result = await Tool.findOneAndDelete({ slug: req.params.slug })
    if (!result) return res.status(404).json({ error: 'not_found' })

    await meiliSearchClient.deleteTool(String(result._id)).catch((error) => {
      console.warn('Meilisearch delete failed after delete:', error.message)
    })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
})

module.exports = router

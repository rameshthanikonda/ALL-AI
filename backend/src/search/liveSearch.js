const Tool = require('../models/Tool')
const { cleanToolRecord } = require('../automation/processors/dataCleaner')
const { categorizeTool } = require('../automation/categorizer/keywordCategorizer')
const { discoverTools } = require('./discoveryService')
const { filterValidTools } = require('./toolValidator')

function toApiTool(cleaned, query) {
  return {
    name: cleaned.name,
    slug: cleaned.slug,
    description: cleaned.description,
    url: cleaned.url,
    category: cleaned.category,
    tags: cleaned.tags,
    logoUrl: cleaned.logoUrl || '',
    pricing: cleaned.pricing,
    features: cleaned.features,
    source: cleaned.source,
    featured: false,
    _search: {
      engine: 'Discovery',
      strategy: 'Google scrape + Toolify + Futurepedia',
      reasons: ['No local match', `query: ${query}`],
    },
  }
}

async function performLiveFallbackSearch(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const discovered = await discoverTools(trimmed)
  if (!discovered.length) return []

  const apiTools = []
  for (const raw of discovered) {
    const cleaned = cleanToolRecord(raw)
    if (!cleaned) continue

    if (!cleaned.category || cleaned.category === 'Uncategorized') {
      cleaned.category = categorizeTool(cleaned.name, cleaned.description, cleaned.tags)
    }

    apiTools.push(toApiTool(cleaned, trimmed))
  }

  const valid = filterValidTools(apiTools)
  if (!valid.length) return []

  await cacheDiscoveredTools(valid)
  return valid
}

async function cacheDiscoveredTools(results) {
  for (const tool of results) {
    try {
      const { _search, ...toolData } = tool
      const normalizedName = String(toolData.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

      const existing = await Tool.findOne({
        $or: [{ slug: toolData.slug }, { url: toolData.url }, { normalizedName }],
      })

      if (!existing) {
        await Tool.create({ ...toolData, normalizedName })
        console.log(`[GoogleScrape] Saved: ${toolData.name}`)
      }
    } catch (error) {
      console.warn('[GoogleScrape] Cache failed:', error.message)
    }
  }
}

module.exports = {
  performLiveFallbackSearch,
}

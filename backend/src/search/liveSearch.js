const Tool = require('../models/Tool')
const { cleanToolRecord } = require('../automation/processors/dataCleaner')
const { categorizeTool } = require('../automation/categorizer/keywordCategorizer')
const { searchAiToolDirectories } = require('./directorySearch')
const { rankToolsByQuery } = require('./queryUtils')

function toApiTool(cleaned, query, sourceLabel) {
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
      engine: sourceLabel,
      strategy: 'AI directory scraping (Futurepedia)',
      reasons: ['No local index match', `query: ${query}`],
    },
  }
}

/**
 * Discover AI tools by scraping curated directories instead of generic web search engines.
 */
async function performLiveFallbackSearch(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  console.log(`[LiveSearch] Directory discovery for: ${trimmed}`)

  try {
    const rawResults = await searchAiToolDirectories(trimmed)
    if (!rawResults.length) {
      console.log(`[LiveSearch] No directory results for: ${trimmed}`)
      return []
    }

    const apiTools = []
    for (const raw of rawResults) {
      const cleaned = cleanToolRecord(raw)
      if (!cleaned) continue

      if (!cleaned.category) {
        cleaned.category = categorizeTool(cleaned.name, cleaned.description, cleaned.tags)
      }

      apiTools.push(toApiTool(cleaned, trimmed, 'AI Directory Search'))
    }

    const ranked = rankToolsByQuery(apiTools, trimmed, 10)
    if (ranked.length > 0) {
      await cacheAndSaveResults(ranked)
      console.log(`[LiveSearch] Returning ${ranked.length} directory tools for "${trimmed}"`)
      return ranked
    }
  } catch (err) {
    console.error(`[LiveSearch] Directory search failed:`, err.message)
  }

  return []
}

/**
 * Persist discovered tools so later searches hit the local database.
 */
async function cacheAndSaveResults(results) {
  for (const res of results) {
    try {
      const { _search, ...toolData } = res
      const existing = await Tool.findOne({
        $or: [{ slug: toolData.slug }, { url: toolData.url }, { normalizedName: toolData.name?.toLowerCase?.().replace(/[^a-z0-9]/g, '') }],
      })

      if (!existing) {
        const normalizedName = String(toolData.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
        await Tool.create({ ...toolData, normalizedName })
        console.log(`[LiveSearch] Saved new tool: ${toolData.name} (${toolData.slug})`)
      }
    } catch (err) {
      console.warn('[LiveSearch] Failed to cache result:', err.message)
    }
  }
}

module.exports = {
  performLiveFallbackSearch,
}

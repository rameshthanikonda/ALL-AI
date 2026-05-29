const { tokenizeQuery, scoreToolRelevance } = require('./queryUtils')

/**
 * Score-based keyword search across in-memory tool list (used when Meilisearch is off).
 */
function searchToolsInMemory(tools, { query, category, tags, page, perPage, compareTools }) {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const queryTerms = tokenizeQuery(query)

  let filtered = tools.filter((tool) => {
    if (category && String(tool.category || '').trim() !== category) return false

    if (tags.length) {
      const toolTags = (tool.tags || []).map((tag) => String(tag).trim())
      if (!tags.every((tag) => toolTags.includes(tag))) return false
    }

    if (!normalizedQuery) return true
    if (!queryTerms.length) {
      const haystack = [
        tool.name,
        tool.description,
        tool.category,
        ...(tool.tags || []),
        tool.slug,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    }

    return scoreToolRelevance(tool, queryTerms, query) > 0
  })

  filtered = filtered.sort((left, right) => {
    if (normalizedQuery) {
      const leftScore = scoreToolRelevance(left, queryTerms, query)
      const rightScore = scoreToolRelevance(right, queryTerms, query)
      if (leftScore !== rightScore) return rightScore - leftScore
    }
    return compareTools(left, right, normalizedQuery)
  })

  const total = filtered.length
  const paged = filtered.slice((page - 1) * perPage, page * perPage).map((tool) => ({
    ...tool,
    _search: {
      score: normalizedQuery ? scoreToolRelevance(tool, queryTerms, query) : 0,
      engine: 'Database',
      strategy: normalizedQuery
        ? 'Scored keyword search across name, description, category, and tags'
        : 'Browse ranking',
      reasons: normalizedQuery ? ['keyword relevance'] : ['sorted for browsing'],
    },
  }))

  return { total, tools: paged }
}

/**
 * MongoDB text search with filter support.
 */
async function searchToolsWithTextIndex(Tool, { query, category, tags, page, perPage }) {
  const normalizedQuery = String(query || '').trim()
  if (!normalizedQuery) return null

  const filter = { $text: { $search: normalizedQuery } }
  if (category) filter.category = category
  if (tags.length) filter.tags = { $all: tags }

  const docs = await Tool.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .lean()

  const total = docs.length
  const paged = docs.slice((page - 1) * perPage, page * perPage).map((tool) => ({
    ...tool,
    _search: {
      score: tool.score || 0,
      engine: 'Database (text index)',
      strategy: 'MongoDB full-text search',
      reasons: ['text index match'],
    },
  }))

  return { total, tools: paged }
}

module.exports = {
  searchToolsInMemory,
  searchToolsWithTextIndex,
}

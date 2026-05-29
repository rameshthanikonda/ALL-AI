function buildSearchPresentation({ query, category, tags, total, engine }) {
  const count = Number(total) || 0
  const q = String(query || '').trim()
  const hasFilters = Boolean(category || (tags && tags.length))

  if (!q && !hasFilters) {
    return {
      mode: 'browse',
      headline: count === 1 ? '1 tool available' : `${count} tools available`,
      detail: 'Browse the catalog below.',
    }
  }

  if (engine === 'Discovery') {
    return {
      mode: 'discovery',
      headline: count === 1 ? '1 tool found' : `${count} tools found`,
      detail: q ? `Discovered on the web for “${q}”.` : 'Discovered from web sources.',
    }
  }

  const filterParts = [category, ...(Array.isArray(tags) ? tags : tags ? [tags] : [])].filter(Boolean)
  const filterNote = filterParts.length ? ` · Filtered by ${filterParts.join(', ')}` : ''

  return {
    mode: 'search',
    headline: count === 1 ? '1 result' : `${count} results`,
    detail: q ? `Matching “${q}” in your catalog.${filterNote}` : `Matching your filters.${filterNote}`,
  }
}

const { tokenizeQuery, rankToolsByQuery } = require('./queryUtils')

function needsWebDiscovery(tools, query) {
  const q = String(query || '').trim()
  if (!q) return false

  const terms = tokenizeQuery(q)
  if (!terms.length) return tools.length < 3

  const strongMatches = tools.filter((tool) => {
    const name = String(tool.name || '').toLowerCase()
    return terms.some((term) => name.includes(term))
  })

  return strongMatches.length < 2
}

function mergeDiscoveryResults(localTools, discoveredTools, query) {
  const seen = new Set()
  const merged = []

  for (const tool of [...discoveredTools, ...localTools]) {
    const key = String(tool.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push(tool)
  }

  return rankToolsByQuery(merged, query, 24)
}

module.exports = {
  buildSearchPresentation,
  needsWebDiscovery,
  mergeDiscoveryResults,
}

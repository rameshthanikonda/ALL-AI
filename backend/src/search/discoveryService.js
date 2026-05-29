const { rankToolsByQuery } = require('./queryUtils')
const { filterValidTools } = require('./toolValidator')
const { searchGoogle } = require('./googleSearch')
const { searchFuturepedia } = require('./sources/futurepediaSource')
const { searchToolify } = require('./sources/toolifySource')

function dedupeByName(tools) {
  const seen = new Set()
  return tools.filter((tool) => {
    const key = String(tool.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function discoverTools(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  console.log(`[Discovery] Google + Toolify + Futurepedia for: ${trimmed}`)

  const settled = await Promise.allSettled([
    searchGoogle(trimmed),
    searchToolify(trimmed),
    searchFuturepedia(trimmed),
  ])

  const merged = []
  for (const result of settled) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      merged.push(...result.value)
    }
  }

  const deduped = dedupeByName(merged)
  const ranked = rankToolsByQuery(deduped, trimmed, 15)
  const valid = filterValidTools(ranked.length ? ranked : deduped)

  console.log(`[Discovery] ${valid.length} tools for "${trimmed}"`)
  return valid.slice(0, 12)
}

module.exports = {
  discoverTools,
}

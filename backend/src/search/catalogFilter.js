const { isLegacyJunkTool, isValidToolCandidate } = require('./toolValidator')

function isCatalogTool(tool) {
  if (!tool?.name) return false
  if (isLegacyJunkTool(tool)) return false
  return isValidToolCandidate(tool)
}

function filterCatalogTools(tools) {
  return (tools || []).filter(isCatalogTool)
}

function legacyJunkMongoQuery() {
  return {
    $or: [
      { category: 'Explore Fallback' },
      { tags: 'live-search' },
      { name: { $regex: /cache-control|http header|hacker news|cdata/i } },
      { url: { $regex: /hnrss\.org|news\.ycombinator\.com|developer\.mozilla\.org|w3\.org/i } },
    ],
  }
}

module.exports = {
  isCatalogTool,
  filterCatalogTools,
  legacyJunkMongoQuery,
}

const Tool = require('../../models/Tool')

function normalizeName(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

async function findDuplicate(name, url, slug) {
  const normName = normalizeName(name)
  
  const query = {
    $or: []
  }

  if (url) {
    // Clean URL query params to compare base URLs
    try {
      const parsedUrl = new URL(url)
      const cleanUrl = parsedUrl.origin + parsedUrl.pathname
      // Use regex to match either exact URL or URL without query string
      query.$or.push({ url: { $regex: new RegExp('^' + cleanUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(\\?|$)') } })
    } catch (e) {
      query.$or.push({ url })
    }
  }

  if (slug) {
    query.$or.push({ slug })
  }

  if (normName) {
    query.$or.push({ normalizedName: normName })
  }

  if (query.$or.length === 0) return null

  // Fetch only the _id, slug, and name to optimize performance and save database bandwidth
  return Tool.findOne(query).select('_id slug name url').lean()
}

module.exports = {
  findDuplicate,
  normalizeName
}

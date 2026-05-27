const Tool = require('../../models/Tool')
const Analytics = require('../../models/Analytics')
const Favorite = require('../../models/Favorite')

/**
 * Calculate trending score for all tools based on:
 * - View count (weight: 1)
 * - Click count (weight: 2)
 * - Favorite count (weight: 3)
 * - Recency bonus (newer tools get a boost)
 *
 * Score = (views * 1) + (clicks * 2) + (favorites * 3) + recencyBonus
 */
async function calculateTrendingScores() {
  console.log('[Trending] Calculating trending scores...')

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  try {
    // Aggregate analytics from last 7 days for recent engagement
    const recentAnalytics = await Analytics.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { tool: '$tool', action: '$action' },
          count: { $sum: 1 },
        },
      },
    ])

    // Aggregate favorites count per tool
    const favoriteCounts = await Favorite.aggregate([
      {
        $group: {
          _id: '$tool',
          count: { $sum: 1 },
        },
      },
    ])

    // Build lookup maps
    const analyticsMap = {} // toolId -> { views, clicks, favorites }
    for (const entry of recentAnalytics) {
      const toolId = String(entry._id.tool)
      if (!analyticsMap[toolId]) {
        analyticsMap[toolId] = { views: 0, clicks: 0, favorites: 0 }
      }
      if (entry._id.action === 'view') analyticsMap[toolId].views = entry.count
      else if (entry._id.action === 'click') analyticsMap[toolId].clicks = entry.count
      else if (entry._id.action === 'favorite') analyticsMap[toolId].favorites = entry.count
    }

    const favoriteMap = {}
    for (const entry of favoriteCounts) {
      favoriteMap[String(entry._id)] = entry.count
    }

    // Get all tools
    const tools = await Tool.find({}).select('_id createdAt trendingScore').lean()

    const bulkOps = []
    for (const tool of tools) {
      const toolId = String(tool._id)
      const analytics = analyticsMap[toolId] || { views: 0, clicks: 0, favorites: 0 }
      const totalFavorites = favoriteMap[toolId] || 0

      // Weighted engagement score
      const engagementScore =
        analytics.views * 1 +
        analytics.clicks * 2 +
        (analytics.favorites + totalFavorites) * 3

      // Recency bonus: tools created within 7 days get +20, within 30 days get +10
      let recencyBonus = 0
      if (tool.createdAt) {
        const createdAt = new Date(tool.createdAt)
        if (createdAt >= sevenDaysAgo) recencyBonus = 20
        else if (createdAt >= thirtyDaysAgo) recencyBonus = 10
      }

      const trendingScore = engagementScore + recencyBonus

      // Only update if score changed to minimize writes
      if (trendingScore !== (tool.trendingScore || 0)) {
        bulkOps.push({
          updateOne: {
            filter: { _id: tool._id },
            update: { $set: { trendingScore } },
          },
        })
      }
    }

    if (bulkOps.length > 0) {
      await Tool.bulkWrite(bulkOps)
    }

    console.log(`[Trending] Updated ${bulkOps.length} tool scores out of ${tools.length} total.`)
    return { updated: bulkOps.length, total: tools.length }
  } catch (error) {
    console.error('[Trending] Failed to calculate scores:', error.message)
    return { updated: 0, total: 0, error: error.message }
  }
}

module.exports = {
  calculateTrendingScores,
}

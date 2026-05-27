const ContentItem = require('../models/ContentItem')

/**
 * Deletes internships and jobs that are older than 45 days.
 */
async function cleanupExpiredJobs() {
  console.log('[Cleanup] Starting expired jobs cleanup...')
  try {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 45)

    const result = await ContentItem.deleteMany({
      kind: { $in: ['internship', 'job'] },
      publishedAt: { $lt: thresholdDate }
    })

    console.log(`[Cleanup] Successfully deleted ${result.deletedCount} expired jobs/internships (older than 45 days).`)
    return result.deletedCount
  } catch (error) {
    console.error('[Cleanup] Failed to clean up expired jobs:', error.message)
    throw error
  }
}

module.exports = {
  cleanupExpiredJobs
}

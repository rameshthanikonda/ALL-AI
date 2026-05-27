const cron = require('node-cron')
const { runFullPipeline, runSelectedScrapers } = require('../pipeline/scrapingPipeline')
const { calculateTrendingScores } = require('../processors/trendingCalculator')
const { cleanupExpiredJobs } = require('../../scripts/cleanupJobs')

let scrapingTask = null
let trendingTask = null
let cleanupTask = null

/**
 * Start the scraping cron scheduler.
 * Default: runs every 6 hours.
 * Trending scores: updated every 3 hours.
 */
function startScheduler(options = {}) {
  const {
    scrapingCron = '0 */6 * * *', // Every 6 hours (at minute 0)
    trendingCron = '0 */3 * * *', // Every 3 hours
    cleanupCron = '0 0 * * *', // Every midnight
    runImmediately = false,
  } = options

  console.log('[Scheduler] Initializing cron scheduler...')
  console.log(`[Scheduler] Scraping schedule: "${scrapingCron}"`)
  console.log(`[Scheduler] Trending schedule: "${trendingCron}"`)

  // Validate cron expressions
  if (!cron.validate(scrapingCron)) {
    console.error(`[Scheduler] Invalid scraping cron expression: "${scrapingCron}"`)
    return
  }
  if (!cron.validate(trendingCron)) {
    console.error(`[Scheduler] Invalid trending cron expression: "${trendingCron}"`)
    return
  }

  // Schedule scraping pipeline
  scrapingTask = cron.schedule(scrapingCron, async () => {
    console.log(`\n[Scheduler] ⏰ Scraping cron triggered at ${new Date().toISOString()}`)
    try {
      await runFullPipeline()
    } catch (err) {
      console.error('[Scheduler] Scraping pipeline failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  // Schedule trending score updates
  trendingTask = cron.schedule(trendingCron, async () => {
    console.log(`\n[Scheduler] ⏰ Trending update triggered at ${new Date().toISOString()}`)
    try {
      await calculateTrendingScores()
    } catch (err) {
      console.error('[Scheduler] Trending update failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  // Schedule job cleanup
  cleanupTask = cron.schedule(cleanupCron, async () => {
    console.log(`\n[Scheduler] ⏰ Job cleanup triggered at ${new Date().toISOString()}`)
    try {
      await cleanupExpiredJobs()
    } catch (err) {
      console.error('[Scheduler] Job cleanup failed:', err.message)
    }
  }, { timezone: 'Asia/Kolkata' })

  console.log('[Scheduler] ✅ Cron jobs registered successfully.')

  // Run immediately if requested (e.g., first deployment)
  if (runImmediately) {
    console.log('[Scheduler] Running initial scraping pipeline now...')
    setImmediate(async () => {
      try {
        await runFullPipeline()
      } catch (err) {
        console.error('[Scheduler] Initial run failed:', err.message)
      }
    })
  }
}

/**
 * Stop all cron jobs cleanly
 */
function stopScheduler() {
  if (scrapingTask) {
    scrapingTask.stop()
    scrapingTask = null
    console.log('[Scheduler] Scraping cron stopped.')
  }
  if (trendingTask) {
    trendingTask.stop()
    trendingTask = null
    console.log('[Scheduler] Trending cron stopped.')
  }
  if (cleanupTask) {
    cleanupTask.stop()
    cleanupTask = null
    console.log('[Scheduler] Cleanup cron stopped.')
  }
}

/**
 * Get current scheduler status
 */
function getSchedulerStatus() {
  return {
    scraping: {
      active: scrapingTask !== null,
      schedule: scrapingTask ? 'Every 6 hours' : 'Stopped',
    },
    trending: {
      active: trendingTask !== null,
      schedule: trendingTask ? 'Every 3 hours' : 'Stopped',
    },
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
}

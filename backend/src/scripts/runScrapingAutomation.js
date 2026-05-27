/**
 * Scraping Automation Runner
 * 
 * Usage:
 *   node src/scripts/runScrapingAutomation.js           # Run once
 *   node src/scripts/runScrapingAutomation.js --watch    # Run with cron scheduler
 *   node src/scripts/runScrapingAutomation.js --scraper toolify  # Run specific scraper
 *   node src/scripts/runScrapingAutomation.js --parallel # Run scrapers in parallel
 */
require('dotenv').config()
const path = require('path')
const mongoose = require('mongoose')

// Load root .env if needed
const rootEnv = path.resolve(__dirname, '..', '..', '..', '.env')
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: rootEnv })
}

const { runFullPipeline, runSelectedScrapers } = require('../automation/pipeline/scrapingPipeline')
const { startScheduler } = require('../automation/scheduler/cronScheduler')

const args = process.argv.slice(2)
const isWatch = args.includes('--watch')
const isParallel = args.includes('--parallel')
const scraperIndex = args.indexOf('--scraper')
const selectedScrapers = scraperIndex !== -1 && args[scraperIndex + 1]
  ? args[scraperIndex + 1].split(',').map(s => s.trim())
  : null

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  
  console.log('[Runner] Connecting to MongoDB...')
  await mongoose.connect(uri)
  console.log('[Runner] Connected to MongoDB')

  if (isWatch) {
    // Scheduler mode: run cron jobs in the background
    console.log('[Runner] Starting in scheduler mode (--watch)')
    startScheduler({
      scrapingCron: process.env.SCRAPING_CRON || '0 */6 * * *',
      trendingCron: process.env.TRENDING_CRON || '0 */3 * * *',
      runImmediately: true,
    })

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n[Runner] Shutting down gracefully...')
      mongoose.disconnect().then(() => process.exit(0))
    })
  } else {
    // One-off mode
    try {
      if (selectedScrapers) {
        console.log(`[Runner] Running selected scrapers: ${selectedScrapers.join(', ')}`)
        await runSelectedScrapers(selectedScrapers)
      } else {
        console.log('[Runner] Running full scraping pipeline...')
        await runFullPipeline({ parallel: isParallel })
      }
    } catch (err) {
      console.error('[Runner] Pipeline failed:', err)
    }

    await mongoose.disconnect()
    console.log('[Runner] Done. Disconnected from MongoDB.')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('[Runner] Fatal error:', err)
  process.exit(1)
})

require('dotenv').config()

const cron = require('node-cron')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { runAINewsAutomation } = require('../services/aiNewsAutomation')

const schedule = process.env.AI_NEWS_AUTOMATION_SCHEDULE || '0 9 * * *'

async function runOnce() {
  console.log(`[ai-news-automation] Starting run at ${new Date().toISOString()}`)
  const run = await runAINewsAutomation()
  console.log('[ai-news-automation] Finished', run.stats || {})
}

async function bootstrapAndRun() {
  await connectDB()
  try {
    await runOnce()
  } finally {
    await mongoose.connection.close()
  }
}

async function bootstrapAndSchedule() {
  await connectDB()
  console.log(`[ai-news-automation] Scheduler active with cron "${schedule}"`)

  cron.schedule(schedule, async () => {
    try {
      await runOnce()
    } catch (error) {
      console.error('[ai-news-automation] Scheduled run failed', error)
    }
  })

  try {
    await runOnce()
  } catch (error) {
    console.error('[ai-news-automation] Initial run failed', error)
  }
}

if (process.argv.includes('--watch')) {
  bootstrapAndSchedule().catch((error) => {
    console.error('[ai-news-automation] Scheduler bootstrap failed', error)
    process.exit(1)
  })
} else {
  bootstrapAndRun().catch((error) => {
    console.error('[ai-news-automation] Run failed', error)
    process.exit(1)
  })
}

require('dotenv').config()

const cron = require('node-cron')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { runStudentAutomationPipeline } = require('../services/contentPipeline')

const schedule = process.env.STUDENT_AUTOMATION_SCHEDULE || '0 */6 * * *'

async function runOnce() {
  const startedAt = new Date()
  console.log(`[student-automation] Starting pipeline at ${startedAt.toISOString()}`)
  const run = await runStudentAutomationPipeline()
  console.log('[student-automation] Pipeline finished', {
    status: run.status,
    fetched: run.stats?.fetched,
    stored: run.stats?.stored,
    indexed: run.stats?.indexed,
  })
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
  console.log(`[student-automation] Scheduler active with cron "${schedule}"`)

  cron.schedule(schedule, async () => {
    try {
      await runOnce()
    } catch (error) {
      console.error('[student-automation] Scheduled run failed', error)
    }
  })

  try {
    await runOnce()
  } catch (error) {
    console.error('[student-automation] Initial run failed', error)
  }
}

if (process.argv.includes('--watch')) {
  bootstrapAndSchedule().catch((error) => {
    console.error('[student-automation] Scheduler bootstrap failed', error)
    process.exit(1)
  })
} else {
  bootstrapAndRun().catch((error) => {
    console.error('[student-automation] Pipeline failed', error)
    process.exit(1)
  })
}

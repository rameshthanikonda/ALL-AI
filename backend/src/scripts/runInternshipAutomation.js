require('dotenv').config()

const cron = require('node-cron')
const mongoose = require('mongoose')
const { connectDB } = require('../config/db')
const { runInternshipAutomation } = require('../services/internshipAutomation')

const schedule = process.env.INTERNSHIP_AUTOMATION_SCHEDULE || '0 8 * * *'

async function runOnce() {
  console.log(`[internship-automation] Starting run at ${new Date().toISOString()}`)
  const run = await runInternshipAutomation()
  console.log('[internship-automation] Finished', run.stats || {})
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
  console.log(`[internship-automation] Scheduler active with cron "${schedule}"`)

  cron.schedule(schedule, async () => {
    try {
      await runOnce()
    } catch (error) {
      console.error('[internship-automation] Scheduled run failed', error)
    }
  })

  try {
    await runOnce()
  } catch (error) {
    console.error('[internship-automation] Initial run failed', error)
  }
}

if (process.argv.includes('--watch')) {
  bootstrapAndSchedule().catch((error) => {
    console.error('[internship-automation] Scheduler bootstrap failed', error)
    process.exit(1)
  })
} else {
  bootstrapAndRun().catch((error) => {
    console.error('[internship-automation] Run failed', error)
    process.exit(1)
  })
}

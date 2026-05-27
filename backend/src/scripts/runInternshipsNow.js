require('dotenv').config()
const mongoose = require('mongoose')
const { runInternshipAutomation } = require('../services/internshipAutomation')

async function run() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-ai-tools')
    console.log('Connected. Running internship automation...')
    
    const result = await runInternshipAutomation()
    console.log('Automation completed!', result)
  } catch (error) {
    console.error('Automation failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected.')
  }
}

run()

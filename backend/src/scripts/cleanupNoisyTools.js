require('dotenv').config()
const mongoose = require('mongoose')
const Tool = require('../models/Tool')

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  await mongoose.connect(uri)
  console.log('Connected to Mongo for cleanup')

  const conditions = [
    { name: { $regex: /hacker news/i } },
    { name: { $regex: /hnrss/i } },
    { name: { $regex: /<!\[CDATA\[/i } },
    { description: { $regex: /<!\[CDATA\[/i } },
    { url: { $regex: /hnrss\.org/i } },
    { url: { $regex: /news\.ycombinator\.com/i } },
  ]

  const query = { $or: conditions }
  try {
    const toRemove = await Tool.find(query).lean()
    if (!toRemove.length) {
      console.log('No noisy tools found')
      process.exit(0)
    }
    console.log('Found', toRemove.length, 'noisy tools. Deleting...')
    const slugs = toRemove.map((t) => t.slug)
    const res = await Tool.deleteMany({ slug: { $in: slugs } })
    console.log('Deleted', res.deletedCount, 'tools:', slugs.join(', '))
  } catch (err) {
    console.error('Cleanup failed', err)
  } finally {
    process.exit(0)
  }
}

run()

require('dotenv').config()
const mongoose = require('mongoose')
const Tool = require('../models/Tool')
const { legacyJunkMongoQuery } = require('../search/catalogFilter')

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  await mongoose.connect(uri)
  console.log('Connected to Mongo for cleanup')

  const query = legacyJunkMongoQuery()

  try {
    const toRemove = await Tool.find(query).lean()
    if (!toRemove.length) {
      console.log('No junk tools found')
      process.exit(0)
    }

    console.log(`Found ${toRemove.length} junk tools. Deleting...`)
    const slugs = toRemove.map((tool) => tool.slug)
    const result = await Tool.deleteMany({ slug: { $in: slugs } })
    console.log(`Deleted ${result.deletedCount}:`, slugs.join(', '))
  } catch (error) {
    console.error('Cleanup failed', error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
    process.exit(process.exitCode || 0)
  }
}

run()

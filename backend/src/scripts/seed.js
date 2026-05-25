require('dotenv').config()
const mongoose = require('mongoose')
const Tool = require('../models/Tool')
const { studentToolCatalog } = require('../data/studentToolCatalog')

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  await mongoose.connect(uri)
  console.log('Connected to Mongo for seeding')

  await Tool.deleteMany({ url: /^https:\/\/example\.com\/tools\//i })
  console.log('Removed generated placeholder tools')

  for (const tool of studentToolCatalog) {
    await Tool.updateOne({ slug: tool.slug }, { $set: tool }, { upsert: true })
    console.log('Upserted', tool.slug)
  }

  console.log('Seeding complete')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

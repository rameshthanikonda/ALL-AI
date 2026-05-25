require('dotenv').config()
const mongoose = require('mongoose')
const Staged = require('../models/StagedTool')

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  await mongoose.connect(uri)
  const found = await Staged.find({ $or: [ { name: /CDATA/i }, { name: /hacker/i }, { description: /CDATA/i }, { description: /hacker/i } ] }).lean()
  console.log('FOUND', found.length)
  console.log(found.map((f) => ({ name: f.name, slug: f.slug, source: f.source })))
  process.exit(0)
}

run()

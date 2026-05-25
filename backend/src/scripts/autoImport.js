require('dotenv').config()
const axios = require('axios')
const parse = require('csv-parse/sync')
const mongoose = require('mongoose')
const Tool = require('../models/Tool')
const cron = require('node-cron')
const fetchRSS = require('./fetchRSS')
const fetchProductHunt = require('./fetchProductHunt')
const scrapeAndUpsert = require('./genericScraper')

async function handleJsonOrCsvText(url, text, contentType) {
  let items = []
  if (contentType.includes('application/json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
    const data = JSON.parse(text)
    if (Array.isArray(data)) items = data
    else if (Array.isArray(data.tools)) items = data.tools
    else if (Array.isArray(data.data)) items = data.data
  } else if (contentType.includes('csv') || url.toLowerCase().endsWith('.csv')) {
    const records = parse.parse(text, { columns: true, skip_empty_lines: true })
    items = records
  }
  for (const raw of items) {
    const name = raw.name || raw.title || raw.tool_name
    if (!name) continue
    const slug = raw.slug || (name && String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    const doc = {
      name,
      slug,
      description: raw.description || raw.summary || '',
      url: raw.url || raw.link || '',
      category: raw.category || '',
      tags: Array.isArray(raw.tags) ? raw.tags : String(raw.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      logoUrl: raw.logoUrl || raw.logo || '',
      featured: Boolean(raw.featured),
    }
    await Tool.updateOne({ slug }, { $set: doc }, { upsert: true })
    console.log('Imported', slug)
  }
}

async function fetchAndUpsert(url) {
  try {
    // special handling for Product Hunt and RSS
    if (!url) return

    const BLOCKED_FEED_DOMAINS = ['hnrss.org', 'news.ycombinator.com', 'reddit.com', 'medium.com']
    const lower = url.toLowerCase()
    if (BLOCKED_FEED_DOMAINS.some((d) => lower.includes(d))) {
      console.log('Skipping blocked feed', url)
      return
    }

    if (url.includes('producthunt.com')) return fetchProductHunt(url)
    if (url.endsWith('.xml') || url.endsWith('.rss') || url.toLowerCase().includes('/rss') || url.toLowerCase().includes('feed')) return fetchRSS(url)

    // try to GET the URL and inspect content-type
    const res = await axios.get(url, { responseType: 'text', timeout: 15000 })
    const ct = (res.headers['content-type'] || '').toLowerCase()
    if (ct.includes('application/json') || ct.includes('csv') || res.data.trim().startsWith('[') || res.data.trim().startsWith('{')) {
      return handleJsonOrCsvText(url, res.data, ct)
    }

    // fallback: scrape the page and extract metadata
    return scrapeAndUpsert(url)
  } catch (err) {
    console.error('Failed to fetch feed', url, err.message)
  }
}

async function runOnce() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  await mongoose.connect(uri)
  console.log('Connected to Mongo for auto import')

  const feeds = (process.env.IMPORT_FEEDS || '').split(',').map((s) => s.trim()).filter(Boolean)
  for (const f of feeds) await fetchAndUpsert(f)

  console.log('Auto import finished')
  process.exit(0)
}

if (process.env.SCHEDULE_CRON) {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'
  mongoose.connect(uri).then(() => {
    console.log('Connected to Mongo for scheduled auto-import')
    cron.schedule(process.env.SCHEDULE_CRON, async () => {
      console.log('Running scheduled import')
      const feeds = (process.env.IMPORT_FEEDS || '').split(',').map((s) => s.trim()).filter(Boolean)
      for (const f of feeds) await fetchAndUpsert(f)
      console.log('Scheduled import done')
    })
  })
} else {
  runOnce()
}

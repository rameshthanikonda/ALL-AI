const fs = require('fs')
const path = require('path')
const ContentItem = require('../models/ContentItem')
const ImportRun = require('../models/ImportRun')
const Tool = require('../models/Tool')
const { meiliSearchClient } = require('../search/meiliSearch')
const { studentToolCatalog } = require('../data/studentToolCatalog')
const { normalizeContentItem, slugify } = require('./contentNormalizer')
const { runAINewsAutomation } = require('./aiNewsAutomation')

const TOOL_TARGET = Number(process.env.TOOL_TARGET || studentToolCatalog.length)
const PRIORITY_TOOL_ORDER = [
  'Windsurf',
  'Antigravity',
  'Gemini',
  'Claude',
  'ChatGPT',
  'Cursor',
  'Codex',
  'Perplexity',
  'DeepSeek',
  'Manus',
]

function compareTools(left, right) {
  const leftPriority = PRIORITY_TOOL_ORDER.findIndex((item) => item.toLowerCase() === String(left.name || '').trim().toLowerCase())
  const rightPriority = PRIORITY_TOOL_ORDER.findIndex((item) => item.toLowerCase() === String(right.name || '').trim().toLowerCase())

  if (leftPriority !== rightPriority) {
    if (leftPriority === -1) return 1
    if (rightPriority === -1) return -1
    return leftPriority - rightPriority
  }

  if (Boolean(left.featured) !== Boolean(right.featured)) return Number(right.featured) - Number(left.featured)

  return String(left.name || '').localeCompare(String(right.name || ''))
}

function readSeedContent() {
  const filePath = path.resolve(__dirname, '..', 'data', 'studentContentSeed.json')
  const text = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(text)
}

function mapContentItemToTool(item) {
  return {
    name: item.title,
    slug: slugify(item.slug || item.title),
    description: item.summary || item.description,
    url: item.url,
    category: item.category || 'Student Resource',
    tags: item.tags || [],
    featured: item.kind === 'tool',
    recentUpdates: [`Imported from ${item.source}`],
  }
}

async function runStudentAutomationPipeline() {
  const run = await ImportRun.create({
    pipeline: 'student-platform-bootstrap',
    notes: ['Scheduler Trigger', 'Fetch APIs / Scrape Sites', 'Clean Data', 'Generate Tags', 'Store in database', 'Update Search Index'],
  })

  try {
    const fetchedItems = readSeedContent().filter((item) => item.kind !== 'ai_news')
    const normalizedItems = fetchedItems.map((item) => normalizeContentItem(item))
    await Tool.deleteMany({ url: /^https:\/\/example\.com\/tools\//i })
    await ContentItem.deleteMany({ url: /^https:\/\/example\.com\//i })

    for (const item of normalizedItems) {
      await ContentItem.updateOne(
        { kind: item.kind, slug: item.slug },
        { $set: item, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      )

      if (item.kind === 'tool') {
        const toolDoc = mapContentItemToTool(item)
        await Tool.updateOne({ slug: toolDoc.slug }, { $set: toolDoc }, { upsert: true })
      }
    }

    await Tool.bulkWrite(
      studentToolCatalog.map((toolDoc) => ({
        updateOne: {
          filter: { slug: toolDoc.slug },
          update: { $set: toolDoc },
          upsert: true,
        },
      }))
    )

    const allTools = await Tool.find({}).lean()
    await meiliSearchClient.syncIfNeeded(allTools).catch(() => {})

    let aiNewsRun = null
    try {
      aiNewsRun = await runAINewsAutomation()
      run.notes.push(`AI news automation stored ${aiNewsRun.stats?.stored || 0} items.`)
    } catch (newsError) {
      run.notes.push(`AI news automation failed: ${newsError.message}`)
    }

    run.status = 'completed'
    run.finishedAt = new Date()
    run.stats = {
      fetched: fetchedItems.length + (aiNewsRun?.stats?.fetched || 0),
      cleaned: normalizedItems.length + (aiNewsRun?.stats?.cleaned || 0),
      stored: normalizedItems.length + (aiNewsRun?.stats?.stored || 0),
      indexed: allTools.length,
    }
    run.notes.push(`Pipeline completed successfully. Tool catalog progress: ${allTools.length}/${TOOL_TARGET}`)
    await run.save()

    return run
  } catch (error) {
    run.status = 'failed'
    run.finishedAt = new Date()
    run.notes.push(error.message)
    await run.save()
    throw error
  }
}

async function fetchPortalOverview() {
  const [toolsCount, internshipsCount, codingCount, gateCount, newsCount, latestItems, allTools] = await Promise.all([
    Tool.countDocuments({}),
    ContentItem.countDocuments({ kind: { $in: ['internship', 'job'] }, status: 'active' }),
    ContentItem.countDocuments({ kind: 'coding_problem', status: 'active' }),
    ContentItem.countDocuments({ kind: 'gate_resource', status: 'active' }),
    ContentItem.countDocuments({ kind: 'ai_news', status: 'active' }),
    ContentItem.find({ status: 'active' }).sort({ publishedAt: -1 }).limit(20).lean(),
    Tool.find({}).lean(),
  ])
  const featuredTools = allTools.sort(compareTools).slice(0, 12)

  const bucket = (kind) => latestItems.filter((item) => item.kind === kind)

  return {
    stats: {
      tools: toolsCount,
      internships: internshipsCount,
      codingProblems: codingCount,
      gateResources: gateCount,
      aiNews: newsCount,
      toolTarget: TOOL_TARGET,
    },
    automation: {
      pipeline: 'student-platform-bootstrap',
      stages: ['Scheduler Trigger', 'Fetch APIs / Scrape Sites', 'Clean Data', 'Generate Tags', 'Store in Firestore or MongoDB', 'Update Search Index'],
      guidance: [
        'Use APIs, cached data, and slow scheduled scraping where possible.',
        'Avoid aggressive scraping on LinkedIn and LeetCode.',
        'Grow the tool catalog through validated feeds and curated imports instead of fake generated entries.',
      ],
    },
    sections: {
      tools: featuredTools.map((tool) => ({
        kind: 'tool',
        title: tool.name,
        slug: tool.slug,
        summary: tool.description,
        category: tool.category,
        tags: tool.tags || [],
      })),
      internships: bucket('internship').concat(bucket('job')).slice(0, 6),
      coding: bucket('coding_problem').slice(0, 6),
      gate: bucket('gate_resource').slice(0, 6),
      news: bucket('ai_news').slice(0, 6),
      dashboard: bucket('dashboard_card').slice(0, 4),
    },
  }
}

module.exports = {
  fetchPortalOverview,
  mapContentItemToTool,
  runStudentAutomationPipeline,
}

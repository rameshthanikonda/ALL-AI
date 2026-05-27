const axios = require('axios')
const cheerio = require('cheerio')
const ImportRun = require('../models/ImportRun')
const ContentItem = require('../models/ContentItem')
const { normalizeContentItem, slugify, normalizeText } = require('./contentNormalizer')

const DEFAULT_SOURCES = [
  // Job Portals & Aggregators
  { name: 'Internshala', type: 'internship', url: 'https://internshala.com/internships/' },
  { name: 'Naukri', type: 'job', url: 'https://www.naukri.com/' },
  { name: 'LinkedIn Jobs', type: 'job', url: 'https://www.linkedin.com/jobs/software-engineer-jobs/' },
  { name: 'Unstop', type: 'internship', url: 'https://unstop.com/internships' },
  { name: 'Wellfound Engineering', type: 'job', url: 'https://wellfound.com/jobs' },
  { name: 'Indeed Software Jobs', type: 'job', url: 'https://in.indeed.com/jobs?q=software+engineer+fresher' },

  // Big Tech
  { name: 'Google Careers', type: 'job', url: 'https://www.google.com/about/careers/applications/jobs/results' },
  { name: 'Microsoft Students', type: 'internship', url: 'https://careers.microsoft.com/v2/global/en/programs/students.html' },
  { name: 'Amazon Jobs', type: 'job', url: 'https://www.amazon.jobs/en/teams/internships-for-students' },
  { name: 'Adobe University', type: 'job', url: 'https://careers.adobe.com/us/en/university' },
  { name: 'Meta Careers', type: 'job', url: 'https://www.metacareers.com/jobs' },
  { name: 'Apple Jobs', type: 'job', url: 'https://jobs.apple.com/en-us/search' },
  { name: 'NVIDIA Careers', type: 'job', url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite' },
  { name: 'Oracle Careers', type: 'job', url: 'https://careers.oracle.com/jobs/' },
  { name: 'Salesforce Careers', type: 'job', url: 'https://careers.salesforce.com/en/jobs/' },

  // Retail & Consumer
  { name: 'Walmart Careers', type: 'job', url: 'https://careers.walmart.com/technology' },
  { name: 'Flipkart Careers', type: 'job', url: 'https://www.flipkartcareers.com/' },
  { name: 'Samsung Careers', type: 'job', url: 'https://www.samsung.com/in/about-us/careers/' },

  // Hardware & Electronics
  { name: 'Dell Careers', type: 'job', url: 'https://jobs.dell.com/' },

  // Finance & Consulting
  { name: 'Goldman Sachs Careers', type: 'job', url: 'https://www.goldmansachs.com/careers/students/' },
  { name: 'PayPal Careers', type: 'job', url: 'https://careers.pypl.com/home/' },
  { name: 'Deloitte Careers', type: 'job', url: 'https://apply.deloitte.com/' },

  // Indian IT Services
  { name: 'TCS Careers', type: 'job', url: 'https://www.tcs.com/careers' },
  { name: 'Infosys Careers', type: 'job', url: 'https://www.infosys.com/careers/' },
  { name: 'Cognizant Careers', type: 'job', url: 'https://careers.cognizant.com/' },
  { name: 'Wipro Careers', type: 'job', url: 'https://careers.wipro.com/' },
  { name: 'HCLTech Careers', type: 'job', url: 'https://www.hcltech.com/careers' },

  // Startups & Transport
  { name: 'Uber Careers', type: 'job', url: 'https://www.uber.com/us/en/careers/' },
  { name: 'Graviton Research', type: 'job', url: 'https://graviton.in/careers' },
]

function readSources() {
  try {
    const raw = process.env.INTERNSHIP_SOURCE_CONFIG
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to parse INTERNSHIP_SOURCE_CONFIG:', error.message)
  }

  return DEFAULT_SOURCES
}

function extractText($node) {
  return normalizeText($node.text())
}

function detectKind(sourceType, text) {
  const haystack = String(text || '').toLowerCase()
  if (sourceType === 'internship') return 'internship'
  if (sourceType === 'job') return 'job'
  if (haystack.includes('intern')) return 'internship'
  return 'job'
}

function detectTags(text) {
  const lower = String(text || '').toLowerCase()
  const tags = new Set()
  ;[
    ['stipend', 'stipend'],
    ['remote', 'remote'],
    ['hybrid', 'hybrid'],
    ['full time', 'full-time'],
    ['intern', 'internship'],
    ['sde', 'sde'],
    ['software', 'software'],
    ['frontend', 'frontend'],
    ['backend', 'backend'],
    ['data', 'data'],
    ['analyst', 'analyst'],
    ['ppo', 'ppo'],
  ].forEach(([needle, tag]) => {
    if (lower.includes(needle)) tags.add(tag)
  })
  return Array.from(tags)
}

function inferCompany(title, sourceName) {
  const cleaned = normalizeText(title)
  const parts = cleaned.split(/[-|@]/).map((item) => normalizeText(item)).filter(Boolean)
  if (parts.length > 1) return parts[parts.length - 1]
  return sourceName
}

function buildSummary(text) {
  const trimmed = normalizeText(text)
  if (!trimmed) return ''
  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed
}

function pickHref(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString()
  } catch (error) {
    return ''
  }
}

function scrapeCardsFromHtml(html, source) {
  const $ = cheerio.load(html)
  const cards = []

  $('a').each((_, element) => {
    if (cards.length >= 40) return false

    const $el = $(element)
    const href = pickHref(source.url, $el.attr('href'))
    const title = extractText($el)
    const parentText = extractText($el.parent())
    const combinedText = normalizeText(`${title} ${parentText}`)

    if (!href || !title) return

    const lower = combinedText.toLowerCase()
    const looksRelevant =
      lower.includes('intern') ||
      lower.includes('job') ||
      lower.includes('apply') ||
      lower.includes('hiring') ||
      lower.includes('engineer') ||
      lower.includes('developer')

    if (!looksRelevant) return

    cards.push({
      kind: detectKind(source.type, combinedText),
      title,
      summary: buildSummary(parentText || title),
      description: combinedText,
      url: href,
      source: source.name,
      sourceType: 'scrape',
      provider: source.name,
      category: source.type === 'internship' ? 'Internships' : 'Jobs',
      tags: detectTags(combinedText),
      company: inferCompany(title, source.name),
      metadata: {
        sourceUrl: source.url,
      },
    })
  })

  return cards
}

async function fetchSourceItems(source) {
  const response = await axios.get(source.url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; StudentAIToolsBot/1.0)',
    },
  })

  return scrapeCardsFromHtml(response.data, source)
}

async function upsertItems(items) {
  let stored = 0

  for (const rawItem of items) {
    if (!rawItem.title || !rawItem.url) continue

    const normalized = normalizeContentItem({
      ...rawItem,
      slug: rawItem.slug || slugify(`${rawItem.kind}-${rawItem.title}`),
      publishedAt: new Date(),
    })

    await ContentItem.updateOne(
      { kind: normalized.kind, slug: normalized.slug },
      { $set: normalized, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    )
    stored += 1
  }

  return stored
}

async function runInternshipAutomation() {
  const sources = readSources()
  const run = await ImportRun.create({
    pipeline: 'internship-automation',
    notes: sources.map((source) => `Queued source: ${source.name}`),
  })

  try {
    let fetched = 0
    let stored = 0

    for (const source of sources) {
      try {
        const items = await fetchSourceItems(source)
        fetched += items.length
        stored += await upsertItems(items)
        run.notes.push(`Imported ${items.length} items from ${source.name}`)
      } catch (error) {
        run.notes.push(`Source failed: ${source.name} (${error.message})`)
      }
    }

    run.status = 'completed'
    run.finishedAt = new Date()
    run.stats = {
      fetched,
      cleaned: fetched,
      stored,
      indexed: 0,
    }
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

module.exports = {
  readSources,
  runInternshipAutomation,
}

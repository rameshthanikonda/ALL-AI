const axios = require('axios')
const cheerio = require('cheerio')
const Parser = require('rss-parser')
const ContentItem = require('../models/ContentItem')
const ImportRun = require('../models/ImportRun')
const { normalizeContentItem, slugify, normalizeText } = require('./contentNormalizer')

const parser = new Parser()

const DEFAULT_NEWS_SOURCES = [
  { name: 'OpenAI News', type: 'rss', url: 'https://openai.com/news/rss.xml' },
  { name: 'Google AI Blog', type: 'rss', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'Hugging Face Blog', type: 'rss', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Anthropic News', type: 'scrape', url: 'https://www.anthropic.com/news' },
  { name: 'NVIDIA AI News', type: 'rss', url: 'https://blogs.nvidia.com/feed/' },
  { name: 'Microsoft AI Blog', type: 'rss', url: 'https://blogs.microsoft.com/ai/feed/' },
  { name: 'Meta AI News', type: 'scrape', url: 'https://ai.meta.com/blog/' },
]

function readNewsSources() {
  try {
    const raw = process.env.AI_NEWS_SOURCE_CONFIG
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to parse AI_NEWS_SOURCE_CONFIG:', error.message)
  }

  return DEFAULT_NEWS_SOURCES
}

function buildSummary(text) {
  const trimmed = normalizeText(text)
  if (!trimmed) return ''
  return trimmed.length > 260 ? `${trimmed.slice(0, 257)}...` : trimmed
}

function pickHref(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString()
  } catch (error) {
    return ''
  }
}

function detectNewsTags(text) {
  const lower = String(text || '').toLowerCase()
  const tags = new Set(['ai', 'news'])
  ;[
    ['openai', 'openai'],
    ['google', 'google'],
    ['anthropic', 'anthropic'],
    ['hugging face', 'hugging-face'],
    ['model', 'models'],
    ['llm', 'llm'],
    ['agent', 'agents'],
    ['research', 'research'],
    ['api', 'api'],
    ['launch', 'launch'],
    ['release', 'release'],
    ['developer', 'developer'],
  ].forEach(([needle, tag]) => {
    if (lower.includes(needle)) tags.add(tag)
  })
  return Array.from(tags).slice(0, 8)
}

function mapNewsItem(source, item, fallbackUrl) {
  const title = normalizeText(item.title || item.name)
  const description = normalizeText(item.contentSnippet || item.content || item.summary || item.description || '')
  const url = normalizeText(item.link || item.url || fallbackUrl)

  if (!title || !url) return null

  return {
    kind: 'ai_news',
    title,
    summary: buildSummary(description || title),
    description: description || title,
    url,
    source: source.name,
    sourceType: source.type,
    provider: source.name,
    category: 'AI News',
    tags: detectNewsTags(`${title} ${description}`),
    publishedAt: item.isoDate || item.pubDate || item.publishedAt || new Date(),
    metadata: {
      sourceUrl: source.url,
    },
  }
}

async function fetchRssSourceItems(source) {
  const feed = await parser.parseURL(source.url)

  return (feed.items || [])
    .map((item) => mapNewsItem(source, item))
    .filter(Boolean)
    .slice(0, 12)
}

async function fetchScrapedSourceItems(source) {
  const response = await axios.get(source.url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; StudentAIToolsBot/1.0)',
    },
  })

  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('a').each((_, element) => {
    if (items.length >= 12) return false

    const $el = $(element)
    const href = pickHref(source.url, $el.attr('href'))
    const title = normalizeText($el.text())
    const context = normalizeText($el.closest('article, section, div').text())

    if (!href || !title || title.length < 18 || seen.has(href)) return

    const combined = `${title} ${context}`.toLowerCase()
    const looksRelevant =
      combined.includes('ai') ||
      combined.includes('model') ||
      combined.includes('research') ||
      combined.includes('launch') ||
      combined.includes('release')

    if (!looksRelevant) return

    seen.add(href)
    const mapped = mapNewsItem(
      source,
      {
        title,
        description: context,
        url: href,
      },
      href
    )

    if (mapped) items.push(mapped)
  })

  return items
}

async function fetchSourceItems(source) {
  if (source.type === 'scrape') {
    return fetchScrapedSourceItems(source)
  }

  return fetchRssSourceItems(source)
}

async function upsertItems(items) {
  let stored = 0

  for (const rawItem of items) {
    const normalized = normalizeContentItem({
      ...rawItem,
      slug: rawItem.slug || slugify(`ai-news-${rawItem.source}-${rawItem.title}`),
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

async function runAINewsAutomation() {
  const sources = readNewsSources()
  const run = await ImportRun.create({
    pipeline: 'ai-news-automation',
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
  readNewsSources,
  runAINewsAutomation,
}

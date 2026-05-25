const Parser = require('rss-parser')
const parser = new Parser()
const Tool = require('../models/Tool')
const { stageDoc } = require('./stageHelper')
const { URL } = require('url')

const BLOCKLIST_DOMAINS = ['hnrss.org', 'news.ycombinator.com', 'reddit.com', 'medium.com', 'twitter.com']
const ALLOW_KEYWORDS = ['tool', 'product', 'app', 'platform', 'ai', 'saas', 'software', 'beta', 'launch', 'signup', 'try', 'demo', 'pricing']

function looksLikeTool(title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase()
  return ALLOW_KEYWORDS.some((k) => text.includes(k))
}

async function fetchRSSFeed(url) {
  try {
    const feed = await parser.parseURL(url)
    for (const item of feed.items || []) {
      const name = item.title
      const link = item.link || ''
      if (!name || !link) continue
      try {
        const domain = new URL(link).hostname
        if (BLOCKLIST_DOMAINS.some((d) => domain.includes(d))) {
          console.log('Skipping RSS item from blocked domain', domain, name)
          continue
        }
      } catch (e) {
        // ignore URL parse failures
      }

      const description = item.contentSnippet || item.content || item.summary || ''
      if (!looksLikeTool(name, description)) {
        console.log('Skipping RSS item that does not look like a tool:', name)
        continue
      }

      const slug = item.guid || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const doc = {
        name,
        slug,
        description,
        url: link,
        tags: (item.categories || []).map((t) => String(t).trim()).filter(Boolean),
      }

      // Stage instead of directly upserting to public tools
      await stageDoc(url, doc)
    }
  } catch (err) {
    console.error('RSS fetch failed', url, err.message)
  }
}

module.exports = fetchRSSFeed

const axios = require('axios')
const cheerio = require('cheerio')
const Tool = require('../models/Tool')
const { stageDoc } = require('./stageHelper')

const ENTERPRISE_DOMAINS = ['google.com', 'openai.com', 'microsoft.com', 'anthropic.com']
const ALLOW_KEYWORDS = ['tool', 'product', 'app', 'platform', 'ai', 'service', 'saas', 'software', 'pricing', 'signup', 'get started', 'try', 'demo']

function looksLikeToolFromPage($, name, description) {
  const text = `${name || ''} ${description || ''} ${$('body').text()}`.toLowerCase()
  const hasKeyword = ALLOW_KEYWORDS.some((k) => text.includes(k))
  // look for CTA keywords in buttons/links
  const ctaText = $('a,button').text().toLowerCase()
  const hasCta = ['signup', 'get started', 'try', 'pricing', 'download', 'demo'].some((k) => ctaText.includes(k))
  const ogType = $('meta[property="og:type"]').attr('content') || ''
  return hasKeyword || hasCta || ogType.toLowerCase().includes('product')
}
async function scrapeAndUpsert(url) {
  try {
    const res = await axios.get(url, { timeout: 15000, responseType: 'text' })
    const $ = cheerio.load(res.data)
    const name = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || ''
    const logo = $('meta[property="og:image"]').attr('content') || $('link[rel="icon"]').attr('href') || ''
    const hostname = (new URL(url)).hostname
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : hostname.replace(/[^a-z0-9]+/g, '-')
    const enterprise = ENTERPRISE_DOMAINS.some((d) => hostname.endsWith(d))

    // Only upsert if page looks like a product/tool to avoid scraping news articles or generic pages
    if (!looksLikeToolFromPage($, name, description)) {
      console.log('Skipping scraped page that does not resemble a tool:', url)
      return
    }

    const doc = {
      name: name || hostname,
      slug,
      description: description || '',
      url,
      logoUrl: logo || '',
      enterprise,
    }
    // Stage instead of directly creating public tool
    await stageDoc(url, doc)
    console.log('Scraped and staged', slug)
  } catch (err) {
    console.error('Scrape failed for', url, err.message)
  }
}

module.exports = scrapeAndUpsert

const axios = require('axios')
const { filterValidTools } = require('./toolValidator')
const { rankToolsByQuery } = require('./queryUtils')
const { withBrowserPage, scrollPage } = require('./browser')

const GOOGLE_API = 'https://www.googleapis.com/customsearch/v1'

function buildSearchQuery(query) {
  return `${String(query || '').trim()} AI tool software`
}

function cleanResultTitle(title) {
  return String(title || '')
    .replace(/\s*[-|–]\s*.+$/, '')
    .replace(/\s*\|.*/, '')
    .replace(/\s*:\s*.*$/, '')
    .trim()
}

function scoreGoogleItem(item, query) {
  let score = 0
  const link = String(item.link || item.url || '').toLowerCase()
  const title = String(item.title || item.name || '').toLowerCase()
  const snippet = String(item.snippet || item.description || '').toLowerCase()
  const queryLower = String(query || '').toLowerCase()
  const terms = queryLower.split(/\s+/).filter((t) => t.length > 2)

  for (const term of terms) {
    if (title.includes(term)) score += 4
    if (snippet.includes(term)) score += 2
  }

  if (/ai|tool|app|platform|software|saas/i.test(`${title} ${snippet}`)) score += 3
  if (link.includes('/tool') || link.includes('toolify') || link.includes('futurepedia')) score += 2

  return score
}

function mapGoogleItems(items, query) {
  const mapped = items
    .map((item) => ({
      name: cleanResultTitle(item.title),
      description: String(item.snippet || '').trim(),
      url: item.link,
      source: 'google',
      tags: ['google', 'scraped'],
      _rankScore: scoreGoogleItem(item, query),
    }))
    .filter((item) => item.name && item.url && item.description)

  return rankToolsByQuery(
    mapped
      .sort((left, right) => right._rankScore - left._rankScore)
      .map(({ _rankScore, ...tool }) => tool),
    query,
    12
  )
}

async function dismissGoogleConsent(page) {
  try {
    const selectors = [
      'button:has-text("Accept all")',
      'button:has-text("Accept All")',
      'button:has-text("I agree")',
      'button[id*="accept"]',
      'form[action*="consent"] button',
    ]
    for (const selector of selectors) {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 1500 })) {
        await button.click({ timeout: 3000 })
        await page.waitForTimeout(1000)
        break
      }
    }
  } catch {
    // consent banner not shown
  }
}

async function scrapeGoogleResults(page) {
  return page.evaluate(() => {
    const results = []
    const seen = new Set()

    function pushResult(title, url, snippet) {
      if (!title || !url || !url.startsWith('http')) return
      if (seen.has(url)) return
      if (/google\.com|gstatic\.com|youtube\.com\/redirect/i.test(url)) return

      seen.add(url)
      results.push({
        title: title.trim(),
        link: url,
        snippet: (snippet || '').replace(/\s+/g, ' ').trim().slice(0, 320),
      })
    }

    document.querySelectorAll('div.g, div[data-hveid]').forEach((block) => {
      const heading = block.querySelector('a h3, h3')
      const anchor = heading?.closest('a') || block.querySelector('a[href^="http"]')
      if (!anchor) return

      const title = heading?.innerText || anchor.innerText || ''
      const url = anchor.href
      const snippet =
        block.querySelector('[data-sncf], .VwiC3b, .IsZvec, .st, span')?.innerText ||
        block.innerText.replace(title, '')

      pushResult(title, url, snippet)
    })

    if (results.length < 3) {
      document.querySelectorAll('a h3').forEach((heading) => {
        const anchor = heading.closest('a')
        if (!anchor?.href) return
        const card = anchor.closest('div')
        pushResult(heading.innerText, anchor.href, card?.innerText?.replace(heading.innerText, ''))
      })
    }

    return results.slice(0, 12)
  })
}

async function searchGoogleScrape(query) {
  const searchQuery = buildSearchQuery(query)
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=en&num=12`

  console.log(`[GoogleScrape] ${searchUrl}`)

  return withBrowserPage(async (page) => {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(2000)
    await dismissGoogleConsent(page)
    await page.waitForTimeout(1500)
    await scrollPage(page, 2)

    const items = await scrapeGoogleResults(page)
    const tools = mapGoogleItems(items, query)
    const valid = filterValidTools(tools)

    console.log(`[GoogleScrape] ${valid.length} tools for "${query}"`)
    return valid
  })
}

async function searchGoogleApi(query) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID
  if (!apiKey || !cx) return []

  const response = await axios.get(GOOGLE_API, {
    params: {
      key: apiKey,
      cx,
      q: buildSearchQuery(query),
      num: 10,
      safe: 'active',
    },
    timeout: 12000,
  })

  const items = (response.data?.items || []).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }))

  return filterValidTools(mapGoogleItems(items, query))
}

async function searchGoogle(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  try {
    const scraped = await searchGoogleScrape(trimmed)
    if (scraped.length > 0) return scraped
  } catch (error) {
    console.warn('[GoogleScrape] Scrape failed:', error.message)
  }

  try {
    const apiResults = await searchGoogleApi(trimmed)
    if (apiResults.length > 0) {
      console.log(`[GoogleScrape] API fallback: ${apiResults.length} tools`)
      return apiResults
    }
  } catch (error) {
    console.warn('[GoogleScrape] API fallback failed:', error.message)
  }

  return []
}

module.exports = {
  searchGoogle,
  searchGoogleScrape,
}

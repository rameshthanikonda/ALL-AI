const { chromium } = require('playwright')
const { resolveDirectoryCategories, rankToolsByQuery, tokenizeQuery } = require('./queryUtils')

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const BROWSER_OPTIONS = { headless: true }
const PAGE_OPTIONS = {
  userAgent: USER_AGENT,
  viewport: { width: 1280, height: 900 },
  locale: 'en-US',
}

/**
 * Extract tool cards from a Futurepedia listing page in the browser context.
 */
function extractFuturepediaToolsScript() {
  const tools = []
  const seen = new Set()

  const anchors = document.querySelectorAll('a[href*="/tool/"]')
  anchors.forEach((anchor) => {
    try {
      const url = new URL(anchor.href, window.location.origin)
      if (!/\/tool\/[^/]+$/i.test(url.pathname)) return

      const slug = url.pathname.split('/').pop()
      if (!slug || seen.has(slug)) return

      const card =
        anchor.closest('article, li, [class*="card"], [class*="Card"], div') || anchor.parentElement

      let externalUrl = ''
      if (card) {
        const visitLink = card.querySelector('a[href*="utm_source=futurepedia"], a:not([href*="futurepedia.io"])')
        if (visitLink) {
          const href = visitLink.href || ''
          if (href && !href.includes('futurepedia.io')) externalUrl = href
        }
      }

      const cardText = (card?.innerText || '').replace(/\s+/g, ' ').trim()
      const name = (anchor.innerText || '')
        .replace(/Rated\s+\d.*/i, '')
        .replace(/Add bookmark.*/i, '')
        .trim()

      if (!name || name.length < 2 || name.length > 120) return
      if (/^(visit|get deal|trending|popular|new)$/i.test(name)) return

      let description = ''
      if (cardText) {
        const withoutName = cardText.replace(name, '').trim()
        description = withoutName
          .replace(/Rated\s+\d out of \d.*/gi, '')
          .replace(/#\S+/g, '')
          .replace(/(Free|Freemium|Paid|Free Trial)/gi, '')
          .trim()
      }

      seen.add(slug)
      tools.push({
        name,
        description: description || `AI tool listed on Futurepedia: ${name}`,
        url: externalUrl || `https://www.futurepedia.io/tool/${slug}`,
        source: 'futurepedia',
        tags: ['futurepedia', 'directory-search'],
      })
    } catch {
      // ignore malformed anchors
    }
  })

  return tools
}

async function scrollListing(page) {
  for (let step = 0; step < 4; step++) {
    await page.evaluate(() => window.scrollBy(0, 900))
    await page.waitForTimeout(700)
  }
}

async function scrapeFuturepediaListing(page, listingUrl, label) {
  console.log(`[DirectorySearch] Loading ${label}: ${listingUrl}`)
  await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(3500)
  await scrollListing(page)
  return page.evaluate(extractFuturepediaToolsScript)
}

async function withBrowser(run) {
  let browser
  try {
    browser = await chromium.launch(BROWSER_OPTIONS)
    const context = await browser.newContext(PAGE_OPTIONS)
    const page = await context.newPage()
    return await run(page)
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Search Futurepedia by category pages + search listing, then rank by query relevance.
 */
async function searchFuturepediaDirectory(query) {
  const categories = resolveDirectoryCategories(query)
  const urls = [
    `https://www.futurepedia.io/search?q=${encodeURIComponent(query)}`,
    ...categories.map((slug) => `https://www.futurepedia.io/ai-tools/${slug}`),
  ]

  const uniqueUrls = [...new Set(urls)]

  return withBrowser(async (page) => {
    const collected = []

    for (const url of uniqueUrls) {
      try {
        const batch = await scrapeFuturepediaListing(page, url, 'futurepedia')
        collected.push(...batch)
      } catch (error) {
        console.warn(`[DirectorySearch] Futurepedia listing failed (${url}):`, error.message)
      }
    }

    const deduped = dedupeRawTools(collected)
    const ranked = rankToolsByQuery(deduped, query, 12)

    if (ranked.length > 0) {
      console.log(`[DirectorySearch] Futurepedia returned ${ranked.length} relevant tools for "${query}"`)
      return ranked
    }

    const queryTerms = tokenizeQuery(query)
    if (queryTerms.length === 0) return deduped.slice(0, 8)

    const loose = deduped.filter((tool) => {
      const haystack = `${tool.name} ${tool.description}`.toLowerCase()
      return queryTerms.some((term) => haystack.includes(term))
    })

    return (loose.length ? loose : deduped).slice(0, 8)
  })
}

function dedupeRawTools(tools) {
  const seen = new Set()
  return tools.filter((tool) => {
    const key = String(tool.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Run AI directory search (currently Futurepedia; extensible for more sources).
 */
async function searchAiToolDirectories(query) {
  if (!String(query || '').trim()) return []

  const results = await searchFuturepediaDirectory(query)
  return results
}

module.exports = {
  searchAiToolDirectories,
  searchFuturepediaDirectory,
  dedupeRawTools,
}

const axios = require('axios')
const { filterValidTools } = require('./toolValidator')
const { rankToolsByQuery, tokenizeQuery } = require('./queryUtils')
const { withBrowserPage, scrollPage } = require('./browser')

const GOOGLE_API = 'https://www.googleapis.com/customsearch/v1'

const BLOCKED_RESULT_HOSTS = [
  'google.com',
  'gstatic.com',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'reddit.com',
  'quora.com',
  'pinterest.com',
  'wikipedia.org',
  'mozilla.org',
  'w3.org',
  'stackoverflow.com',
]

function buildHumanQueries(query) {
  const base = String(query || '').trim()
  if (!base) return []

  if (/\bai\s+tool/i.test(base)) return [base]

  return [
    `best ai tools for ${base}`,
    `${base} ai tools`,
    `${base} ai software`,
  ]
}

function cleanResultTitle(title) {
  return String(title || '')
    .replace(/\s*[-|–]\s*.+$/, '')
    .replace(/\s*\|.*/, '')
    .replace(/\s*:\s*[^:]{40,}$/, '')
    .trim()
}

function isBlockedResultUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return BLOCKED_RESULT_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))
  } catch {
    return true
  }
}

function scoreGoogleItem(item, query) {
  let score = 0
  const link = String(item.link || '').toLowerCase()
  const title = String(item.title || '').toLowerCase()
  const snippet = String(item.snippet || '').toLowerCase()
  const terms = tokenizeQuery(query)

  for (const term of terms) {
    if (title.includes(term)) score += 5
    if (snippet.includes(term)) score += 3
  }

  if (/ai|tool|app|platform|software|generator|assistant/i.test(`${title} ${snippet}`)) score += 4
  if (link.includes('toolify') || link.includes('futurepedia') || link.includes('/tool')) score += 3

  return score
}

function mapGoogleItems(items, query) {
  const mapped = items
    .map((item) => {
      const name = cleanResultTitle(item.title)
      const description =
        String(item.snippet || '').trim() ||
        `${name} is an AI tool that helps with ${query}.`

      return {
        name,
        description,
        url: item.link,
        source: 'google',
        tags: ['google', 'discovered'],
        _rankScore: scoreGoogleItem(item, query),
      }
    })
    .filter((item) => item.name && item.url && !isBlockedResultUrl(item.url))

  const sorted = mapped
    .sort((left, right) => right._rankScore - left._rankScore)
    .map(({ _rankScore, ...tool }) => tool)

  return rankToolsByQuery(sorted, query, 12)
}

async function dismissGoogleConsent(page) {
  const selectors = [
    '#L2AGLb',
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'button[aria-label*="Accept"]',
  ]

  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 1200 })) {
        await button.click({ timeout: 3000 })
        await page.waitForTimeout(800)
        return
      }
    } catch {
      // try next selector
    }
  }
}

async function detectGoogleBlock(page) {
  const state = await page.evaluate(() => {
    const title = document.title || ''
    const body = document.body?.innerText?.slice(0, 500) || ''
    return {
      title,
      blocked:
        /unusual traffic|not a robot|captcha|sorry/i.test(title) ||
        /unusual traffic|not a robot|captcha/i.test(body),
      hasResults: Boolean(document.querySelector('#search, #rso, div.g, a h3')),
    }
  })
  return state
}

async function extractGoogleResults(page) {
  return page.evaluate(() => {
    const results = []
    const seen = new Set()

    function add(title, url, snippet) {
      const cleanTitle = (title || '').trim()
      const cleanSnippet = (snippet || '').replace(/\s+/g, ' ').trim()
      if (!cleanTitle || !url || !url.startsWith('http')) return
      if (seen.has(url)) return
      seen.add(url)
      results.push({ title: cleanTitle, link: url, snippet: cleanSnippet.slice(0, 320) })
    }

    document.querySelectorAll('div.g').forEach((block) => {
      const link = block.querySelector('a:has(h3)')
      const heading = link?.querySelector('h3')
      if (!link || !heading) return
      const snippet =
        block.querySelector('.VwiC3b, .IsZvec, [data-sncf]')?.textContent ||
        block.innerText.replace(heading.textContent, '')
      add(heading.textContent, link.href, snippet)
    })

    if (results.length < 4) {
      document.querySelectorAll('a h3').forEach((heading) => {
        const link = heading.closest('a')
        if (!link?.href) return
        const region = link.closest('div')?.parentElement
        add(heading.textContent, link.href, region?.innerText?.replace(heading.textContent, ''))
      })
    }

    return results.slice(0, 14)
  })
}

async function humanGoogleSearch(page, query) {
  const queries = buildHumanQueries(query)

  for (const humanQuery of queries) {
    await page.goto('https://www.google.com/?hl=en', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(1200)
    await dismissGoogleConsent(page)

    const searchBox = page.locator('textarea[name="q"], input[name="q"]').first()
    await searchBox.waitFor({ state: 'visible', timeout: 15000 })
    await searchBox.click()
    await searchBox.fill(humanQuery)
    await page.waitForTimeout(400)
    await page.keyboard.press('Enter')

    try {
      await page.waitForSelector('#search, #rso, div.g', { timeout: 20000 })
    } catch {
      continue
    }

    await page.waitForTimeout(2000)
    await scrollPage(page, 2)

    const blockState = await detectGoogleBlock(page)
    if (blockState.blocked) {
      console.warn('[GoogleScrape] Google blocked automation, trying next query variant')
      continue
    }

    const items = await extractGoogleResults(page)
    if (items.length > 0) {
      console.log(`[GoogleScrape] Human search "${humanQuery}" → ${items.length} raw results`)
      return items
    }
  }

  return []
}

async function directGoogleSearch(page, query) {
  const humanQuery = buildHumanQueries(query)[0]
  const url = `https://www.google.com/search?q=${encodeURIComponent(humanQuery)}&hl=en&num=12`

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(2000)
  await dismissGoogleConsent(page)
  await scrollPage(page, 2)

  const blockState = await detectGoogleBlock(page)
  if (blockState.blocked) return []

  return extractGoogleResults(page)
}

async function searchGoogleScrape(query) {
  console.log(`[GoogleScrape] Human-style search for: ${query}`)

  return withBrowserPage(async (page) => {
    let items = await humanGoogleSearch(page, query)

    if (!items.length) {
      items = await directGoogleSearch(page, query)
    }

    const tools = mapGoogleItems(items, query)
    const valid = filterValidTools(tools)

    console.log(`[GoogleScrape] ${valid.length} AI tools for "${query}"`)
    return valid
  }, { timeout: 90000 })
}

async function searchGoogleApi(query) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID
  if (!apiKey || !cx) return []

  const humanQuery = buildHumanQueries(query)[0]
  const response = await axios.get(GOOGLE_API, {
    params: { key: apiKey, cx, q: humanQuery, num: 10, safe: 'active' },
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
    return await searchGoogleApi(trimmed)
  } catch (error) {
    console.warn('[GoogleScrape] API fallback failed:', error.message)
    return []
  }
}

module.exports = {
  searchGoogle,
  searchGoogleScrape,
}

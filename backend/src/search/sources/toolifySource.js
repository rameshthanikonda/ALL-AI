const axios = require('axios')
const cheerio = require('cheerio')
const { withBrowserPage, scrollPage, USER_AGENT } = require('../browser')
const { rankToolsByQuery } = require('../queryUtils')
const { filterValidTools } = require('../toolValidator')

function parseToolifyHtml(html, query) {
  const $ = cheerio.load(html)
  const tools = []
  const seen = new Set()

  $('a[href*="/tool/"], a[href*="/ai-tool/"]').each((_, element) => {
    const anchor = $(element)
    const href = anchor.attr('href') || ''
    const name = anchor.text().trim().replace(/\s+/g, ' ')

    if (!name || name.length < 2 || name.length > 100) return
    if (/login|sign up|pricing page/i.test(name)) return

    const fullUrl = href.startsWith('http') ? href : `https://www.toolify.ai${href}`
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) return
    seen.add(key)

    const card = anchor.closest('[class*="tool"], [class*="card"], article, li, div')
    const description =
      card.find('p, [class*="desc"], [class*="summary"]').first().text().trim() ||
      `AI tool on Toolify: ${name}`

    tools.push({
      name,
      description,
      url: fullUrl,
      source: 'toolify',
      tags: ['toolify', 'directory'],
    })
  })

  return rankToolsByQuery(tools, query, 12)
}

async function searchToolifyAxios(query) {
  const url = `https://www.toolify.ai/search/${encodeURIComponent(query)}`
  const response = await axios.get(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 15000,
  })

  if (String(response.data).includes('Just a moment')) return []
  return parseToolifyHtml(response.data, query)
}

function extractToolifyToolsScript() {
  const tools = []
  const seen = new Set()

  document.querySelectorAll('a[href*="/tool/"], a[href*="/ai-tool/"]').forEach((anchor) => {
    const name = (anchor.innerText || '').trim().replace(/\s+/g, ' ')
    if (!name || name.length < 2 || name.length > 100) return

    const href = anchor.href
    if (!href) return
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.has(key)) return
    seen.add(key)

    const card = anchor.closest('[class*="tool"], [class*="card"], article, li, div')
    const description = (card?.innerText || '')
      .replace(name, '')
      .trim()
      .slice(0, 280)

    tools.push({
      name,
      description: description || `AI tool on Toolify: ${name}`,
      url: href,
      source: 'toolify',
      tags: ['toolify', 'directory'],
    })
  })

  return tools
}

async function searchToolifyBrowser(query) {
  const url = `https://www.toolify.ai/search/${encodeURIComponent(query)}`

  const raw = await withBrowserPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(5000)

    const title = await page.title()
    if (title.includes('Just a moment')) {
      await page.waitForTimeout(12000)
    }

    await scrollPage(page, 3)
    return page.evaluate(extractToolifyToolsScript)
  })

  return rankToolsByQuery(raw, query, 12)
}

async function searchToolify(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  let results = []
  try {
    results = await searchToolifyAxios(trimmed)
  } catch (error) {
    console.warn('[Toolify] HTTP failed:', error.message)
  }

  if (!results.length) {
    try {
      results = await searchToolifyBrowser(trimmed)
    } catch (error) {
      console.warn('[Toolify] Browser failed:', error.message)
    }
  }

  const valid = filterValidTools(results)
  console.log(`[Toolify] ${valid.length} tools for "${trimmed}"`)
  return valid
}

module.exports = { searchToolify }

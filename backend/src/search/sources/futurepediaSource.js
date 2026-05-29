const { withBrowserPage, scrollPage } = require('../browser')
const { resolveDirectoryCategories, rankToolsByQuery } = require('../queryUtils')
const { filterValidTools } = require('../toolValidator')

function extractFuturepediaToolsScript() {
  const tools = []
  const seen = new Set()

  document.querySelectorAll('a[href*="/tool/"]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href, window.location.origin)
      if (!/\/tool\/[^/]+$/i.test(url.pathname)) return

      const slug = url.pathname.split('/').pop()
      if (!slug || seen.has(slug)) return

      const card = anchor.closest('article, li, [class*="card"], div') || anchor.parentElement
      let externalUrl = ''

      if (card) {
        const visitLink = card.querySelector('a[href*="utm_source=futurepedia"]')
        if (visitLink?.href && !visitLink.href.includes('futurepedia.io')) {
          externalUrl = visitLink.href
        }
      }

      const cardText = (card?.innerText || '').replace(/\s+/g, ' ').trim()
      const name = (anchor.innerText || '')
        .replace(/Rated\s+\d.*/i, '')
        .replace(/Add bookmark.*/i, '')
        .trim()

      if (!name || name.length < 2 || name.length > 120) return
      if (/^(visit|get deal|trending|popular|new)$/i.test(name)) return

      let description = cardText.replace(name, '').trim()
      description = description
        .replace(/Rated\s+\d out of \d.*/gi, '')
        .replace(/#\S+/g, '')
        .replace(/(Free|Freemium|Paid|Free Trial)/gi, '')
        .trim()

      seen.add(slug)
      tools.push({
        name,
        description: description || `AI tool on Futurepedia: ${name}`,
        url: externalUrl || `https://www.futurepedia.io/tool/${slug}`,
        source: 'futurepedia',
        tags: ['futurepedia', 'directory'],
      })
    } catch {
      // skip invalid nodes
    }
  })

  return tools
}

async function scrapeListing(page, listingUrl) {
  await page.goto(listingUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(3000)
  await scrollPage(page)
  return page.evaluate(extractFuturepediaToolsScript)
}

function dedupeTools(tools) {
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

async function searchFuturepedia(query) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const categories = resolveDirectoryCategories(trimmed)
  const urls = [
    `https://www.futurepedia.io/search?q=${encodeURIComponent(trimmed)}`,
    ...categories.map((slug) => `https://www.futurepedia.io/ai-tools/${slug}`),
  ]

  const collected = await withBrowserPage(async (page) => {
    const batch = []
    for (const url of [...new Set(urls)]) {
      try {
        batch.push(...(await scrapeListing(page, url)))
      } catch (error) {
        console.warn(`[Futurepedia] ${url}: ${error.message}`)
      }
    }
    return batch
  })

  const deduped = dedupeTools(collected)
  const ranked = rankToolsByQuery(deduped, trimmed, 12)
  const results = ranked.length ? ranked : deduped.slice(0, 8)
  const valid = filterValidTools(results)

  console.log(`[Futurepedia] ${valid.length} tools for "${trimmed}"`)
  return valid
}

module.exports = { searchFuturepedia }

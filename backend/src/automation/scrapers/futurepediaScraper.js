const { chromium } = require('playwright')
const cheerio = require('cheerio')

const MAX_PAGES = 3

/**
 * Scrape AI tools from Futurepedia.io with pagination support.
 * Uses Playwright for dynamic content rendering.
 */
async function scrapeFuturepedia() {
  console.log('[Scraper - Futurepedia] Starting scrape...')
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    const allTools = []

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const url = pageNum === 1
        ? 'https://www.futurepedia.io'
        : `https://www.futurepedia.io/ai-tools?page=${pageNum}`

      console.log(`[Scraper - Futurepedia] Loading page ${pageNum}: ${url}`)

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(3000)

        // Scroll to trigger lazy loads
        for (let scroll = 0; scroll < 3; scroll++) {
          await page.evaluate(() => window.scrollBy(0, 800))
          await page.waitForTimeout(500)
        }

        const html = await page.content()
        const $ = cheerio.load(html)
        let pageTools = []

        // Primary selectors — Futurepedia tool cards
        $('[class*="tool-card"], [class*="ToolCard"], [class*="card"], [class*="tool-item"]').each((i, el) => {
          const name = $(el).find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim()
          const description = $(el).find('p, [class*="description"], [class*="tagline"], [class*="summary"]').first().text().trim()
          let link = $(el).find('a').first().attr('href') || ''
          if (link && link.startsWith('/')) link = `https://www.futurepedia.io${link}`

          const pricing = $(el).find('[class*="pricing"], [class*="badge"], [class*="price"]').first().text().trim() || 'Freemium'
          const logoUrl = $(el).find('img').first().attr('src') || ''

          if (name && name.length > 1 && name.length < 100) {
            pageTools.push({
              name,
              description: description || `AI tool from Futurepedia: ${name}`,
              url: link || `https://www.futurepedia.io/search?q=${encodeURIComponent(name)}`,
              logoUrl: logoUrl || 'https://www.futurepedia.io/favicon.ico',
              category: '',
              pricing,
              tags: ['futurepedia', 'ai-tool'],
              features: [],
              source: 'futurepedia',
            })
          }
        })

        // Fallback: look for links to individual tool pages
        if (pageTools.length === 0) {
          console.log(`[Scraper - Futurepedia] Page ${pageNum}: Primary selectors empty, trying link fallback...`)
          $('a[href*="/tool/"]').each((i, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            if (text && text.length > 1 && text.length < 100) {
              const fullUrl = href.startsWith('/') ? `https://www.futurepedia.io${href}` : href
              if (!pageTools.some(t => t.url === fullUrl)) {
                pageTools.push({
                  name: text,
                  description: `AI tool discovered on Futurepedia: ${text}`,
                  url: fullUrl,
                  logoUrl: 'https://www.futurepedia.io/favicon.ico',
                  category: '',
                  pricing: 'Freemium',
                  tags: ['futurepedia', 'ai-tool'],
                  features: [],
                  source: 'futurepedia',
                })
              }
            }
          })
        }

        console.log(`[Scraper - Futurepedia] Page ${pageNum}: Found ${pageTools.length} tools`)
        allTools.push(...pageTools)

        if (pageTools.length < 3) break
      } catch (pageErr) {
        console.warn(`[Scraper - Futurepedia] Page ${pageNum} failed:`, pageErr.message)
        if (pageNum === 1) break
      }
    }

    // Deduplicate within batch
    const seen = new Set()
    const unique = allTools.filter(t => {
      const key = t.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`[Scraper - Futurepedia] Total scraped: ${unique.length} unique tools`)
    return unique
  } catch (error) {
    console.error('[Scraper - Futurepedia] Failed to scrape:', error.message)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

module.exports = {
  scrape: scrapeFuturepedia,
}

const { chromium } = require('playwright')
const cheerio = require('cheerio')

const MAX_PAGES = 3
const TOOLS_PER_PAGE = 20

/**
 * Scrape AI tools from Toolify.ai with pagination support.
 * Uses Playwright for dynamic content rendering.
 */
async function scrapeToolify() {
  console.log('[Scraper - Toolify] Starting scrape...')
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
        ? 'https://www.toolify.ai'
        : `https://www.toolify.ai/best-ai-tools?page=${pageNum}`

      console.log(`[Scraper - Toolify] Loading page ${pageNum}: ${url}`)

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(3000)

        // Scroll to trigger lazy-loaded content
        await page.evaluate(() => {
          window.scrollBy(0, 2000)
        })
        await page.waitForTimeout(1500)

        const html = await page.content()
        const $ = cheerio.load(html)
        let pageTools = []

        // Primary selectors - tool cards
        $('.tool-item, [class*="tool-card"], [class*="ToolCard"], [class*="item-card"]').each((i, el) => {
          const name = $(el).find('h2, h3, h4, [class*="name"], [class*="title"]').first().text().trim()
          const description = $(el).find('p, [class*="desc"], [class*="summary"], [class*="tagline"]').first().text().trim()
          let link = $(el).find('a').first().attr('href') || ''
          if (link && link.startsWith('/')) link = `https://www.toolify.ai${link}`

          const pricing = $(el).find('[class*="price"], [class*="pricing"], [class*="badge"]').first().text().trim() || 'Free'
          const logoUrl = $(el).find('img').first().attr('src') || ''

          if (name && name.length > 1 && name.length < 100) {
            pageTools.push({
              name,
              description: description || `AI tool from Toolify: ${name}`,
              url: link || `https://www.toolify.ai/search/${encodeURIComponent(name)}`,
              logoUrl: logoUrl || 'https://www.toolify.ai/favicon.ico',
              category: '',
              pricing,
              tags: ['toolify', 'ai-directory'],
              features: [],
              source: 'toolify',
            })
          }
        })

        // Fallback: search for links containing /tool/ or /ai/
        if (pageTools.length === 0) {
          console.log(`[Scraper - Toolify] Page ${pageNum}: Primary selectors empty, trying link-based fallback...`)
          $('a[href*="/tool/"], a[href*="/ai-tool/"]').each((i, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            if (text && text.length > 1 && text.length < 100 && !text.includes('Login') && !text.includes('Sign')) {
              const fullUrl = href.startsWith('/') ? `https://www.toolify.ai${href}` : href
              // Avoid duplicate URLs
              if (!pageTools.some(t => t.url === fullUrl)) {
                pageTools.push({
                  name: text,
                  description: `AI tool discovered on Toolify: ${text}`,
                  url: fullUrl,
                  logoUrl: 'https://www.toolify.ai/favicon.ico',
                  category: '',
                  pricing: 'Free',
                  tags: ['toolify', 'ai-directory'],
                  features: [],
                  source: 'toolify',
                })
              }
            }
          })
        }

        console.log(`[Scraper - Toolify] Page ${pageNum}: Found ${pageTools.length} tools`)
        allTools.push(...pageTools)

        // Stop pagination if we got fewer tools than expected
        if (pageTools.length < 3) break
      } catch (pageErr) {
        console.warn(`[Scraper - Toolify] Page ${pageNum} failed:`, pageErr.message)
        if (pageNum === 1) break // If first page fails, stop
      }
    }

    // Deduplicate by name within this scraper's batch
    const seen = new Set()
    const unique = allTools.filter(t => {
      const key = t.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`[Scraper - Toolify] Total scraped: ${unique.length} unique tools (from ${allTools.length} raw)`)
    return unique
  } catch (error) {
    console.error('[Scraper - Toolify] Failed to scrape:', error.message)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

module.exports = {
  scrape: scrapeToolify,
}

const { chromium } = require('playwright')
const cheerio = require('cheerio')

/**
 * Scrape AI tools from Product Hunt AI topics.
 * Uses Playwright to handle the React-based dynamic UI.
 */
async function scrapeProductHunt() {
  console.log('[Scraper - Product Hunt] Starting scrape...')
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    const allTools = []

    // Scrape multiple AI-related topic pages
    const topicUrls = [
      'https://www.producthunt.com/topics/artificial-intelligence',
      'https://www.producthunt.com/topics/developer-tools',
    ]

    for (const url of topicUrls) {
      console.log(`[Scraper - Product Hunt] Loading: ${url}`)

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(3000)

        // Scroll to load more items
        for (let scroll = 0; scroll < 3; scroll++) {
          await page.evaluate(() => window.scrollBy(0, 1500))
          await page.waitForTimeout(1500)
        }

        const html = await page.content()
        const $ = cheerio.load(html)

        // Primary selectors — Product Hunt post items
        $('[data-test^="post-item-"], [class*="post-item"], [class*="styles_item"]').each((i, el) => {
          const name = $(el).find('[data-test="post-name"], h3, [class*="title"]').first().text().trim()
          const description = $(el).find('[data-test="post-tagline"], p, [class*="tagline"]').first().text().trim()
          const relativeUrl = $(el).find('a[href*="/posts/"]').attr('href') || $(el).find('a').first().attr('href') || ''
          const link = relativeUrl.startsWith('/') ? `https://www.producthunt.com${relativeUrl}` : relativeUrl

          let logoUrl = $(el).find('img').first().attr('src') || ''
          if (logoUrl.startsWith('//')) logoUrl = 'https:' + logoUrl

          if (name && name.length > 1 && name.length < 100) {
            allTools.push({
              name,
              description: description || `Product launched on Product Hunt: ${name}`,
              url: link || 'https://www.producthunt.com',
              logoUrl: logoUrl || 'https://www.producthunt.com/favicon.ico',
              category: '',
              pricing: 'Free Trial',
              tags: ['product-hunt', 'ai-launch', 'new-product'],
              features: ['Product Launch'],
              source: 'producthunt',
            })
          }
        })

        // Fallback: extract from any post links
        if (allTools.length === 0) {
          console.log(`[Scraper - Product Hunt] Primary selectors empty, trying link fallback...`)
          $('a[href*="/posts/"]').each((i, el) => {
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            if (text && text.length > 2 && text.length < 100 && href.includes('/posts/')) {
              const fullUrl = href.startsWith('/') ? `https://www.producthunt.com${href}` : href
              if (!allTools.some(t => t.url === fullUrl)) {
                allTools.push({
                  name: text,
                  description: `Product from Product Hunt: ${text}`,
                  url: fullUrl,
                  logoUrl: 'https://www.producthunt.com/favicon.ico',
                  category: '',
                  pricing: 'Free Trial',
                  tags: ['product-hunt', 'ai-launch'],
                  features: [],
                  source: 'producthunt',
                })
              }
            }
          })
        }
      } catch (urlErr) {
        console.warn(`[Scraper - Product Hunt] Failed to load ${url}:`, urlErr.message)
      }
    }

    // Deduplicate
    const seen = new Set()
    const unique = allTools.filter(t => {
      const key = t.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`[Scraper - Product Hunt] Total scraped: ${unique.length} unique tools`)
    return unique
  } catch (error) {
    console.error('[Scraper - Product Hunt] Failed to scrape:', error.message)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

module.exports = {
  scrape: scrapeProductHunt,
}

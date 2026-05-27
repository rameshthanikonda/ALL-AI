const { chromium } = require('playwright')
const cheerio = require('cheerio')

const AI_KEYWORDS = [
  'ai', 'gpt', 'llm', 'model', 'neural', 'artificial', 'intelligence',
  'learning', 'diffusion', 'chat', 'agent', 'transformer', 'nlp', 'ml',
  'deep learning', 'generative', 'language model', 'embedding', 'vector',
  'rag', 'fine-tune', 'inference', 'copilot', 'prompt',
]

/**
 * Scrape trending AI-related repositories from GitHub.
 * Filters for AI/ML projects specifically.
 */
async function scrapeGitHubTrending() {
  console.log('[Scraper - GitHub] Starting scrape...')
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    const allTools = []

    // Scrape multiple timeframes and topics for better coverage
    const urls = [
      'https://github.com/trending?since=daily',
      'https://github.com/trending?since=weekly',
      'https://github.com/trending/python?since=weekly',
      'https://github.com/trending/typescript?since=weekly',
    ]

    for (const url of urls) {
      console.log(`[Scraper - GitHub] Loading: ${url}`)

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForTimeout(2000)

        const html = await page.content()
        const $ = cheerio.load(html)

        // GitHub trending uses article.Box-row or similar elements
        $('article.Box-row, .Box-row').each((i, el) => {
          const nameElement = $(el).find('h2 a, h1 a')
          const repoPath = (nameElement.attr('href') || '').trim()
          if (!repoPath) return

          const fullName = repoPath.split('/').filter(Boolean).join('/')
          const repoName = fullName.split('/').pop() || fullName
          const repoUrl = `https://github.com${repoPath}`

          const description = $(el).find('p').text().trim() || ''
          const language = $(el).find('span[itemprop="programmingLanguage"]').text().trim()
          const starsText = $(el).find('a[href$="/stargazers"]').text().trim()

          // Check if it's AI-related
          const searchText = `${fullName} ${description} ${language}`.toLowerCase()
          const isAI = AI_KEYWORDS.some(kw => searchText.includes(kw))

          if (isAI && repoName) {
            const tags = ['github', 'open-source']
            if (language) tags.push(language.toLowerCase())
            tags.push('ai-tool')

            allTools.push({
              name: repoName,
              description: description || `Open-source AI tool: ${fullName}`,
              url: repoUrl,
              logoUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
              category: 'Coding',
              pricing: 'Free',
              tags,
              features: ['Open Source', 'GitHub Repository', 'Developer Tool'],
              source: 'github',
            })
          }
        })
      } catch (urlErr) {
        console.warn(`[Scraper - GitHub] Failed to load ${url}:`, urlErr.message)
      }
    }

    // Deduplicate by repo URL
    const seen = new Set()
    const unique = allTools.filter(t => {
      const key = t.url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    console.log(`[Scraper - GitHub] Total scraped: ${unique.length} unique AI repos`)
    return unique
  } catch (error) {
    console.error('[Scraper - GitHub] Failed to scrape:', error.message)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

module.exports = {
  scrape: scrapeGitHubTrending,
}

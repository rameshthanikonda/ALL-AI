const axios = require('axios')
const cheerio = require('cheerio')
const Tool = require('../models/Tool')

/**
 * Perform a live search using DuckDuckGo HTML version for fast fallback scraping.
 */
async function performLiveFallbackSearch(query) {
  if (!query) return []
  
  console.log(`[LiveSearch] Initiating fallback search for: ${query}`)
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' AI tool')}`
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 5000
    })

    const $ = cheerio.load(response.data)
    const results = []

    $('.result').each((i, el) => {
      if (results.length >= 3) return false // Max 3 fallback results

      const titleEl = $(el).find('.result__title a.result__url')
      const snippetEl = $(el).find('.result__snippet')
      
      const title = titleEl.text().trim()
      const url = titleEl.attr('href')
      const snippet = snippetEl.text().trim()

      if (title && url && snippet) {
        // Clean URL if duckduckgo wrapper
        let cleanUrl = url
        if (cleanUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
          cleanUrl = decodeURIComponent(cleanUrl.split('uddg=')[1].split('&')[0])
        }

        results.push({
          name: title.replace(/ - .*$/, '').replace(/\|.*/, '').trim(),
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          description: snippet,
          url: cleanUrl,
          category: 'Web Result',
          tags: ['live-fallback', query.toLowerCase().replace(/[^a-z0-9]/g, '-')],
          featured: false,
          _search: {
            engine: 'Live Web Search',
            strategy: 'Real-time scraping fallback',
            reasons: ['No local results found']
          }
        })
      }
    })

    // Optionally save these to the database so they are cached for next time
    for (const res of results) {
      try {
        const { _search, ...toolData } = res
        await Tool.updateOne(
          { slug: toolData.slug },
          { $setOnInsert: toolData },
          { upsert: true }
        )
      } catch (err) {
        console.warn('[LiveSearch] Failed to cache result:', err.message)
      }
    }

    return results

  } catch (error) {
    console.error(`[LiveSearch] Fallback search failed:`, error.message)
    return []
  }
}

module.exports = {
  performLiveFallbackSearch
}

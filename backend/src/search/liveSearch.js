const axios = require('axios')
const cheerio = require('cheerio')
const Tool = require('../models/Tool')

/**
 * Clean Yahoo tracking URLs to recover direct links.
 */
function cleanYahooUrl(url) {
  if (url && url.includes('/RU=')) {
    const parts = url.split('/RU=');
    if (parts[1]) {
      return decodeURIComponent(parts[1].split('/')[0]);
    }
  }
  return url;
}

/**
 * Scrape search results from Yahoo Search.
 */
async function scrapeYahoo(query) {
  const url = `https://search.yahoo.com/search?q=${encodeURIComponent(query + ' AI tool')}`
  console.log(`[LiveSearch] Querying Yahoo fallback: ${url}`)
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: 6000
  })
  
  const $ = cheerio.load(response.data)
  const results = []
  
  $('.algo').each((i, el) => {
    if (results.length >= 5) return false
    
    const anchor = $(el).find('.compTitle a').first()
    const titleEl = $(el).find('h3.title').first()
    const snippetEl = $(el).find('.compText p, .compText').first()
    
    const rawUrl = anchor.attr('href')
    const cleanUrl = cleanYahooUrl(rawUrl)
    const title = titleEl.text().trim()
    const snippet = snippetEl.text().trim()
    
    if (title && cleanUrl && snippet) {
      // Parse clean name
      const name = title
        .replace(/ - .*$/, '')
        .replace(/\|.*/, '')
        .replace(/:.*$/, '')
        .replace(/\b(AI tool|AI tools|Official Site|Home|GitHub)\b/gi, '')
        .trim() || title;

      // Clean slug
      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (slug.length > 50) slug = slug.substring(0, 50).replace(/-$/, '')
      
      results.push({
        name,
        slug: slug || `web-${Math.random().toString(36).substring(2, 7)}`,
        description: snippet,
        url: cleanUrl,
        category: 'Explore Fallback',
        tags: ['live-search', query.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)],
        featured: false,
        _search: {
          engine: 'Live Web Search (Yahoo)',
          strategy: 'Real-time scraping fallback',
          reasons: ['No local results found']
        }
      })
    }
  })
  
  return results
}

/**
 * Scrape search results from DuckDuckGo HTML version.
 */
async function scrapeDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' AI tool')}`
  console.log(`[LiveSearch] Querying DuckDuckGo fallback: ${url}`)
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 6000
  })
  
  const $ = cheerio.load(response.data)
  const results = []
  
  $('.result').each((i, el) => {
    if (results.length >= 3) return false
    
    const titleEl = $(el).find('.result__title a.result__url, .result__a').first()
    const snippetEl = $(el).find('.result__snippet').first()
    
    const title = titleEl.text().trim()
    const rawUrl = titleEl.attr('href')
    const snippet = snippetEl.text().trim()
    
    if (title && rawUrl && snippet) {
      let cleanUrl = rawUrl
      if (cleanUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
        cleanUrl = decodeURIComponent(cleanUrl.split('uddg=')[1].split('&')[0])
      } else if (cleanUrl.includes('uddg=')) {
        cleanUrl = decodeURIComponent(cleanUrl.split('uddg=')[1].split('&')[0])
      }
      
      const name = title
        .replace(/ - .*$/, '')
        .replace(/\|.*/, '')
        .replace(/:.*$/, '')
        .trim() || title;

      let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (slug.length > 50) slug = slug.substring(0, 50).replace(/-$/, '')
      
      results.push({
        name,
        slug: slug || `web-${Math.random().toString(36).substring(2, 7)}`,
        description: snippet,
        url: cleanUrl,
        category: 'Explore Fallback',
        tags: ['live-search', query.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20)],
        featured: false,
        _search: {
          engine: 'Live Web Search (DDG)',
          strategy: 'Real-time scraping fallback',
          reasons: ['No local results found']
        }
      })
    }
  })
  
  return results
}

/**
 * Perform a live search using multi-engine scraping for high reliability.
 */
async function performLiveFallbackSearch(query) {
  if (!query) return []
  
  console.log(`[LiveSearch] Initiating fallback search for: ${query}`)
  
  // Try Yahoo first (highly stable, detailed snippets, rare rate limits)
  try {
    const yahooResults = await scrapeYahoo(query)
    if (yahooResults && yahooResults.length > 0) {
      console.log(`[LiveSearch] Successfully retrieved ${yahooResults.length} results from Yahoo`)
      await cacheAndSaveResults(yahooResults)
      return yahooResults
    }
  } catch (err) {
    console.error(`[LiveSearch] Yahoo scraping failed:`, err.message)
  }
  
  // Try DuckDuckGo as second-tier fallback
  try {
    const ddgResults = await scrapeDuckDuckGo(query)
    if (ddgResults && ddgResults.length > 0) {
      console.log(`[LiveSearch] Successfully retrieved ${ddgResults.length} results from DuckDuckGo`)
      await cacheAndSaveResults(ddgResults)
      return ddgResults
    }
  } catch (err) {
    console.error(`[LiveSearch] DuckDuckGo scraping failed:`, err.message)
  }
  
  return []
}

/**
 * Cache and save found results to the Mongo database so they persist for browsing.
 */
async function cacheAndSaveResults(results) {
  for (const res of results) {
    try {
      const { _search, ...toolData } = res
      // Check if it already exists by URL or slug
      const existing = await Tool.findOne({
        $or: [{ slug: toolData.slug }, { url: toolData.url }]
      })
      
      if (!existing) {
        // Create it in database
        await Tool.create(toolData)
        console.log(`[LiveSearch] Saved new tool to database: ${toolData.name} (${toolData.slug})`)
      }
    } catch (err) {
      console.warn('[LiveSearch] Failed to cache result:', err.message)
    }
  }
}

module.exports = {
  performLiveFallbackSearch
}

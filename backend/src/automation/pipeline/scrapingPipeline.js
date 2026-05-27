const Tool = require('../../models/Tool')
const ScrapeRun = require('../../models/ScrapeRun')
const { cleanBatch } = require('../processors/dataCleaner')
const { categorizeTool } = require('../categorizer/keywordCategorizer')
const { findDuplicate, normalizeName } = require('../dedupe/duplicateDetector')
const { generateSlug } = require('../seo/slugGenerator')
const { optimizeAndSaveLogo } = require('../processors/imageOptimizer')
const { calculateTrendingScores } = require('../processors/trendingCalculator')
const { createQueue } = require('../utils/queueWrapper')
const { meiliSearchClient } = require('../../search/meiliSearch')

// Import all scrapers
const toolifyScraper = require('../scrapers/toolifyScraper')
const futurepediaScraper = require('../scrapers/futurepediaScraper')
const githubScraper = require('../scrapers/githubScraper')
const producthuntScraper = require('../scrapers/producthuntScraper')

const ALL_SCRAPERS = [
  { name: 'toolify', scraper: toolifyScraper },
  { name: 'futurepedia', scraper: futurepediaScraper },
  { name: 'github', scraper: githubScraper },
  { name: 'producthunt', scraper: producthuntScraper },
]

/**
 * Process a single scraped tool through the full pipeline:
 * Clean → Categorize → Dedupe → Optimize Image → Save
 */
async function processToolRecord(cleaned, stats) {
  try {
    // 1. Auto-categorize if no category
    if (!cleaned.category || cleaned.category === 'Uncategorized') {
      cleaned.category = categorizeTool(cleaned.name, cleaned.description, cleaned.tags)
    }

    // 2. Generate proper slug
    cleaned.slug = generateSlug(cleaned.name) || cleaned.slug

    // 3. Generate normalized name for dedup
    cleaned.normalizedName = normalizeName(cleaned.name)

    // 4. Check for duplicates
    const existing = await findDuplicate(cleaned.name, cleaned.url, cleaned.slug)
    if (existing) {
      stats.duplicates++
      console.log(`  [Dedupe] Duplicate found: "${cleaned.name}" matches existing "${existing.name}" (${existing.slug})`)
      return null
    }

    // 5. Optimize logo image
    let optimizedLogo = cleaned.logoUrl
    try {
      optimizedLogo = await optimizeAndSaveLogo(cleaned.logoUrl, cleaned.slug)
      if (optimizedLogo && optimizedLogo !== cleaned.logoUrl) {
        stats.imagesOptimized = (stats.imagesOptimized || 0) + 1
      }
    } catch (imgErr) {
      console.warn(`  [Image] Failed to optimize logo for ${cleaned.slug}:`, imgErr.message)
    }

    // 6. Upsert into database
    const toolDoc = {
      name: cleaned.name,
      slug: cleaned.slug,
      normalizedName: cleaned.normalizedName,
      description: cleaned.description,
      url: cleaned.url,
      category: cleaned.category,
      tags: cleaned.tags,
      features: cleaned.features,
      pricing: cleaned.pricing,
      logoUrl: optimizedLogo || cleaned.logoUrl,
      source: cleaned.source,
      trendingScore: 0,
    }

    await Tool.updateOne(
      { slug: cleaned.slug },
      { $set: toolDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    )

    stats.newTools++
    console.log(`  [Saved] ${cleaned.name} (${cleaned.slug}) → ${cleaned.category}`)
    return toolDoc
  } catch (err) {
    stats.errors++
    stats.errorMessages = stats.errorMessages || []
    stats.errorMessages.push(`${cleaned.name}: ${err.message}`)
    console.error(`  [Error] Failed to process "${cleaned.name}":`, err.message)
    return null
  }
}

/**
 * Run a single scraper and process all its results.
 */
async function runSingleScraper(scraperEntry) {
  const { name, scraper } = scraperEntry
  const stats = {
    source: name,
    fetched: 0,
    newTools: 0,
    duplicates: 0,
    errors: 0,
    duration: 0,
    errorMessages: [],
    imagesOptimized: 0,
  }

  const startTime = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[Pipeline] Running scraper: ${name}`)
  console.log(`${'='.repeat(60)}`)

  try {
    // Step 1: Scrape
    const rawTools = await scraper.scrape()
    stats.fetched = rawTools.length
    console.log(`[Pipeline] ${name} fetched ${rawTools.length} raw tools`)

    if (rawTools.length === 0) {
      stats.duration = Date.now() - startTime
      return stats
    }

    // Step 2: Clean batch
    const cleanedTools = cleanBatch(rawTools)
    console.log(`[Pipeline] ${name} cleaned ${cleanedTools.length} tools (${rawTools.length - cleanedTools.length} invalid removed)`)

    // Step 3: Process each tool (categorize, dedupe, optimize, save)
    for (const cleaned of cleanedTools) {
      await processToolRecord(cleaned, stats)
    }
  } catch (err) {
    stats.errors++
    stats.errorMessages.push(`Scraper crash: ${err.message}`)
    console.error(`[Pipeline] ${name} scraper failed:`, err.message)
  }

  stats.duration = Date.now() - startTime
  console.log(`[Pipeline] ${name} completed in ${(stats.duration / 1000).toFixed(1)}s — New: ${stats.newTools}, Dupes: ${stats.duplicates}, Errors: ${stats.errors}`)
  return stats
}

/**
 * Run the full scraping pipeline:
 * 1. Run all scrapers (sequentially to avoid overwhelming sites)
 * 2. Clean → Categorize → Dedupe → Save for each
 * 3. Update trending scores
 * 4. Sync search index
 * 5. Log the run
 */
async function runFullPipeline(options = {}) {
  const { scrapers = ALL_SCRAPERS, parallel = false } = options

  console.log('\n' + '█'.repeat(60))
  console.log('█  SCRAPING AUTOMATION PIPELINE STARTED')
  console.log('█  ' + new Date().toISOString())
  console.log('█'.repeat(60))

  // Create run record
  const run = await ScrapeRun.create({
    pipeline: 'scraping-automation',
    notes: [`Started with ${scrapers.length} scrapers: ${scrapers.map(s => s.name).join(', ')}`],
  })

  const allResults = []

  try {
    // Run scrapers
    if (parallel) {
      // Parallel mode for Phase 2+ scaling
      const results = await Promise.allSettled(
        scrapers.map(s => runSingleScraper(s))
      )
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allResults.push(result.value)
        } else {
          allResults.push({
            source: 'unknown',
            fetched: 0,
            newTools: 0,
            duplicates: 0,
            errors: 1,
            duration: 0,
            errorMessages: [result.reason?.message || 'Unknown error'],
          })
        }
      }
    } else {
      // Sequential mode (default) — polite scraping
      for (const scraperEntry of scrapers) {
        const result = await runSingleScraper(scraperEntry)
        allResults.push(result)
      }
    }

    // Aggregate stats
    const totalStats = {
      totalFetched: 0,
      totalNew: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      totalToolsInDB: 0,
      imagesOptimized: 0,
      trendingUpdated: 0,
    }

    for (const result of allResults) {
      totalStats.totalFetched += result.fetched
      totalStats.totalNew += result.newTools
      totalStats.totalDuplicates += result.duplicates
      totalStats.totalErrors += result.errors
      totalStats.imagesOptimized += result.imagesOptimized || 0
    }

    // Update trending scores
    console.log('\n[Pipeline] Updating trending scores...')
    try {
      const trendingResult = await calculateTrendingScores()
      totalStats.trendingUpdated = trendingResult.updated
      run.notes.push(`Trending scores updated: ${trendingResult.updated}/${trendingResult.total}`)
    } catch (trendErr) {
      run.notes.push(`Trending update failed: ${trendErr.message}`)
    }

    // Sync search index
    console.log('[Pipeline] Syncing search index...')
    try {
      const allTools = await Tool.find({}).lean()
      totalStats.totalToolsInDB = allTools.length
      await meiliSearchClient.syncIfNeeded(allTools)
      run.notes.push(`Search index synced with ${allTools.length} tools`)
    } catch (searchErr) {
      run.notes.push(`Search sync failed: ${searchErr.message}`)
    }

    // Update run record
    run.scraperResults = allResults
    run.stats = totalStats
    run.status = totalStats.totalErrors > 0 && totalStats.totalNew === 0 ? 'partial' : 'completed'
    run.finishedAt = new Date()
    run.notes.push(`Pipeline completed. New: ${totalStats.totalNew}, Dupes: ${totalStats.totalDuplicates}, Errors: ${totalStats.totalErrors}, Total in DB: ${totalStats.totalToolsInDB}`)
    await run.save()

    console.log('\n' + '█'.repeat(60))
    console.log('█  PIPELINE COMPLETED')
    console.log(`█  Total Fetched: ${totalStats.totalFetched}`)
    console.log(`█  New Tools:     ${totalStats.totalNew}`)
    console.log(`█  Duplicates:    ${totalStats.totalDuplicates}`)
    console.log(`█  Errors:        ${totalStats.totalErrors}`)
    console.log(`█  Total in DB:   ${totalStats.totalToolsInDB}`)
    console.log(`█  Images:        ${totalStats.imagesOptimized} optimized`)
    console.log(`█  Trending:      ${totalStats.trendingUpdated} updated`)
    console.log('█'.repeat(60) + '\n')

    return run
  } catch (error) {
    run.status = 'failed'
    run.finishedAt = new Date()
    run.notes.push(`Pipeline failed: ${error.message}`)
    run.scraperResults = allResults
    await run.save()
    console.error('[Pipeline] FATAL ERROR:', error)
    throw error
  }
}

/**
 * Run only specific scrapers by name
 */
async function runSelectedScrapers(scraperNames = []) {
  const selected = ALL_SCRAPERS.filter(s => scraperNames.includes(s.name))
  if (selected.length === 0) {
    console.log('[Pipeline] No matching scrapers found for:', scraperNames)
    return null
  }
  return runFullPipeline({ scrapers: selected })
}

// Create a BullMQ/InMemory queue for scraping jobs
const scrapingQueue = createQueue('scraping', async (job) => {
  console.log(`[Queue] Processing scraping job: ${job.name}`, job.data)
  if (job.data && job.data.scrapers) {
    await runSelectedScrapers(job.data.scrapers)
  } else {
    await runFullPipeline()
  }
})

/**
 * Enqueue a scraping job (for BullMQ / background processing)
 */
async function enqueueScrapingJob(scraperNames = null) {
  const data = scraperNames ? { scrapers: scraperNames } : {}
  return scrapingQueue.add('scrape-all', data)
}

module.exports = {
  runFullPipeline,
  runSelectedScrapers,
  enqueueScrapingJob,
  ALL_SCRAPERS,
}

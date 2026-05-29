const Tool = require('../models/Tool')
const { legacyJunkMongoQuery } = require('./catalogFilter')

async function purgeLegacySearchTools() {
  const query = legacyJunkMongoQuery()
  const result = await Tool.deleteMany(query)
  if (result.deletedCount > 0) {
    console.log(`[Catalog] Removed ${result.deletedCount} legacy junk tools from database`)
  }
  return result.deletedCount
}

module.exports = { purgeLegacySearchTools }

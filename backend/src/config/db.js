const mongoose = require('mongoose')
const dns = require('dns').promises

const fallbackUri = 'mongodb://localhost:27017/ai-tools'

function getConfiguredUri() {
  return process.env.MONGO_URI || fallbackUri
}

function extractSrvHost(uri) {
  const afterPrefix = uri.replace('mongodb+srv://', '')
  const atIndex = afterPrefix.indexOf('@')
  const hostAndRest = atIndex !== -1 ? afterPrefix.slice(atIndex + 1) : afterPrefix
  return hostAndRest.split('/')[0]
}

async function resolveMongoUri() {
  const configuredUri = getConfiguredUri()

  if (!String(configuredUri).startsWith('mongodb+srv://')) {
    return { mongoUri: configuredUri, usingFallback: configuredUri === fallbackUri }
  }

  const host = extractSrvHost(configuredUri)

  try {
    await dns.resolveSrv(`_mongodb._tcp.${host}`)
    return { mongoUri: configuredUri, usingFallback: false }
  } catch (error) {
    console.warn('SRV lookup failed for', host, '- falling back to local MongoDB')
    return { mongoUri: fallbackUri, usingFallback: true }
  }
}

async function connectDB() {
  const resolved = await resolveMongoUri()

  try {
    await mongoose.connect(resolved.mongoUri)
    console.log(resolved.usingFallback ? 'MongoDB connected (fallback)' : 'MongoDB connected')
    return resolved
  } catch (error) {
    console.error('MongoDB connection error', error)

    if (resolved.mongoUri === fallbackUri) {
      throw error
    }

    await mongoose.connect(fallbackUri)
    console.log('MongoDB connected (fallback)')
    return { mongoUri: fallbackUri, usingFallback: true }
  }
}

module.exports = {
  connectDB,
  fallbackUri,
  getConfiguredUri,
}

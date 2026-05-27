const mongoose = require('mongoose')

const fallbackUri = 'mongodb://localhost:27017/ai-tools'

function getConfiguredUri() {
  return process.env.MONGO_URI || fallbackUri
}

async function connectDB() {
  const mongoUri = getConfiguredUri()
  const isFallback = !process.env.MONGO_URI

  try {
    await mongoose.connect(mongoUri)
    console.log(isFallback ? 'MongoDB connected (fallback to localhost)' : 'MongoDB connected to configured database')
    return { mongoUri, usingFallback: isFallback }
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    throw error
  }
}

module.exports = {
  connectDB,
  fallbackUri,
  getConfiguredUri,
}

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports = async () => {
  const mongo = await MongoMemoryServer.create()
  const uri = mongo.getUri()
  // Expose URI to tests via environment variable
  process.env.TEST_MONGO_URI = uri
  // Connect mongoose here as well so globalSetup ensures connection
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  // Save mongo instance for possible teardown
  global.__MONGO_INSTANCE__ = mongo
}


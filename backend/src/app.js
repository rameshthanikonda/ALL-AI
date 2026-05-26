const express = require('express')
const cors = require('cors')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const path = require('path')

const { connectDB } = require('./config/db')

require('dotenv').config()
const rootEnv = path.resolve(__dirname, '..', '..', '.env')
if (!process.env.MONGO_URI || !process.env.SESSION_SECRET || !process.env.GOOGLE_CLIENT_ID) {
  require('dotenv').config({ path: rootEnv })
}

function buildAllowedOrigins() {
  const configured = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const defaults = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
  return Array.from(new Set(configured.concat(defaults)))
}

function isSecureOrigin(url) {
  return String(url || '').trim().toLowerCase().startsWith('https://')
}

async function createApp() {
  let sessionMongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-tools'

  if (process.env.NODE_ENV === 'test' && process.env.TEST_MONGO_URI) {
    sessionMongoUrl = process.env.TEST_MONGO_URI
  } else if (process.env.NODE_ENV !== 'test') {
    const db = await connectDB()
    sessionMongoUrl = db.mongoUri
  }

  console.log(
    'ENV: FRONTEND_URL=',
    !!process.env.FRONTEND_URL,
    'MONGO_URI=',
    !!process.env.MONGO_URI,
    'GOOGLE_CLIENT_ID=',
    !!process.env.GOOGLE_CLIENT_ID
  )

  const app = express()
  const allowedOrigins = buildAllowedOrigins()
  const hasSecureFrontend = allowedOrigins.some((origin) => isSecureOrigin(origin))

  if (process.env.NODE_ENV === 'production' || hasSecureFrontend) {
    app.set('trust proxy', 1)
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }

        callback(new Error(`Not allowed by CORS: ${origin}`))
      },
      credentials: true,
    })
  )
  app.use(express.json())

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: sessionMongoUrl }),
      cookie: {
        secure: process.env.NODE_ENV === 'production' || hasSecureFrontend,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' || hasSecureFrontend ? 'none' : 'lax',
        partitioned: process.env.NODE_ENV === 'production' || hasSecureFrontend,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  )

  app.use(passport.initialize())
  app.use(passport.session())

  app.use('/api/tools', require('./routes/tools'))
  app.use('/api/portal', require('./routes/portal'))
  app.use('/api/admin', require('./routes/admin'))
  app.use('/api/users', require('./routes/users'))
  app.use('/auth', require('./routes/auth'))
  app.use('/', require('./routes/sitemap'))

  app.get('/health', (req, res) => res.json({ ok: true }))

  return app
}

module.exports = createApp

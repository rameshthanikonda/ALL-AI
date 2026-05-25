require('dotenv').config()
const createApp = require('./app')

const preferredPort = process.env.PORT ? Number(process.env.PORT) : 4000

async function startServer() {
  try {
    const app = await createApp()
    const server = app.listen(preferredPort, () => {
      console.log(`Backend listening on port ${preferredPort}`)
    })

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${preferredPort} is already in use. Stop the process using port ${preferredPort} and restart the backend.`)
        process.exit(1)
      }

      console.error('Server error:', err)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start backend:', error)
    process.exit(1)
  }
}

startServer()

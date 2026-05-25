const request = require('supertest')
const mongoose = require('mongoose')
const Tool = require('../src/models/Tool')
const createApp = require('../src/app')

describe('Tools API', () => {
  let app

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.MEILISEARCH_URL = ''
    app = await createApp()
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (global.__MONGO_INSTANCE__) {
      await global.__MONGO_INSTANCE__.stop()
    }
  })

  beforeEach(async () => {
    await Tool.deleteMany({})
    await Tool.create([
      {
        name: 'ChatGPT',
        slug: 'chatgpt',
        description: 'AI assistant for writing, brainstorming, and coding support',
        category: 'Text',
        tags: ['writing', 'chat', 'coding'],
        featured: true,
      },
      {
        name: 'Notion AI',
        slug: 'notion-ai',
        description: 'Workspace assistant for notes, summaries, and study planning',
        category: 'Productivity',
        tags: ['notes', 'study', 'planning'],
      },
      {
        name: 'Midjourney',
        slug: 'midjourney',
        description: 'Image generation for art, moodboards, and design ideas',
        category: 'Image',
        tags: ['art', 'design', 'images'],
      },
    ])
  })

  test('GET /api/tools returns list', async () => {
    const res = await request(app).get('/api/tools')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tools)).toBe(true)
    expect(res.body.tools.length).toBeGreaterThanOrEqual(3)
    expect(res.body.total).toBeGreaterThanOrEqual(3)
  })

  test('GET /api/tools/:slug returns tool', async () => {
    const res = await request(app).get('/api/tools/chatgpt')
    expect(res.status).toBe(200)
    expect(res.body.tool).toBeDefined()
    expect(res.body.tool.slug).toBe('chatgpt')
  })

  test('search matches tool name keywords', async () => {
    const res = await request(app).get('/api/tools').query({ q: 'chatgpt' })
    expect(res.status).toBe(200)
    expect(res.body.tools[0].slug).toBe('chatgpt')
  })

  test('search matches description keywords', async () => {
    const res = await request(app).get('/api/tools').query({ q: 'brainstorming coding' })
    expect(res.status).toBe(200)
    expect(res.body.tools.some((tool) => tool.slug === 'chatgpt')).toBe(true)
  })

  test('search filters by category', async () => {
    const res = await request(app).get('/api/tools').query({ category: 'Productivity' })
    expect(res.status).toBe(200)
    expect(res.body.tools).toHaveLength(1)
    expect(res.body.tools[0].slug).toBe('notion-ai')
  })

  test('search filters by tags', async () => {
    const res = await request(app).get('/api/tools').query({ tags: 'design' })
    expect(res.status).toBe(200)
    expect(res.body.tools).toHaveLength(1)
    expect(res.body.tools[0].slug).toBe('midjourney')
  })

  test('clearing query returns browse results again', async () => {
    const res = await request(app).get('/api/tools').query({ q: '' })
    expect(res.status).toBe(200)
    expect(res.body.tools.length).toBeGreaterThanOrEqual(3)
  })
})

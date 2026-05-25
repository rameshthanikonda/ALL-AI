const INDEX_NAME = process.env.MEILISEARCH_INDEX || 'tools'

function normalizeText(value) {
  return String(value || '').trim()
}

function parseErrorBody(body) {
  if (!body) return 'unknown_error'
  if (typeof body === 'string') return body
  return body.message || body.code || body.type || 'unknown_error'
}

class MeiliSearchClient {
  constructor() {
    this.baseUrl = process.env.MEILISEARCH_URL
    this.apiKey = process.env.MEILISEARCH_API_KEY || ''
    this.readyPromise = null
    this.lastSyncAt = 0
  }

  isConfigured() {
    return Boolean(this.baseUrl)
  }

  headers() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`
    return headers
  }

  async request(method, path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(parseErrorBody(data))
      error.status = response.status
      error.body = data
      throw error
    }

    return data
  }

  async waitForTask(taskUid) {
    if (!taskUid) return

    while (true) {
      const task = await this.request('GET', `/tasks/${taskUid}`)
      if (task.status === 'succeeded') return task
      if (task.status === 'failed') {
        const error = new Error(parseErrorBody(task.error))
        error.body = task
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  async ensureReady() {
    if (!this.isConfigured()) return false

    if (!this.readyPromise) {
      this.readyPromise = this.setup().catch((error) => {
        this.readyPromise = null
        throw error
      })
    }

    await this.readyPromise
    return true
  }

  async setup() {
    try {
      await this.request('GET', `/indexes/${INDEX_NAME}`)
    } catch (error) {
      if (error.status !== 404) throw error
      const task = await this.request('POST', '/indexes', {
        uid: INDEX_NAME,
        primaryKey: 'id',
      })
      await this.waitForTask(task.taskUid)
    }

    const settingsTask = await this.request('PATCH', `/indexes/${INDEX_NAME}/settings`, {
      searchableAttributes: ['name', 'description', 'category', 'tags', 'slug'],
      displayedAttributes: [
        'id',
        'name',
        'slug',
        'description',
        'url',
        'category',
        'tags',
        'logoUrl',
        'featured',
        'createdAt',
      ],
      filterableAttributes: ['category', 'tags', 'featured'],
      sortableAttributes: ['createdAt', 'name'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4,
          twoTypos: 8,
        },
      },
      pagination: {
        maxTotalHits: 1000,
      },
    })

    await this.waitForTask(settingsTask.taskUid)
  }

  mapTool(tool) {
    return {
      id: String(tool._id || tool.id || tool.slug),
      name: normalizeText(tool.name),
      slug: normalizeText(tool.slug),
      description: normalizeText(tool.description),
      url: normalizeText(tool.url),
      category: normalizeText(tool.category),
      tags: Array.isArray(tool.tags) ? tool.tags.map((tag) => normalizeText(tag)).filter(Boolean) : [],
      logoUrl: normalizeText(tool.logoUrl),
      featured: Boolean(tool.featured),
      createdAt: tool.createdAt ? new Date(tool.createdAt).toISOString() : new Date().toISOString(),
    }
  }

  async syncDocuments(tools) {
    if (!(await this.ensureReady())) return false
    if (!tools.length) return true

    const task = await this.request('POST', `/indexes/${INDEX_NAME}/documents`, tools.map((tool) => this.mapTool(tool)))
    await this.waitForTask(task.taskUid)
    this.lastSyncAt = Date.now()
    return true
  }

  async syncIfNeeded(tools) {
    if (!this.isConfigured()) return false
    if (Date.now() - this.lastSyncAt < 5 * 60 * 1000) return true

    await this.syncDocuments(tools)
    return true
  }

  async upsertTool(tool) {
    if (!(await this.ensureReady())) return false
    const task = await this.request('POST', `/indexes/${INDEX_NAME}/documents`, [this.mapTool(tool)])
    await this.waitForTask(task.taskUid)
    this.lastSyncAt = Date.now()
    return true
  }

  async deleteTool(id) {
    if (!(await this.ensureReady())) return false
    const task = await this.request('DELETE', `/indexes/${INDEX_NAME}/documents/${encodeURIComponent(id)}`)
    await this.waitForTask(task.taskUid)
    this.lastSyncAt = Date.now()
    return true
  }

  buildFilter(category, tags) {
    const filters = []
    if (category) filters.push(`category = "${String(category).replace(/"/g, '\\"')}"`)

    for (const tag of tags) {
      filters.push(`tags = "${String(tag).replace(/"/g, '\\"')}"`)
    }

    if (!filters.length) return undefined
    return filters.join(' AND ')
  }

  async search({ query = '', category = '', tags = [], page = 1, perPage = 20 }) {
    if (!(await this.ensureReady())) return null

    const payload = {
      q: query || '',
      limit: perPage,
      offset: Math.max(0, (page - 1) * perPage),
      filter: this.buildFilter(category, tags),
      sort: query ? undefined : ['featured:desc', 'createdAt:desc'],
      attributesToHighlight: ['name', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      matchingStrategy: 'last',
    }

    const result = await this.request('POST', `/indexes/${INDEX_NAME}/search`, payload)

    return {
      total: result.estimatedTotalHits || result.totalHits || result.hits?.length || 0,
      tools: (result.hits || []).map((hit) => ({
        ...hit,
        _search: {
          score: 0,
          engine: 'Meilisearch',
          strategy: query ? 'Keyword search across name, description, category, and tags' : 'Browse ranking',
          reasons: query ? ['keyword match', 'description match', 'typo tolerant ranking'] : ['sorted for browsing'],
        },
      })),
    }
  }
}

module.exports = {
  meiliSearchClient: new MeiliSearchClient(),
}

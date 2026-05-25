const VECTOR_DIMENSIONS = 384

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'tool',
  'tools',
  'with',
])

const SYNONYM_MAP = {
  ai: ['assistant', 'automation', 'intelligent'],
  analytics: ['analysis', 'insights', 'tracking'],
  automate: ['automation', 'workflow', 'agent'],
  automation: ['automate', 'workflow', 'agent'],
  code: ['coding', 'developer', 'programming'],
  coding: ['code', 'developer', 'programming'],
  create: ['build', 'generate', 'make'],
  design: ['ui', 'ux', 'creative'],
  document: ['docs', 'writing', 'notes'],
  essay: ['writing', 'paper', 'draft'],
  image: ['photo', 'picture', 'visual'],
  note: ['notes', 'document', 'knowledge'],
  notes: ['note', 'document', 'knowledge'],
  pdf: ['document', 'file', 'reader'],
  presentation: ['slides', 'deck', 'pitch'],
  productivity: ['workflow', 'organize', 'focus'],
  research: ['analysis', 'study', 'insights'],
  resume: ['cv', 'jobs', 'career'],
  schedule: ['calendar', 'planner', 'meeting'],
  slides: ['presentation', 'deck', 'pitch'],
  study: ['learning', 'education', 'revision'],
  summarize: ['summary', 'brief', 'notes'],
  workflow: ['automation', 'productivity', 'agent'],
  writing: ['write', 'draft', 'content'],
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, ' ')
    .trim()
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token))
}

function stemToken(token) {
  if (token.length <= 4) return token
  return token.replace(/(ing|ed|es|ly)$/i, '').replace(/s$/i, '')
}

function expandTokens(tokens) {
  const expanded = new Set()

  for (const token of tokens) {
    const stemmed = stemToken(token)
    expanded.add(stemmed)
    const synonyms = SYNONYM_MAP[token] || SYNONYM_MAP[stemmed] || []
    for (const synonym of synonyms) expanded.add(stemToken(synonym))
  }

  return Array.from(expanded).filter(Boolean)
}

function hashToken(token, seed = 0) {
  let hash = 2166136261 ^ seed
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function vectorMagnitude(vector) {
  let total = 0
  for (const value of vector) total += value * value
  return Math.sqrt(total)
}

function addTokenToVector(vector, token, weight) {
  const index = hashToken(token) % VECTOR_DIMENSIONS
  const sign = hashToken(token, 29) % 2 === 0 ? 1 : -1
  vector[index] += weight * sign

  if (token.length >= 4) {
    for (let offset = 0; offset < token.length - 2; offset += 1) {
      const ngram = token.slice(offset, offset + 3)
      const ngramIndex = hashToken(ngram, 13) % VECTOR_DIMENSIONS
      const ngramSign = hashToken(ngram, 97) % 2 === 0 ? 1 : -1
      vector[ngramIndex] += weight * 0.24 * ngramSign
    }
  }
}

function buildWeightedTokens(tool) {
  const weighted = []
  const pushText = (value, weight) => {
    for (const token of tokenize(value)) {
      weighted.push({ token: stemToken(token), weight })
    }
  }

  pushText(tool.name, 3.5)
  pushText(tool.category, 2.2)
  pushText((tool.tags || []).join(' '), 2.8)
  pushText(tool.description, 1.6)
  pushText(tool.url, 0.6)

  return weighted
}

function buildEmbeddingFromTokens(tokens, baseWeight) {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0)
  for (const token of tokens) addTokenToVector(vector, token, baseWeight)

  const magnitude = vectorMagnitude(vector) || 1
  return vector.map((value) => Number((value / magnitude).toFixed(6)))
}

function buildToolEmbedding(tool) {
  return buildEmbeddingFromTokens(
    buildWeightedTokens(tool).flatMap((entry) => Array(Math.max(1, Math.round(entry.weight))).fill(entry.token)),
    1
  )
}

function buildQueryEmbedding(query) {
  const expanded = expandTokens(tokenize(query).map((token) => stemToken(token)))
  return buildEmbeddingFromTokens(expanded, 1.9)
}

function buildSearchText(tool) {
  return [tool.name, tool.category, ...(tool.tags || []), tool.description, tool.url].filter(Boolean).join(' ')
}

class OpenSearchClient {
  constructor() {
    this.baseUrl = process.env.OPENSEARCH_URL
    this.indexName = process.env.OPENSEARCH_INDEX || 'ai-tools'
    this.pipelineName = process.env.OPENSEARCH_PIPELINE || 'ai-tools-native-rrf'
    this.username = process.env.OPENSEARCH_USERNAME || ''
    this.password = process.env.OPENSEARCH_PASSWORD || ''
    this.readyPromise = null
    this.lastBulkSyncAt = 0
  }

  isConfigured() {
    return Boolean(this.baseUrl)
  }

  buildHeaders() {
    const headers = { 'Content-Type': 'application/json' }
    if (this.username || this.password) {
      headers.Authorization = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
    }
    return headers
  }

  async request(method, path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.buildHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (response.status === 404) return { ok: false, status: 404, body: null }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.error?.reason || data.error?.type || `OpenSearch request failed: ${response.status}`)
      error.status = response.status
      error.body = data
      throw error
    }

    return { ok: true, status: response.status, body: data }
  }

  async ensureReady() {
    if (!this.isConfigured()) return false
    if (!this.readyPromise) this.readyPromise = this.setup().catch((error) => {
      this.readyPromise = null
      throw error
    })
    await this.readyPromise
    return true
  }

  async setup() {
    const index = await this.request('GET', `/${this.indexName}`)
    if (!index.ok) {
      await this.request('PUT', `/${this.indexName}`, {
        settings: {
          index: {
            knn: true,
          },
        },
        mappings: {
          properties: {
            name: { type: 'text', similarity: 'BM25' },
            description: { type: 'text', similarity: 'BM25' },
            category: {
              type: 'text',
              fields: {
                raw: { type: 'keyword' },
              },
            },
            tags: {
              type: 'text',
              fields: {
                raw: { type: 'keyword' },
              },
            },
            slug: { type: 'keyword' },
            url: { type: 'keyword' },
            featured: { type: 'boolean' },
            createdAt: { type: 'date' },
            search_text: { type: 'text', similarity: 'BM25' },
            embedding: {
              type: 'knn_vector',
              dimension: VECTOR_DIMENSIONS,
              method: {
                name: 'hnsw',
                engine: 'lucene',
                space_type: 'cosinesimil',
                parameters: {
                  m: 16,
                  ef_construction: 128,
                },
              },
            },
          },
        },
      })
    }

    await this.request('PUT', `/_search/pipeline/${this.pipelineName}`, {
      description: 'Hybrid BM25 + HNSW kNN + native RRF ranking for AI tools search',
      phase_results_processors: [
        {
          'score-ranker-processor': {
            combination: {
              technique: 'rrf',
              rank_constant: 60,
            },
          },
        },
      ],
    })
  }

  mapTool(tool) {
    return {
      id: String(tool._id || tool.id || tool.slug),
      name: tool.name,
      slug: tool.slug,
      description: tool.description || '',
      url: tool.url || '',
      category: tool.category || '',
      tags: tool.tags || [],
      featured: Boolean(tool.featured),
      createdAt: tool.createdAt || new Date().toISOString(),
      search_text: buildSearchText(tool),
      embedding: buildToolEmbedding(tool),
    }
  }

  async upsertTool(tool) {
    if (!(await this.ensureReady())) return false
    const mapped = this.mapTool(tool)
    await this.request('PUT', `/${this.indexName}/_doc/${mapped.id}?refresh=true`, mapped)
    return true
  }

  async deleteTool(id) {
    if (!(await this.ensureReady())) return false
    const result = await this.request('DELETE', `/${this.indexName}/_doc/${id}?refresh=true`)
    return result.ok
  }

  async count() {
    if (!(await this.ensureReady())) return 0
    const result = await this.request('GET', `/${this.indexName}/_count`)
    return result.body?.count || 0
  }

  async bulkSync(tools) {
    if (!(await this.ensureReady())) return false
    if (!tools.length) return true

    const lines = []
    for (const tool of tools) {
      const mapped = this.mapTool(tool)
      lines.push(JSON.stringify({ index: { _index: this.indexName, _id: mapped.id } }))
      lines.push(JSON.stringify(mapped))
    }

    const response = await fetch(`${this.baseUrl}/_bulk?refresh=true`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'Content-Type': 'application/x-ndjson',
      },
      body: `${lines.join('\n')}\n`,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.errors) {
      const error = new Error('OpenSearch bulk sync failed')
      error.body = data
      throw error
    }

    this.lastBulkSyncAt = Date.now()
    return true
  }

  async syncIfNeeded(tools) {
    if (!this.isConfigured()) return false
    if (Date.now() - this.lastBulkSyncAt < 5 * 60 * 1000) return true

    const remoteCount = await this.count()
    if (remoteCount < tools.length) {
      await this.bulkSync(tools)
      return true
    }

    this.lastBulkSyncAt = Date.now()
    return true
  }

  buildFilters(category, tags) {
    const filters = []
    if (category) {
      filters.push({ term: { 'category.raw': category } })
    }
    for (const tag of tags) {
      filters.push({ term: { 'tags.raw': tag } })
    }
    return filters
  }

  async search({ query = '', category = '', tags = [], page = 1, perPage = 20 }) {
    if (!(await this.ensureReady())) return null

    const filters = this.buildFilters(category, tags)
    const from = Math.max(0, (page - 1) * perPage)

    if (!query.trim()) {
      const body = {
        from,
        size: perPage,
        sort: [{ featured: 'desc' }, { createdAt: 'desc' }],
        query: filters.length ? { bool: { filter: filters } } : { match_all: {} },
      }

      const response = await this.request('POST', `/${this.indexName}/_search`, body)
      return {
        total: response.body?.hits?.total?.value || 0,
        tools: (response.body?.hits?.hits || []).map((hit) => ({
          ...hit._source,
          _search: {
            score: hit._score || 0,
            engine: 'OpenSearch',
            strategy: 'browse',
          },
        })),
      }
    }

    const lexicalQuery = {
      multi_match: {
        query,
        fields: ['name^5', 'tags^4', 'category^3', 'description^2', 'search_text'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    }

    const vectorQuery = {
      knn: {
        embedding: {
          vector: buildQueryEmbedding(query),
          k: Math.max(50, perPage * 3),
          ...(filters.length ? { filter: { bool: { filter: filters } } } : {}),
        },
      },
    }

    const body = {
      from,
      size: perPage,
      query: {
        hybrid: {
          queries: filters.length
            ? [
                { bool: { must: [lexicalQuery], filter: filters } },
                vectorQuery,
              ]
            : [lexicalQuery, vectorQuery],
        },
      },
    }

    const response = await this.request(
      'POST',
      `/${this.indexName}/_search?search_pipeline=${encodeURIComponent(this.pipelineName)}`,
      body
    )

    return {
      total: response.body?.hits?.total?.value || 0,
      tools: (response.body?.hits?.hits || []).map((hit) => ({
        ...hit._source,
        _search: {
          score: Number((hit._score || 0).toFixed(4)),
          engine: 'OpenSearch',
          strategy: 'BM25 + HNSW + native RRF',
        },
      })),
    }
  }
}

module.exports = {
  openSearchClient: new OpenSearchClient(),
}

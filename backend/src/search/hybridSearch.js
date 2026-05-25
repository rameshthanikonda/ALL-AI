const VECTOR_DIMENSIONS = 384
const HNSW_MAX_NEIGHBORS = 8
const HNSW_EF_SEARCH = 24
const HNSW_LEVEL_LAMBDA = 1 / Math.log(2)
const BM25_K1 = 1.5
const BM25_B = 0.75
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
  'how',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'tool',
  'tools',
  'with',
  'your',
])

const SYNONYM_MAP = {
  ai: ['assistant', 'automation', 'intelligent'],
  analyze: ['analysis', 'insights', 'analytics'],
  analytics: ['analysis', 'insights', 'tracking'],
  app: ['platform', 'software', 'tool'],
  article: ['blog', 'content', 'writing'],
  automate: ['automation', 'workflow', 'agent'],
  automation: ['automate', 'workflow', 'agent'],
  avatar: ['image', 'portrait', 'generator'],
  bot: ['assistant', 'agent', 'automation'],
  brainstorm: ['ideas', 'creative', 'planning'],
  build: ['create', 'maker', 'generator'],
  calendar: ['schedule', 'planner', 'meetings'],
  chart: ['graph', 'visualization', 'dashboard'],
  chat: ['assistant', 'conversation', 'copilot'],
  code: ['coding', 'developer', 'programming'],
  coding: ['code', 'developer', 'programming'],
  copywriting: ['writing', 'marketing', 'content'],
  create: ['build', 'generate', 'make'],
  crm: ['sales', 'customer', 'pipeline'],
  deck: ['slides', 'presentation', 'pitch'],
  design: ['ui', 'ux', 'creative'],
  developer: ['code', 'coding', 'programming'],
  document: ['docs', 'writing', 'notes'],
  email: ['mail', 'outreach', 'inbox'],
  essay: ['writing', 'paper', 'draft'],
  finance: ['accounting', 'budget', 'money'],
  image: ['photo', 'picture', 'visual'],
  interview: ['jobs', 'career', 'practice'],
  jobs: ['career', 'resume', 'interview'],
  logo: ['branding', 'design', 'identity'],
  math: ['calculation', 'solver', 'study'],
  meeting: ['calendar', 'schedule', 'notes'],
  music: ['audio', 'sound', 'song'],
  note: ['notes', 'document', 'knowledge'],
  notes: ['note', 'document', 'knowledge'],
  pdf: ['document', 'file', 'reader'],
  photo: ['image', 'picture', 'visual'],
  pitch: ['deck', 'presentation', 'slides'],
  plan: ['planning', 'roadmap', 'tasks'],
  presentation: ['slides', 'deck', 'pitch'],
  productivity: ['workflow', 'organize', 'focus'],
  programming: ['code', 'coding', 'developer'],
  research: ['analysis', 'study', 'insights'],
  resume: ['cv', 'jobs', 'career'],
  schedule: ['calendar', 'planner', 'meeting'],
  slide: ['slides', 'presentation', 'deck'],
  slides: ['presentation', 'deck', 'pitch'],
  social: ['marketing', 'posts', 'content'],
  spreadsheet: ['excel', 'sheet', 'table'],
  study: ['learning', 'education', 'revision'],
  summary: ['summarize', 'notes', 'brief'],
  summarize: ['summary', 'brief', 'notes'],
  teacher: ['education', 'learning', 'study'],
  translate: ['translation', 'language', 'multilingual'],
  translation: ['translate', 'language', 'multilingual'],
  video: ['clip', 'editing', 'generator'],
  workflow: ['automation', 'productivity', 'agent'],
  write: ['writing', 'draft', 'content'],
  writer: ['writing', 'content', 'copy'],
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

  return token
    .replace(/(ing|edly|edly|edly|edly)$/i, '')
    .replace(/(ed|es|ly)$/i, '')
    .replace(/s$/i, '')
}

function expandTokens(tokens) {
  const expanded = new Set()

  for (const token of tokens) {
    const stemmed = stemToken(token)
    expanded.add(token)
    expanded.add(stemmed)

    const synonyms = SYNONYM_MAP[token] || SYNONYM_MAP[stemmed] || []
    for (const synonym of synonyms) {
      expanded.add(stemToken(synonym))
    }
  }

  return Array.from(expanded).filter(Boolean)
}

function extractPhrases(query) {
  return String(query || '')
    .split(/[,]/)
    .map((value) => normalizeText(value))
    .filter((value) => value.includes(' '))
}

function hashToken(token, seed = 0) {
  let hash = 2166136261 ^ seed
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function addTokenToVector(vector, token, weight) {
  const primaryIndex = hashToken(token) % VECTOR_DIMENSIONS
  const sign = hashToken(token, 97) % 2 === 0 ? 1 : -1
  vector[primaryIndex] += weight * sign

  if (token.length >= 4) {
    for (let index = 0; index < token.length - 2; index += 1) {
      const ngram = token.slice(index, index + 3)
      const ngramIndex = hashToken(ngram, 13) % VECTOR_DIMENSIONS
      const ngramSign = hashToken(ngram, 29) % 2 === 0 ? 1 : -1
      vector[ngramIndex] += weight * 0.28 * ngramSign
    }
  }
}

function vectorMagnitude(vector) {
  let total = 0
  for (const value of vector) total += value * value
  return Math.sqrt(total)
}

function cosineSimilarity(left, right, leftMagnitude, rightMagnitude) {
  if (!leftMagnitude || !rightMagnitude) return 0

  let dot = 0
  for (let index = 0; index < VECTOR_DIMENSIONS; index += 1) {
    dot += left[index] * right[index]
  }
  return dot / (leftMagnitude * rightMagnitude)
}

function createDocumentText(tool) {
  return [tool.name, tool.category, ...(tool.tags || []), tool.description, tool.url]
    .filter(Boolean)
    .join(' ')
}

function buildWeightedTokens(tool) {
  const entries = []
  const pushTokens = (text, weight) => {
    for (const token of tokenize(text)) {
      entries.push({ token: stemToken(token), weight })
    }
  }

  pushTokens(tool.name, 3.2)
  pushTokens(tool.category, 2.1)
  pushTokens((tool.tags || []).join(' '), 2.6)
  pushTokens(tool.description, 1.5)
  pushTokens(tool.url, 0.8)

  return entries
}

function randomLevel(id) {
  const normalized = (hashToken(id, 71) % 1000000) / 1000000
  return Math.floor(-Math.log(Math.max(normalized, 1e-6)) * HNSW_LEVEL_LAMBDA)
}

function connectNeighbor(graph, sourceIndex, neighborIndex, level, score) {
  const graphNode = graph[sourceIndex]
  if (!graphNode.neighbors[level]) graphNode.neighbors[level] = []

  const bucket = graphNode.neighbors[level]
  if (bucket.some((entry) => entry.index === neighborIndex)) return

  bucket.push({ index: neighborIndex, score })
  bucket.sort((left, right) => right.score - left.score)
  if (bucket.length > HNSW_MAX_NEIGHBORS) bucket.length = HNSW_MAX_NEIGHBORS
}

function buildDenseIndex(documents) {
  const graph = documents.map((document) => ({
    id: String(document._id || document.id || document.slug),
    vector: new Float32Array(VECTOR_DIMENSIONS),
    magnitude: 0,
    level: 0,
    neighbors: {},
  }))

  for (let index = 0; index < documents.length; index += 1) {
    const tool = documents[index]
    const vector = new Float32Array(VECTOR_DIMENSIONS)
    for (const entry of buildWeightedTokens(tool)) {
      addTokenToVector(vector, entry.token, entry.weight)
    }

    graph[index].vector = vector
    graph[index].magnitude = vectorMagnitude(vector)
    graph[index].level = randomLevel(graph[index].id)
  }

  for (let index = 0; index < graph.length; index += 1) {
    for (let level = 0; level <= graph[index].level; level += 1) {
      const candidates = []

      for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
        if (graph[otherIndex].level < level) continue

        const score = cosineSimilarity(
          graph[index].vector,
          graph[otherIndex].vector,
          graph[index].magnitude,
          graph[otherIndex].magnitude
        )

        candidates.push({ otherIndex, score })
      }

      candidates.sort((left, right) => right.score - left.score)
      const selected = candidates.slice(0, HNSW_MAX_NEIGHBORS)

      for (const candidate of selected) {
        connectNeighbor(graph, index, candidate.otherIndex, level, candidate.score)
        connectNeighbor(graph, candidate.otherIndex, index, level, candidate.score)
      }
    }
  }

  return graph
}

function buildSparseStats(documents) {
  const sparseDocs = []
  const documentFrequencies = new Map()
  let totalLength = 0

  for (const tool of documents) {
    const weightedTokens = buildWeightedTokens(tool)
    const termFrequency = new Map()
    const seenTokens = new Set()
    let length = 0

    for (const entry of weightedTokens) {
      length += entry.weight
      termFrequency.set(entry.token, (termFrequency.get(entry.token) || 0) + entry.weight)
      seenTokens.add(entry.token)
    }

    for (const token of seenTokens) {
      documentFrequencies.set(token, (documentFrequencies.get(token) || 0) + 1)
    }

    totalLength += length
    sparseDocs.push({ id: String(tool._id || tool.id || tool.slug), termFrequency, length })
  }

  return {
    sparseDocs,
    documentFrequencies,
    averageLength: sparseDocs.length ? totalLength / sparseDocs.length : 1,
  }
}

function reciprocalRankFusion(rankMaps, limit) {
  const scores = new Map()
  const constant = 60

  for (const rankMap of rankMaps) {
    rankMap.forEach((rank, id) => {
      scores.set(id, (scores.get(id) || 0) + 1 / (constant + rank))
    })
  }

  return Array.from(scores.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
}

function createRankMap(items) {
  const rankMap = new Map()
  items.forEach((item, index) => {
    rankMap.set(item.id, index + 1)
  })
  return rankMap
}

function denseSearch(queryVector, queryMagnitude, graph, limit) {
  if (!graph.length) return []

  let entryIndex = 0
  let highestLevel = graph[0].level

  for (let index = 1; index < graph.length; index += 1) {
    if (graph[index].level > highestLevel) {
      highestLevel = graph[index].level
      entryIndex = index
    }
  }

  let currentIndex = entryIndex
  for (let level = highestLevel; level > 0; level -= 1) {
    let improved = true
    while (improved) {
      improved = false
      const currentNode = graph[currentIndex]
      const currentScore = cosineSimilarity(queryVector, currentNode.vector, queryMagnitude, currentNode.magnitude)
      const neighbors = currentNode.neighbors[level] || []

      for (const neighbor of neighbors) {
        const neighborNode = graph[neighbor.index]
        const neighborScore = cosineSimilarity(queryVector, neighborNode.vector, queryMagnitude, neighborNode.magnitude)
        if (neighborScore > currentScore) {
          currentIndex = neighbor.index
          improved = true
          break
        }
      }
    }
  }

  const candidateIndexes = new Set([currentIndex])
  const queue = [currentIndex]

  while (queue.length && candidateIndexes.size < HNSW_EF_SEARCH) {
    const nextIndex = queue.shift()
    const neighbors = graph[nextIndex].neighbors[0] || []

    for (const neighbor of neighbors) {
      if (candidateIndexes.has(neighbor.index)) continue
      candidateIndexes.add(neighbor.index)
      queue.push(neighbor.index)
      if (candidateIndexes.size >= HNSW_EF_SEARCH) break
    }
  }

  const scored = Array.from(candidateIndexes).map((index) => ({
    id: graph[index].id,
    score: cosineSimilarity(queryVector, graph[index].vector, queryMagnitude, graph[index].magnitude),
  }))

  scored.sort((left, right) => right.score - left.score)
  return scored.slice(0, limit)
}

function buildSearchEngine(tools) {
  const documents = tools.map((tool) => {
    const id = String(tool._id || tool.id || tool.slug)
    const category = normalizeText(tool.category)
    const tags = (tool.tags || []).map((tag) => normalizeText(tag)).filter(Boolean)
    const documentText = normalizeText(createDocumentText(tool))

    return {
      ...tool,
      _searchId: id,
      _searchCategory: category,
      _searchTags: tags,
      _searchText: documentText,
      _searchTokens: tokenize(documentText).map((token) => stemToken(token)),
    }
  })

  const toolMap = new Map(documents.map((tool) => [tool._searchId, tool]))
  const sparseStats = buildSparseStats(documents)
  const denseGraph = buildDenseIndex(documents)

  function sparseSearch(queryTerms, limit) {
    const scored = []

    for (const sparseDoc of sparseStats.sparseDocs) {
      let score = 0

      for (const term of queryTerms) {
        const termFrequency = sparseDoc.termFrequency.get(term)
        if (!termFrequency) continue

        const documentFrequency = sparseStats.documentFrequencies.get(term) || 0
        const inverseDocumentFrequency = Math.log(
          1 + (documents.length - documentFrequency + 0.5) / (documentFrequency + 0.5)
        )
        const denominator =
          termFrequency +
          BM25_K1 * (1 - BM25_B + (BM25_B * sparseDoc.length) / Math.max(sparseStats.averageLength, 1))

        score += inverseDocumentFrequency * ((termFrequency * (BM25_K1 + 1)) / denominator)
      }

      if (score > 0) scored.push({ id: sparseDoc.id, score })
    }

    scored.sort((left, right) => right.score - left.score)
    return scored.slice(0, limit)
  }

  function vectorizeQuery(queryTerms) {
    const vector = new Float32Array(VECTOR_DIMENSIONS)
    for (const term of queryTerms) {
      addTokenToVector(vector, term, 1.8)
    }
    return { vector, magnitude: vectorMagnitude(vector) }
  }

  function rerankResults({ query, queryTerms, rawTerms, sparseResults, denseResults, filters, limit }) {
    const sparseMap = new Map(sparseResults.map((item) => [item.id, item.score]))
    const denseMap = new Map(denseResults.map((item) => [item.id, item.score]))
    const fusion = reciprocalRankFusion([createRankMap(sparseResults), createRankMap(denseResults)], limit * 2)
    const phrases = extractPhrases(query)

    const reranked = []

    for (const [id, fusionScore] of fusion) {
      const tool = toolMap.get(id)
      if (!tool) continue

      if (filters.category && tool._searchCategory !== normalizeText(filters.category)) continue
      if (filters.tags.length && !filters.tags.every((tag) => tool._searchTags.includes(tag))) continue

      let exactBoost = 0
      const reasons = []
      const matchedTerms = rawTerms.filter((term) => tool._searchText.includes(normalizeText(term)))
      const semanticTerms = queryTerms.filter((term) => tool._searchTokens.includes(term) || tool._searchTags.includes(term))

      if (tool._searchCategory && queryTerms.includes(tool._searchCategory)) {
        exactBoost += 0.14
        reasons.push(`category match: ${tool.category}`)
      }

      for (const tag of tool._searchTags) {
        if (queryTerms.includes(tag)) {
          exactBoost += 0.05
          reasons.push(`tag match: ${tag}`)
        }
      }

      for (const phrase of phrases) {
        if (tool._searchText.includes(phrase)) {
          exactBoost += 0.18
          reasons.push(`phrase match: ${phrase}`)
        }
      }

      if (normalizeText(tool.name).startsWith(normalizeText(query))) {
        exactBoost += 0.16
        reasons.push('name starts with query')
      } else if (normalizeText(tool.name).includes(normalizeText(query))) {
        exactBoost += 0.1
        reasons.push('name contains query')
      }

      if (!reasons.length && semanticTerms.length) {
        reasons.push('semantic vector similarity')
      }

      const sparseScore = sparseMap.get(id) || 0
      const denseScore = denseMap.get(id) || 0
      const finalScore = sparseScore * 0.45 + denseScore * 0.35 + fusionScore * 14 + exactBoost

      reranked.push({
        ...tool,
        _search: {
          score: Number(finalScore.toFixed(4)),
          sparseScore: Number(sparseScore.toFixed(4)),
          denseScore: Number(denseScore.toFixed(4)),
          fusionScore: Number(fusionScore.toFixed(4)),
          matchedTerms: matchedTerms.slice(0, 6),
          semanticTerms: semanticTerms.slice(0, 6),
          reasons: Array.from(new Set(reasons)).slice(0, 4),
          strategy: 'bm25 + vector-hnsw + rrf + rerank',
        },
      })
    }

    reranked.sort((left, right) => right._search.score - left._search.score)
    return reranked.slice(0, limit)
  }

  function search({ query = '', category = '', tags = [], limit = 20 }) {
    const normalizedQuery = normalizeText(query)
    const rawTerms = tokenize(query)
    const queryTerms = expandTokens(rawTerms.map((term) => stemToken(term)))
    const normalizedTags = tags.map((tag) => normalizeText(tag)).filter(Boolean)

    const filters = { category, tags: normalizedTags }

    if (!normalizedQuery) {
      return documents
        .filter((tool) => {
          if (filters.category && tool._searchCategory !== normalizeText(filters.category)) return false
          if (filters.tags.length && !filters.tags.every((tag) => tool._searchTags.includes(tag))) return false
          return true
        })
        .sort((left, right) => Number(right.featured) - Number(left.featured) || right.createdAt - left.createdAt)
        .slice(0, limit)
        .map((tool) => ({
          ...tool,
          _search: {
            score: 0,
            sparseScore: 0,
            denseScore: 0,
            fusionScore: 0,
            matchedTerms: [],
            semanticTerms: [],
            reasons: tool.featured ? ['featured tool'] : ['recently added'],
            strategy: 'default browse ranking',
          },
        }))
    }

    const sparseResults = sparseSearch(queryTerms, limit * 3)
    const { vector, magnitude } = vectorizeQuery(queryTerms)
    const denseResults = denseSearch(vector, magnitude, denseGraph, limit * 3)

    const results = rerankResults({
      query: normalizedQuery,
      queryTerms,
      rawTerms,
      sparseResults,
      denseResults,
      filters,
      limit,
    })

    return results
  }

  function facets() {
    const categories = Array.from(
      new Set(documents.map((tool) => tool.category).filter(Boolean).map((value) => String(value).trim()))
    ).sort((left, right) => left.localeCompare(right))

    const tags = Array.from(
      new Set(
        documents
          .flatMap((tool) => tool.tags || [])
          .filter(Boolean)
          .map((value) => String(value).trim())
      )
    ).sort((left, right) => left.localeCompare(right))

    return { categories, tags }
  }

  return { search, facets }
}

module.exports = { buildSearchEngine }

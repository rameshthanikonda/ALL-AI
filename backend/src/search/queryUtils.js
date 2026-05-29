const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'and', 'or', 'to', 'of', 'in', 'on', 'with', 'ai', 'tool', 'tools', 'app', 'apps', 'best', 'free',
])

/** Futurepedia category slugs keyed by query terms. */
const DIRECTORY_CATEGORY_HINTS = [
  { slug: 'video-editing', terms: ['video', 'edit', 'editing', 'clip', 'reels', 'shorts', 'subtitle', 'captions', 'movie', 'filmora', 'capcut'] },
  { slug: 'code-assistant', terms: ['code', 'coding', 'developer', 'programming', 'github', 'copilot', 'ide', 'debug'] },
  { slug: 'writing-generators', terms: ['write', 'writing', 'essay', 'grammar', 'copy', 'blog', 'content'] },
  { slug: 'image-generators', terms: ['image', 'art', 'photo', 'midjourney', 'stable', 'diffusion', 'illustration', 'logo'] },
  { slug: 'text-to-speech', terms: ['voice', 'speech', 'tts', 'audio', 'narration'] },
  { slug: 'chatbots', terms: ['chat', 'chatbot', 'assistant', 'gpt', 'claude', 'gemini'] },
  { slug: 'productivity', terms: ['productivity', 'workflow', 'automation', 'notion', 'tasks', 'calendar'] },
  { slug: 'presentations', terms: ['presentation', 'slides', 'deck', 'pitch'] },
  { slug: 'research', terms: ['research', 'paper', 'citation', 'academic', 'literature'] },
  { slug: 'transcription', terms: ['transcribe', 'transcription', 'meeting', 'notes', 'lecture'] },
  { slug: 'music', terms: ['music', 'audio', 'song', 'sound'] },
  { slug: 'marketing', terms: ['marketing', 'seo', 'ads', 'social', 'campaign'] },
]

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeQuery(query) {
  return normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
}

function scoreToolRelevance(tool, queryTerms, rawQuery = '') {
  if (!queryTerms.length) return 0

  const haystack = normalizeText(
    [tool.name, tool.description, tool.category, ...(tool.tags || [])].filter(Boolean).join(' ')
  )
  const raw = normalizeText(rawQuery)

  let score = 0
  for (const term of queryTerms) {
    if (haystack.includes(term)) score += 3
    else if (haystack.split(' ').some((word) => word.startsWith(term) || term.startsWith(word))) score += 1
  }

  const nameNorm = normalizeText(tool.name)
  if (raw && nameNorm === raw) score += 20
  else if (raw && nameNorm.includes(raw)) score += 12
  else if (queryTerms.every((term) => nameNorm.includes(term))) score += 8

  return score
}

function rankToolsByQuery(tools, query, limit = 12) {
  const queryTerms = tokenizeQuery(query)
  const ranked = tools
    .map((tool) => ({
      tool,
      score: scoreToolRelevance(tool, queryTerms, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)

  if (ranked.length > 0) {
    return ranked.slice(0, limit).map((entry) => entry.tool)
  }

  return tools.slice(0, limit)
}

function termMatchesCategoryHint(term, hint) {
  if (term === hint) return true
  if (term.length < 3 || hint.length < 3) return false
  if (term.includes(hint) || hint.includes(term)) {
    const shorter = term.length <= hint.length ? term : hint
    const longer = term.length > hint.length ? term : hint
    return longer.startsWith(shorter) || longer.endsWith(shorter)
  }
  return false
}

function resolveDirectoryCategories(query) {
  const terms = tokenizeQuery(query)
  if (!terms.length) return []

  const matches = DIRECTORY_CATEGORY_HINTS.map((entry) => {
    const hits = terms.filter((term) => entry.terms.some((hint) => termMatchesCategoryHint(term, hint)))
    return { slug: entry.slug, hits: hits.length }
  })
    .filter((entry) => entry.hits > 0)
    .sort((left, right) => right.hits - left.hits)

  return matches.slice(0, 2).map((entry) => entry.slug)
}

module.exports = {
  STOP_WORDS,
  normalizeText,
  tokenizeQuery,
  scoreToolRelevance,
  rankToolsByQuery,
  resolveDirectoryCategories,
}

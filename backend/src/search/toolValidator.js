const BLOCKED_NAME_PATTERNS = [
  /cache-control/i,
  /http\s+header/i,
  /\bheader\b/i,
  /\bspec\b/i,
  /^\s*what is /i,
  /documentation/i,
  /specification/i,
  /wikipedia/i,
  /hacker news/i,
  /ycombinator/i,
  /cdata/i,
]

const BLOCKED_URL_PATTERNS = [
  /developer\.mozilla\.org/i,
  /w3\.org/i,
  /wikipedia\.org/i,
  /stackoverflow\.com/i,
  /hnrss\.org/i,
  /news\.ycombinator\.com/i,
  /\/docs?\//i,
  /\/reference\//i,
  /\/blog\//i,
  /\/news\//i,
]

const TRUSTED_TOOL_DOMAINS = [
  'toolify.ai',
  'futurepedia.io',
  'producthunt.com',
  'theresanaiforthat.com',
  'topai.tools',
  'aitoolsdirectory.com',
  'openai.com',
  'anthropic.com',
  'cursor.com',
  'notion.so',
]

const AI_SIGNAL_WORDS = ['ai', 'tool', 'app', 'platform', 'generator', 'assistant', 'automation', 'software', 'saas']

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isLegacyJunkTool(tool) {
  if (!tool) return true
  if (tool.category === 'Explore Fallback') return true
  if ((tool.tags || []).includes('live-search')) return true
  return false
}

function isValidToolCandidate(tool) {
  if (!tool) return false
  if (isLegacyJunkTool(tool)) return false

  const name = String(tool.name || '').trim()
  const description = String(tool.description || '').trim()
  const url = String(tool.url || '').trim()

  if (name.length < 2 || name.length > 120) return false
  const host = hostnameFromUrl(url)
  const trustedHost = TRUSTED_TOOL_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
  if (description.length < 12 && !trustedHost) return false
  if (!url.startsWith('http')) return false

  if (BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name) || pattern.test(description))) {
    return false
  }

  if (BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url))) return false

  const haystack = normalizeText(`${name} ${description}`)
  const hasAiSignal = AI_SIGNAL_WORDS.some((word) => haystack.includes(word))
  const directoryListing = /\/tool\/|toolify|futurepedia|producthunt/i.test(url)

  return trustedHost || directoryListing || hasAiSignal
}

function filterValidTools(tools) {
  return (tools || []).filter(isValidToolCandidate)
}

module.exports = {
  isLegacyJunkTool,
  isValidToolCandidate,
  filterValidTools,
  hostnameFromUrl,
  TRUSTED_TOOL_DOMAINS,
}

const { generateSlug } = require('../seo/slugGenerator')

/**
 * Normalize a tool name for duplicate detection.
 * Strips all non-alphanumeric characters and lowercases.
 * e.g. "Chat GPT", "Chat-GPT", "ChatGPT" => "chatgpt"
 */
function normalizeName(name) {
  if (!name) return ''
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Normalize a URL for comparison.
 * Strips trailing slash, query params, fragments, and www prefix.
 */
function normalizeUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    let clean = (parsed.origin + parsed.pathname).toLowerCase()
    clean = clean.replace(/\/+$/, '') // strip trailing slashes
    clean = clean.replace(/^https?:\/\/www\./, 'https://') // normalize www
    return clean
  } catch {
    return String(url).toLowerCase().trim()
  }
}

/**
 * Clean and normalize a single scraped tool record.
 * Ensures consistent data shape before categorization & storage.
 */
function cleanToolRecord(raw) {
  const name = String(raw.name || '').trim()
  if (!name) return null

  const slug = generateSlug(name)
  const normalizedName = normalizeName(name)

  // Clean description - strip HTML tags, excessive whitespace
  let description = String(raw.description || '').trim()
  description = description.replace(/<[^>]*>/g, '') // strip HTML
  description = description.replace(/\s+/g, ' ').trim()
  if (description.length > 500) {
    description = description.substring(0, 497) + '...'
  }

  // Clean URL
  let url = String(raw.url || '').trim()
  if (url && !url.startsWith('http')) {
    url = 'https://' + url
  }

  // Clean pricing
  const VALID_PRICING = ['Free', 'Freemium', 'Paid', 'Free Trial']
  let pricing = String(raw.pricing || '').trim()
  if (!VALID_PRICING.includes(pricing)) {
    const lower = pricing.toLowerCase()
    if (lower.includes('free') && lower.includes('trial')) pricing = 'Free Trial'
    else if (lower.includes('freemium')) pricing = 'Freemium'
    else if (lower.includes('paid') || lower.includes('premium') || lower.includes('$')) pricing = 'Paid'
    else if (lower.includes('free')) pricing = 'Free'
    else pricing = 'Free'
  }

  // Clean tags
  let tags = []
  if (Array.isArray(raw.tags)) {
    tags = raw.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
  } else if (typeof raw.tags === 'string') {
    tags = raw.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  }
  tags = [...new Set(tags)].slice(0, 15)

  // Clean features
  let features = []
  if (Array.isArray(raw.features)) {
    features = raw.features.map(f => String(f).trim()).filter(Boolean)
  }
  features = [...new Set(features)].slice(0, 10)

  // Clean logo URL
  let logoUrl = String(raw.logoUrl || '').trim()
  if (logoUrl && logoUrl.startsWith('//')) {
    logoUrl = 'https:' + logoUrl
  }

  return {
    name,
    slug,
    normalizedName,
    description,
    url,
    logoUrl,
    category: String(raw.category || '').trim() || '',
    pricing,
    tags,
    features,
    source: String(raw.source || 'manual').trim().toLowerCase(),
  }
}

/**
 * Clean a batch of scraped tool records.
 * Filters out invalid/empty records.
 */
function cleanBatch(rawTools) {
  if (!Array.isArray(rawTools)) return []
  return rawTools.map(cleanToolRecord).filter(Boolean)
}

module.exports = {
  cleanToolRecord,
  cleanBatch,
  normalizeName,
  normalizeUrl,
}

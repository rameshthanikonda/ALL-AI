function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

const TAG_RULES = [
  ['internship', ['internship', 'hiring', 'career', 'student jobs']],
  ['job', ['job', 'career', 'hiring', 'placement']],
  ['coding_problem', ['coding', 'practice', 'dsa', 'problem solving']],
  ['gate_resource', ['gate', 'exam prep', 'notes', 'revision']],
  ['ai_news', ['news', 'ai updates', 'trends', 'industry']],
  ['tool', ['ai tool', 'productivity', 'discovery']],
  ['dashboard_card', ['dashboard', 'student', 'workflow']],
]

function generateTags(item) {
  const baseTags = new Set((item.tags || []).map((tag) => normalizeText(tag).toLowerCase()).filter(Boolean))
  const text = `${item.title || ''} ${item.summary || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase()

  for (const [kind, tags] of TAG_RULES) {
    if (item.kind === kind) {
      tags.forEach((tag) => baseTags.add(tag))
    }
  }

  const heuristics = {
    resume: ['resume', 'cv'],
    python: ['python'],
    machine: ['machine learning', 'ml'],
    interview: ['interview prep'],
    frontend: ['frontend'],
    backend: ['backend'],
    aptitude: ['aptitude'],
    mock: ['mock test'],
    scholarship: ['scholarship'],
  }

  Object.entries(heuristics).forEach(([needle, values]) => {
    if (text.includes(needle)) {
      values.forEach((value) => baseTags.add(value))
    }
  })

  return Array.from(baseTags).slice(0, 10)
}

function buildSearchText(item) {
  return [
    item.title,
    item.summary,
    item.description,
    item.category,
    item.company,
    item.provider,
    ...(item.tags || []),
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value))
    .join(' ')
}

function normalizeContentItem(raw) {
  const title = normalizeText(raw.title || raw.name)
  const summary = normalizeText(raw.summary || raw.description)
  const description = normalizeText(raw.description || raw.summary)
  const category = normalizeText(raw.category)

  const item = {
    kind: raw.kind,
    title,
    slug: raw.slug || slugify(`${raw.kind}-${title}`),
    summary,
    description,
    url: normalizeText(raw.url),
    source: normalizeText(raw.source || 'manual'),
    sourceType: normalizeText(raw.sourceType || 'cache'),
    provider: normalizeText(raw.provider),
    category,
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => normalizeText(tag)) : [],
    difficulty: normalizeText(raw.difficulty),
    location: normalizeText(raw.location),
    company: normalizeText(raw.company),
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : new Date(),
    expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : null,
    metadata: raw.metadata || {},
    status: raw.status || 'active',
  }

  item.tags = generateTags(item)
  item.searchText = buildSearchText(item)
  item.updatedAt = new Date()

  return item
}

module.exports = {
  buildSearchText,
  generateTags,
  normalizeContentItem,
  normalizeText,
  slugify,
}

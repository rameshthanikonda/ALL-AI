import { getBackendUrl } from '../utils/appConfig'

const BACKEND = getBackendUrl()

async function checkRes(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || 'fetch_failed')
    err.body = body
    throw err
  }
  return res.json().catch(() => ({}))
}

function requireBackendUrl() {
  if (!BACKEND) {
    throw new Error('backend_not_configured')
  }
}

export async function fetchTools(params = {}) {
  requireBackendUrl()
  const url = new URL(`${BACKEND}/api/tools`)
  const { q, category, tags, page, perPage } = params

  if (q) url.searchParams.set('q', q)
  if (category) url.searchParams.set('category', category)
  if (tags) url.searchParams.set('tags', Array.isArray(tags) ? tags.join(',') : tags)
  if (page) url.searchParams.set('page', page)
  if (perPage) url.searchParams.set('perPage', perPage)

  const res = await fetch(url.toString(), { credentials: 'include' })
  return checkRes(res)
}

export async function fetchTool(slug) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools/${slug}`, { credentials: 'include' })
  return checkRes(res)
}

export async function fetchCategories() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools/categories`, { credentials: 'include' })
  return checkRes(res)
}

export async function fetchPortalOverview() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/portal/overview`, { credentials: 'include' })
  return checkRes(res)
}

export async function fetchPortalFeed(kind, limit = 12) {
  requireBackendUrl()
  const url = new URL(`${BACKEND}/api/portal/feed`)
  if (kind) url.searchParams.set('kind', kind)
  if (limit) url.searchParams.set('limit', limit)
  const res = await fetch(url.toString(), { credentials: 'include' })
  return checkRes(res)
}

export async function fetchInternshipAutomationStatus() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/portal/internships/status`, { credentials: 'include' })
  return checkRes(res)
}

export async function refreshInternshipAutomation() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/portal/internships/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  return checkRes(res)
}

export async function refreshAINewsAutomation() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/portal/news/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  return checkRes(res)
}

export async function bootstrapPortalContent() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/portal/bootstrap`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
  return checkRes(res)
}

export async function register({ email, password, displayName }) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  })
  return checkRes(res)
}

export async function login({ email, password }) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return checkRes(res)
}

export async function logout() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/auth/logout`, { method: 'POST', credentials: 'include' })
  return checkRes(res)
}

export async function fetchCurrentUser() {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/auth/me`, { credentials: 'include' })
  return checkRes(res)
}

export async function createTool(tool) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tool),
  })
  return checkRes(res)
}

export async function importTools(payload, options = {}) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools/bulk`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': options.contentType || 'application/json' },
    body: options.contentType === 'text/csv' ? payload : JSON.stringify(payload),
  })
  return checkRes(res)
}

export async function updateTool(slug, updates) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools/${slug}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return checkRes(res)
}

export async function deleteTool(slug) {
  requireBackendUrl()
  const res = await fetch(`${BACKEND}/api/tools/${slug}`, { method: 'DELETE', credentials: 'include' })
  return checkRes(res)
}

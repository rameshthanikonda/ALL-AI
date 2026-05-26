const configuredBackendUrl =
  __APP_BACKEND_URL__ || import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL || ''

const configuredFrontendUrl =
  __APP_FRONTEND_URL__ || import.meta.env.VITE_FRONTEND_URL || import.meta.env.FRONTEND_URL || ''

const productionBackendUrl = 'https://student-ai-d8qu.onrender.com'

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export function getBackendUrl() {
  // On localhost, use the local backend directly
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    const normalized = normalizeUrl(configuredBackendUrl)
    return normalized || 'http://localhost:4000'
  }

  // In production (deployed), use empty string = same origin
  // Netlify proxy will forward /api/* and /auth/* to the backend
  return ''
}

export function getFrontendUrl() {
  const normalized = normalizeUrl(configuredFrontendUrl)
  if (normalized) return normalized

  if (typeof window !== 'undefined') {
    return normalizeUrl(window.location.origin)
  }

  return ''
}

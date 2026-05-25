const configuredBackendUrl =
  __APP_BACKEND_URL__ || import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL || ''

const configuredFrontendUrl =
  __APP_FRONTEND_URL__ || import.meta.env.VITE_FRONTEND_URL || import.meta.env.FRONTEND_URL || ''

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export function getBackendUrl() {
  const normalized = normalizeUrl(configuredBackendUrl)
  if (normalized) return normalized

  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return 'http://localhost:4000'
  }

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

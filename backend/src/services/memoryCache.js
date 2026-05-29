/**
 * Simple in-memory cache with TTL support.
 * Avoids hitting MongoDB on every single request.
 */
class MemoryCache {
  constructor() {
    this.store = new Map()
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key, value, ttlMs = 60_000) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  invalidate(key) {
    this.store.delete(key)
  }

  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  clear() {
    this.store.clear()
  }
}

// Singleton shared across all routes
const cache = new MemoryCache()

module.exports = { cache, MemoryCache }

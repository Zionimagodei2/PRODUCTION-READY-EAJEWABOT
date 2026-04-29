type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const inMemoryCache = new Map<string, CacheEntry<unknown>>()

function now() {
  return Date.now()
}

export function getCached<T>(key: string): T | null {
  const entry = inMemoryCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now()) {
    inMemoryCache.delete(key)
    return null
  }
  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  inMemoryCache.set(key, {
    value,
    expiresAt: now() + ttlMs,
  })
}

export function clearCached(key: string) {
  inMemoryCache.delete(key)
}

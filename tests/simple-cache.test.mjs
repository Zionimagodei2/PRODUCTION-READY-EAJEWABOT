import test from 'node:test'
import assert from 'node:assert/strict'

const { clearCached, getCached, setCached } = await import('../src/lib/simple-cache.ts')

test('simple-cache stores and returns non-expired values', () => {
  clearCached('cache:test:active')
  setCached('cache:test:active', { ok: true }, 5_000)

  const cached = getCached('cache:test:active')
  assert.deepEqual(cached, { ok: true })
})

test('simple-cache returns null for expired entries', async () => {
  clearCached('cache:test:expired')
  setCached('cache:test:expired', { stale: true }, 10)

  await new Promise((resolve) => setTimeout(resolve, 30))
  const cached = getCached('cache:test:expired')
  assert.equal(cached, null)
})

test('simple-cache clearCached removes entries immediately', () => {
  setCached('cache:test:clear', 'value', 5_000)
  clearCached('cache:test:clear')
  assert.equal(getCached('cache:test:clear'), null)
})

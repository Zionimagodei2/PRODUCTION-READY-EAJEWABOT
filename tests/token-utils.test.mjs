import test from 'node:test'
import assert from 'node:assert/strict'

const { timingSafeTokenEqual } = await import('../src/lib/token-utils.ts')

test('timingSafeTokenEqual matches only equal tokens', () => {
  assert.equal(timingSafeTokenEqual('abc123', 'abc123'), true)
  assert.equal(timingSafeTokenEqual('abc123', 'abc124'), false)
  assert.equal(timingSafeTokenEqual('abc123', 'abc1234'), false)
  assert.equal(timingSafeTokenEqual('', ''), true)
})

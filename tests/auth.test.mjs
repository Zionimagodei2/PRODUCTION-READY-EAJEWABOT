import test from 'node:test'
import assert from 'node:assert/strict'

const { hashPassword, verifyPassword } = await import('../src/lib/auth.ts')

test('hashPassword produces salt:hash format', () => {
  const hashed = hashPassword('super-secure-password')
  const parts = hashed.split(':')

  assert.equal(parts.length, 2)
  assert.ok(parts[0].length > 0)
  assert.ok(parts[1].length > 0)
})

test('verifyPassword validates correct password and rejects invalid one', () => {
  const hashed = hashPassword('my-password')

  assert.equal(verifyPassword('my-password', hashed), true)
  assert.equal(verifyPassword('wrong-password', hashed), false)
})

import test from 'node:test'
import assert from 'node:assert/strict'

const { actorFromRequest, parseAuditLogValue } = await import('../src/lib/audit-log-utils.ts')

test('parseAuditLogValue handles undefined and invalid JSON', () => {
  assert.deepEqual(parseAuditLogValue(undefined), [])
  assert.deepEqual(parseAuditLogValue('{bad-json'), [])
})

test('parseAuditLogValue returns array payloads', () => {
  const payload = [{ id: '1', action: 'create' }]
  assert.deepEqual(parseAuditLogValue(JSON.stringify(payload)), payload)
})

test('actorFromRequest resolves actor header fallback', () => {
  const withOwner = new Request('http://localhost', { headers: { 'x-owner-email': 'owner@eaje.dev' } })
  const withActor = new Request('http://localhost', { headers: { 'x-actor-email': 'ops@eaje.dev' } })
  const empty = new Request('http://localhost')

  assert.equal(actorFromRequest(withOwner), 'owner@eaje.dev')
  assert.equal(actorFromRequest(withActor), 'ops@eaje.dev')
  assert.equal(actorFromRequest(empty), 'system')
})

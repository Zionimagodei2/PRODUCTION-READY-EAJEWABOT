import test from 'node:test'
import assert from 'node:assert/strict'

const { defaultFeatureFlags, parseFeatureFlags } = await import('../src/lib/feature-flags.ts')

test('parseFeatureFlags returns defaults when input is empty', () => {
  assert.deepEqual(parseFeatureFlags(undefined), defaultFeatureFlags)
  assert.deepEqual(parseFeatureFlags(null), defaultFeatureFlags)
  assert.deepEqual(parseFeatureFlags(''), defaultFeatureFlags)
})

test('parseFeatureFlags merges known keys and preserves defaults', () => {
  const parsed = parseFeatureFlags(JSON.stringify({ premiumPlans: false, bulkScheduler: false }))

  assert.equal(parsed.premiumPlans, false)
  assert.equal(parsed.bulkScheduler, false)
  assert.equal(parsed.aiSmartReply, defaultFeatureFlags.aiSmartReply)
  assert.equal(parsed.campaignAnalytics, defaultFeatureFlags.campaignAnalytics)
})

test('parseFeatureFlags falls back to defaults on invalid JSON', () => {
  assert.deepEqual(parseFeatureFlags('{invalid-json'), defaultFeatureFlags)
})

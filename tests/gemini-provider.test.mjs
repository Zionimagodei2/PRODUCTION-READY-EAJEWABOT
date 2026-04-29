import test from 'node:test'
import assert from 'node:assert/strict'

const { geminiChat } = await import('../src/lib/gemini.ts')

test('geminiChat fails fast when no providers are configured', async () => {
  const prev = {
    g1: process.env.GEMINI_API_KEY,
    g2: process.env.GEMINI_API_KEYS,
    o1: process.env.OPENROUTER_API_KEYS,
  }
  delete process.env.GEMINI_API_KEY
  delete process.env.GEMINI_API_KEYS
  delete process.env.OPENROUTER_API_KEYS

  try {
    await assert.rejects(
      () => geminiChat([{ role: 'user', content: 'hello' }]),
      /No AI provider keys configured/
    )
  } finally {
    if (prev.g1 !== undefined) process.env.GEMINI_API_KEY = prev.g1
    if (prev.g2 !== undefined) process.env.GEMINI_API_KEYS = prev.g2
    if (prev.o1 !== undefined) process.env.OPENROUTER_API_KEYS = prev.o1
  }
})

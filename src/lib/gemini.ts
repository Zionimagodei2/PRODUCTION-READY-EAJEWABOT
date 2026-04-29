const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export interface PersonalityProfile {
  tone: string
  style: string
  language: string
  greetingStyle: string
  closingStyle: string
  emojiUsage: string
  formalityLevel: number
  responsePatterns: string
  samplePhrases: string
}

export interface Lead {
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
}

function parseKeys(input?: string) {
  if (!input) return []
  return input.split(',').map((k) => k.trim()).filter(Boolean)
}

function getGeminiKeys() {
  return [...parseKeys(process.env.GEMINI_API_KEYS), ...parseKeys(process.env.GEMINI_API_KEY)]
}

function getOpenRouterKeys() {
  return parseKeys(process.env.OPENROUTER_API_KEYS)
}

function isQuotaError(status: number, bodyText: string) {
  return status === 429 || /quota|rate limit|resource exhausted|too many requests/i.test(bodyText)
}

async function callGemini(key: string, messages: ChatMessage[], systemPrompt?: string, config?: { temperature?: number; maxOutputTokens?: number }) {
  const response = await fetch(`${GEMINI_BASE_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: config?.maxOutputTokens ?? 2048,
      },
    }),
  })

  if (!response.ok) return { ok: false as const, status: response.status, errorText: await response.text() }
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return text ? { ok: true as const, text: String(text) } : { ok: false as const, status: 502, errorText: 'No response generated from Gemini' }
}

async function callOpenRouter(key: string, messages: ChatMessage[], systemPrompt?: string, config?: { temperature?: number; maxOutputTokens?: number }) {
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), ...messages],
      temperature: config?.temperature ?? 0.7,
      max_tokens: config?.maxOutputTokens ?? 1024,
    }),
  })

  if (!response.ok) return { ok: false as const, status: response.status, errorText: await response.text() }
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  return text ? { ok: true as const, text: String(text) } : { ok: false as const, status: 502, errorText: 'No response generated from OpenRouter' }
}

export async function geminiChat(messages: ChatMessage[], systemPrompt?: string, config?: { temperature?: number; maxOutputTokens?: number }): Promise<string> {
  const geminiKeys = getGeminiKeys()
  const openRouterKeys = getOpenRouterKeys()
  if (geminiKeys.length === 0 && openRouterKeys.length === 0) throw new Error('No AI provider keys configured. Set GEMINI_API_KEY(S) or OPENROUTER_API_KEYS.')

  const errors: string[] = []
  for (const key of geminiKeys) {
    const result = await callGemini(key, messages, systemPrompt, config)
    if (result.ok) return result.text
    errors.push(`gemini:${result.status}`)
    if (!isQuotaError(result.status, result.errorText)) break
  }

  for (const key of openRouterKeys) {
    const result = await callOpenRouter(key, messages, systemPrompt, config)
    if (result.ok) return result.text
    errors.push(`openrouter:${result.status}`)
    if (!isQuotaError(result.status, result.errorText)) break
  }

  throw new Error(`AI provider error: ${errors.join(', ') || 'unknown'}`)
}

export async function analyzePersonality(conversations: string): Promise<PersonalityProfile> {
  const systemPrompt = `You are a personality analysis AI. Analyze conversations and return ONLY valid JSON with keys: tone, style, language, greetingStyle, closingStyle, emojiUsage, formalityLevel, responsePatterns, samplePhrases.`
  const result = await geminiChat([{ role: 'user', content: `Analyze these conversations:\n${conversations}` }], systemPrompt, { temperature: 0.3, maxOutputTokens: 1024 })
  try {
    const match = result.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as PersonalityProfile
  } catch {
    // fall through
  }
  return { tone: 'professional', style: 'concise', language: 'english', greetingStyle: 'hello', closingStyle: 'thanks', emojiUsage: 'minimal', formalityLevel: 5, responsePatterns: 'Professional and direct', samplePhrases: 'Thanks for reaching out, Let me check, I will get back to you' }
}

export async function generatePersonalityReply(incomingMessage: string, personalityProfile: PersonalityProfile, conversationContext?: string): Promise<string> {
  const systemPrompt = `You are an AI that replies exactly as the business owner would. Match this profile: ${JSON.stringify(personalityProfile)}.`
  const content = conversationContext ? `${conversationContext}\n\nReply to: ${incomingMessage}` : `Reply to: ${incomingMessage}`
  return geminiChat([{ role: 'user', content }], systemPrompt, { temperature: 0.8, maxOutputTokens: 512 })
}

export async function generateLeads(keyword: string, location: string): Promise<Lead[]> {
  const systemPrompt = 'Generate realistic business leads and return ONLY a JSON array with business, phone, category, rating, address, description.'
  const result = await geminiChat([{ role: 'user', content: `Generate business leads for keyword "${keyword}"${location ? ` in ${location}` : ''}.` }], systemPrompt, { temperature: 0.9, maxOutputTokens: 2048 })
  try {
    const match = result.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0]) as Lead[]
  } catch {
    // fall through
  }
  return []
}

export async function smartAIChat(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
  const systemPrompt = 'You are an expert WhatsApp business automation assistant for the EAJE WhatsBot platform. Provide concise, actionable guidance.'
  return geminiChat([...chatHistory.slice(-10), { role: 'user', content: userMessage }], systemPrompt, { temperature: 0.7, maxOutputTokens: 1024 })
}

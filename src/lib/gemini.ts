// Google Gemini AI Integration - Free API
// Uses Gemini 2.0 Flash for fast, free AI responses

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export interface GeminiRequest {
  contents: GeminiMessage[]
  systemInstruction?: { parts: { text: string }[] }
  generationConfig?: {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
  }
}

export async function geminiChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string,
  config?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const geminiMessages: GeminiMessage[] = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: GeminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature: config?.temperature ?? 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
    },
  }

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini API error:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!text) {
    throw new Error('No response generated from Gemini')
  }

  return text
}

// Analyze conversations and extract personality traits
export async function analyzePersonality(conversations: string): Promise<{
  tone: string
  style: string
  language: string
  greetingStyle: string
  closingStyle: string
  emojiUsage: string
  formalityLevel: number
  responsePatterns: string
  samplePhrases: string
}> {
  const systemPrompt = `You are a personality analysis AI. Analyze the WhatsApp conversations provided and extract the user's communication personality traits. Return ONLY a valid JSON object with these fields:
- tone: One of [professional, casual, friendly, formal, enthusiastic, calm]
- style: One of [concise, detailed, conversational, direct, storytelling]
- language: Primary language used (e.g., english, french, spanish, pidgin)
- greetingStyle: How they greet (e.g., "hey", "hello", "hi there", "good morning")
- closingStyle: How they sign off (e.g., "thanks", "cheers", "best", "talk later")
- emojiUsage: One of [minimal, moderate, heavy, none]
- formalityLevel: Number 1-10 (1=very casual, 10=very formal)
- responsePatterns: Brief description of their typical response style (max 100 chars)
- samplePhrases: 3-5 typical phrases they use, comma-separated (max 200 chars)`

  const result = await geminiChat(
    [{ role: 'user', content: `Analyze these WhatsApp conversations and determine the sender's personality traits:\n\n${conversations}` }],
    systemPrompt,
    { temperature: 0.3, maxOutputTokens: 1024 }
  )

  try {
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    console.error('Failed to parse personality analysis result')
  }

  // Default fallback
  return {
    tone: 'professional',
    style: 'concise',
    language: 'english',
    greetingStyle: 'hello',
    closingStyle: 'thanks',
    emojiUsage: 'minimal',
    formalityLevel: 5,
    responsePatterns: 'Professional and direct',
    samplePhrases: 'Thanks for reaching out, Let me check, I will get back to you',
  }
}

// Generate an auto-reply that matches the user's personality
export async function generatePersonalityReply(
  incomingMessage: string,
  personalityProfile: {
    tone: string
    style: string
    language: string
    greetingStyle: string
    closingStyle: string
    emojiUsage: string
    formalityLevel: number
    responsePatterns: string
    samplePhrases: string
  },
  conversationContext?: string
): Promise<string> {
  const systemPrompt = `You are an AI that replies to WhatsApp messages exactly as the business owner would. You must match their personality perfectly.

PERSONALITY PROFILE:
- Tone: ${personalityProfile.tone}
- Style: ${personalityProfile.style}
- Language: ${personalityProfile.language}
- Greeting style: ${personalityProfile.greetingStyle}
- Closing style: ${personalityProfile.closingStyle}
- Emoji usage: ${personalityProfile.emojiUsage}
- Formality level: ${personalityProfile.formalityLevel}/10
- Response patterns: ${personalityProfile.responsePatterns}
- Typical phrases: ${personalityProfile.samplePhrases}

RULES:
1. Reply as if you ARE the business owner, not an AI
2. Match their exact tone, style, and formality
3. Use similar greetings and closings
4. Match their emoji usage level
5. Keep responses in their preferred language
6. Never mention you are an AI or chatbot
7. Be helpful and address the customer's needs
8. Keep it natural and authentic`

  const messages: { role: 'user' | 'assistant'; content: string }[] = []
  
  if (conversationContext) {
    messages.push({
      role: 'user',
      content: `Here is the conversation history for context:\n${conversationContext}\n\nNow reply to this new message: "${incomingMessage}"`
    })
  } else {
    messages.push({
      role: 'user',
      content: `Reply to this WhatsApp message: "${incomingMessage}"`
    })
  }

  return geminiChat(messages, systemPrompt, { temperature: 0.8, maxOutputTokens: 512 })
}

// Generate leads using AI analysis
export async function generateLeads(keyword: string, location: string): Promise<{
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
}[]> {
  const systemPrompt = `You are a business lead generation AI. Given a keyword and location, generate realistic business leads. Return ONLY a valid JSON array of objects with these fields:
- business: Business name (realistic sounding)
- phone: Phone number with country code
- category: Business category
- rating: Rating between 3.5 and 5.0
- address: Street address
- description: Brief 1-sentence description of the business

Generate 6-8 diverse, realistic leads. Make the businesses varied and interesting.`

  const result = await geminiChat(
    [{ role: 'user', content: `Generate business leads for keyword "${keyword}"${location ? ` in ${location}` : ''}. Return a JSON array of lead objects.` }],
    systemPrompt,
    { temperature: 0.9, maxOutputTokens: 2048 }
  )

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    console.error('Failed to parse lead generation result')
  }

  return []
}

// Smart AI chat for the AI Assistant
export async function smartAIChat(
  userMessage: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  const systemPrompt = `You are an expert WhatsApp business automation assistant for the EAJE WhatsBot platform. You help users with:

- Campaign optimization (targeting, messaging strategies, A/B testing)
- Best send times and scheduling strategies
- Improving reply rates and engagement
- Chatbot flow design and best practices
- Contact management and list hygiene
- Message template creation
- Auto-reply rule setup
- Analytics interpretation
- Lead generation and scraping strategies
- WhatsApp link generation
- General WhatsApp Business API guidance

Keep your responses concise, actionable, and well-structured. Use bullet points and bold text for emphasis when appropriate. If asked about unrelated topics, gently redirect to WhatsApp automation topics. Always be helpful and professional.`

  const messages = [
    ...chatHistory.slice(-10), // Keep last 10 messages for context
    { role: 'user' as const, content: userMessage },
  ]

  return geminiChat(messages, systemPrompt, { temperature: 0.7, maxOutputTokens: 1024 })
}

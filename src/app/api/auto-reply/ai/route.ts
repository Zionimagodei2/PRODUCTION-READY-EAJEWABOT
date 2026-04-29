import { NextResponse } from 'next/server'
import { geminiChat } from '@/lib/gemini'

const PERSONALITY_PROMPTS: Record<string, string> = {
  professional: 'You are formal, concise, and business-focused. Use professional language and maintain a respectful tone.',
  friendly: 'You are warm, approachable, and conversational. Use a welcoming tone with light emojis occasionally.',
  casual: 'You are relaxed and informal. Use everyday language, contractions, and a laid-back tone.',
  support: 'You are patient, empathetic, and solution-oriented. Focus on understanding the customer issue and providing clear help.',
  sales: 'You are persuasive, enthusiastic, and benefit-focused. Highlight value propositions and guide toward conversion.',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context, businessName, personality, previousMessages } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const business = businessName || 'EAJE WhatsBot'
    const personalityType = personality || 'professional'
    const personalityPrompt = PERSONALITY_PROMPTS[personalityType] || PERSONALITY_PROMPTS.professional

    const systemPrompt = `You are a helpful WhatsApp business assistant for ${business}. ${personalityPrompt} Respond professionally and concisely to customer messages. Keep responses under 160 characters when possible. Be friendly and helpful.${context ? ` Business context: ${context}` : ''}`

    const history = Array.isArray(previousMessages)
      ? previousMessages
          .slice(-6)
          .filter((msg: { role?: string; content?: string }) => msg?.role && msg?.content)
          .map((msg: { role: string; content: string }) => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content }))
      : []

    const text = await geminiChat([...history, { role: 'user', content: message }], systemPrompt, { temperature: 0.7, maxOutputTokens: 256 })

    return NextResponse.json({ reply: text.trim(), source: 'ai' })
  } catch (error) {
    console.error('AI Auto-Reply error:', error)
    return NextResponse.json({
      reply: "Thanks for your message! We'll get back to you shortly.",
      source: 'ai',
      fallback: true,
    })
  }
}

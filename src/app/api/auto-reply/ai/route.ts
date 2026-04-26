import { NextResponse } from 'next/server'

const GEMINI_API_KEY = 'AIzaSyCtuD2C13DezjQJ-SSNiSynyYuui2igOhs'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

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
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const business = businessName || 'EAJE WhatsBot'
    const personalityType = personality || 'professional'
    const personalityPrompt = PERSONALITY_PROMPTS[personalityType] || PERSONALITY_PROMPTS.professional

    const systemPrompt = `You are a helpful WhatsApp business assistant for ${business}. ${personalityPrompt} Respond professionally and concisely to customer messages. Keep responses under 160 characters when possible. Be friendly and helpful.${context ? ` Business context: ${context}` : ''}`

    // Build conversation messages for Gemini
    const geminiMessages: { role: 'user' | 'model'; parts: { text: string }[] }[] = []

    // Add previous messages for context
    if (Array.isArray(previousMessages) && previousMessages.length > 0) {
      for (const msg of previousMessages.slice(-6)) {
        if (msg.role && msg.content) {
          geminiMessages.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })
        }
      }
    }

    // Add the current user message
    geminiMessages.push({
      role: 'user',
      parts: [{ text: message }],
    })

    const requestBody = {
      contents: geminiMessages,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 256,
      },
    }

    const response = await fetch(
      `${GEMINI_BASE_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      // Fallback response
      return NextResponse.json({
        reply: "Thanks for your message! We'll get back to you shortly.",
        source: 'ai',
        fallback: true,
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json({
        reply: "Thanks for reaching out! A team member will respond soon.",
        source: 'ai',
        fallback: true,
      })
    }

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

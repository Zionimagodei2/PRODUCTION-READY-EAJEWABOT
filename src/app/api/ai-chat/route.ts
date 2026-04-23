import ZAI from 'z-ai-web-dev-sdk'
import { NextResponse } from 'next/server'

const zai = new ZAI({
  baseUrl: process.env.ZAI_BASE_URL || 'https://api.zukijourney.com/v2',
  apiKey: process.env.ZAI_API_KEY || '',
})

const SYSTEM_PROMPT = `You are an expert WhatsApp business automation assistant for the EAJE WhatsBot platform. You help users with:

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    })

    const response = completion.choices?.[0]?.message?.content || 
      "I'm sorry, I couldn't generate a response. Please try again."

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

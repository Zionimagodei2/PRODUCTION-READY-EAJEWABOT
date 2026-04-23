import { NextResponse } from 'next/server'
import { smartAIChat } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if GEMINI_API_KEY is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        response: "🔑 **Gemini API Key Not Configured**\n\nTo use the AI Assistant, you need to set up a free Google Gemini API key:\n\n1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. Sign in with your Google account\n3. Click **\"Create API Key\"**\n4. Copy the key\n5. Set it as the `GEMINI_API_KEY` environment variable\n\nThe Gemini API is completely free and provides fast, intelligent responses for your WhatsApp automation needs.",
        needsConfig: true,
      })
    }

    // Use chat history if provided, otherwise empty array
    const chatHistory = Array.isArray(history)
      ? history.filter((m: { role: string; content: string }) => m.role && m.content).slice(-10)
      : []

    const response = await smartAIChat(message, chatHistory)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI Chat API error:', error)

    // Provide a helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('GEMINI_API_KEY')) {
      return NextResponse.json({
        response: "🔑 **Gemini API Key Not Configured**\n\nTo use the AI Assistant, please set the `GEMINI_API_KEY` environment variable. You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).",
        needsConfig: true,
      })
    }

    return NextResponse.json(
      { error: 'Failed to generate AI response. Please try again.' },
      { status: 500 }
    )
  }
}

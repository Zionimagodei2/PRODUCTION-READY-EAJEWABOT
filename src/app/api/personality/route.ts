import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { analyzePersonality, generatePersonalityReply } from '@/lib/gemini'

export async function GET() {
  try {
    // Get the current personality profile (there should only be one)
    let profile = await db.personalityProfile.findFirst()

    if (!profile) {
      // Create a default profile if none exists
      profile = await db.personalityProfile.create({
        data: {
          tone: 'professional',
          style: 'concise',
          language: 'english',
          greetingStyle: 'hello',
          closingStyle: 'thanks',
          emojiUsage: 'minimal',
          formalityLevel: 5,
          responsePatterns: 'Professional and direct',
          samplePhrases: 'Thanks for reaching out,Let me check,I will get back to you',
        },
      })
    }

    return NextResponse.json({
      ...profile,
      lastTrainedAt: profile.lastTrainedAt.toISOString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Personality GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch personality profile' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    // Check if GEMINI_API_KEY is available for AI features
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY is not configured',
        message: 'To use AI personality features, please set the GEMINI_API_KEY environment variable. You can get a free API key from https://aistudio.google.com/app/apikey',
      }, { status: 503 })
    }

    if (action === 'train') {
      // Train personality profile using existing conversations
      const conversations = await db.conversation.findMany({
        where: { direction: 'outgoing' },
        orderBy: { timestamp: 'desc' },
        take: 50,
      })

      if (conversations.length === 0) {
        return NextResponse.json({
          error: 'No outgoing conversations found',
          message: 'Send some messages first so the AI can learn your personality from your writing style.',
        }, { status: 400 })
      }

      // Format conversations for analysis
      const conversationText = conversations.map(c =>
        `[${c.contactName || 'Contact'}]: ${c.content}`
      ).join('\n\n')

      // Analyze personality using Gemini
      const analysis = await analyzePersonality(conversationText)

      // Update or create personality profile
      const existingProfile = await db.personalityProfile.findFirst()

      let profile
      if (existingProfile) {
        profile = await db.personalityProfile.update({
          where: { id: existingProfile.id },
          data: {
            tone: analysis.tone,
            style: analysis.style,
            language: analysis.language,
            greetingStyle: analysis.greetingStyle,
            closingStyle: analysis.closingStyle,
            emojiUsage: analysis.emojiUsage,
            formalityLevel: analysis.formalityLevel,
            responsePatterns: analysis.responsePatterns,
            samplePhrases: analysis.samplePhrases,
            lastTrainedAt: new Date(),
          },
        })
      } else {
        profile = await db.personalityProfile.create({
          data: {
            tone: analysis.tone,
            style: analysis.style,
            language: analysis.language,
            greetingStyle: analysis.greetingStyle,
            closingStyle: analysis.closingStyle,
            emojiUsage: analysis.emojiUsage,
            formalityLevel: analysis.formalityLevel,
            responsePatterns: analysis.responsePatterns,
            samplePhrases: analysis.samplePhrases,
          },
        })
      }

      return NextResponse.json({
        ...profile,
        lastTrainedAt: profile.lastTrainedAt.toISOString(),
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
        trained: true,
        conversationsAnalyzed: conversations.length,
      })
    }

    if (action === 'generate-reply') {
      // Generate a personality-matched reply
      const { message: incomingMessage, contactId } = body

      if (!incomingMessage) {
        return NextResponse.json({ error: 'Incoming message is required' }, { status: 400 })
      }

      // Get the personality profile
      let profile = await db.personalityProfile.findFirst()

      if (!profile) {
        // Create a default profile if none exists
        profile = await db.personalityProfile.create({
          data: {
            tone: 'professional',
            style: 'concise',
            language: 'english',
            greetingStyle: 'hello',
            closingStyle: 'thanks',
            emojiUsage: 'minimal',
            formalityLevel: 5,
            responsePatterns: 'Professional and direct',
            samplePhrases: 'Thanks for reaching out,Let me check,I will get back to you',
          },
        })
      }

      // Get conversation context if contactId is provided
      let context: string | undefined
      if (contactId) {
        const recentConversations = await db.conversation.findMany({
          where: { contactId },
          orderBy: { timestamp: 'desc' },
          take: 10,
        })
        if (recentConversations.length > 0) {
          context = recentConversations
            .reverse()
            .map(c => `${c.direction === 'outgoing' ? 'You' : (c.contactName || 'Contact')}: ${c.content}`)
            .join('\n')
        }
      }

      // Generate reply using Gemini
      const reply = await generatePersonalityReply(
        incomingMessage,
        {
          tone: profile.tone,
          style: profile.style,
          language: profile.language,
          greetingStyle: profile.greetingStyle,
          closingStyle: profile.closingStyle,
          emojiUsage: profile.emojiUsage,
          formalityLevel: profile.formalityLevel,
          responsePatterns: profile.responsePatterns,
          samplePhrases: profile.samplePhrases,
        },
        context,
      )

      return NextResponse.json({ reply, personalityUsed: profile.tone })
    }

    return NextResponse.json({ error: 'Invalid action. Use "train" or "generate-reply"' }, { status: 400 })
  } catch (error) {
    console.error('Personality POST error:', error)
    return NextResponse.json({ error: 'Failed to process personality request' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { analyzePersonality, generatePersonalityReply } from '@/lib/gemini'

export async function GET() {
  try {
    const profile = await db.personalityProfile.findFirst()

    // Get auto-reply enabled setting from the Setting table
    let autoReplyEnabled = false
    const setting = await db.setting.findUnique({ where: { key: 'autoReplyEnabled' } })
    if (setting) {
      autoReplyEnabled = setting.value === 'true'
    }

    if (!profile) {
      return NextResponse.json({
        profile: null,
        autoReplyEnabled,
      })
    }

    return NextResponse.json({
      profile: {
        ...profile,
        lastTrainedAt: profile.lastTrainedAt.toISOString(),
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
      autoReplyEnabled,
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
        profile: {
          ...profile,
          lastTrainedAt: profile.lastTrainedAt.toISOString(),
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
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

      const profile = await db.personalityProfile.findFirst()
      if (!profile) {
        return NextResponse.json({
          error: 'No personality profile available',
          message: 'Train your personality profile before generating AI replies.',
        }, { status: 400 })
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

    if (action === 'toggle-auto-reply') {
      // Toggle auto-reply on/off
      const { enabled } = body
      await db.setting.upsert({
        where: { key: 'autoReplyEnabled' },
        update: { value: String(!!enabled) },
        create: { key: 'autoReplyEnabled', value: String(!!enabled) },
      })
      return NextResponse.json({ autoReplyEnabled: !!enabled })
    }

    if (action === 'import-conversations') {
      // Parse WhatsApp export text and save as conversations
      const { conversations } = body
      if (!conversations || typeof conversations !== 'string') {
        return NextResponse.json({ error: 'Conversations text is required' }, { status: 400 })
      }

      // Parse WhatsApp format: "1/15/24, 10:30 AM - Name: Message"
      const lines = conversations.split('\n').filter((l: string) => l.trim())
      let count = 0

      for (const line of lines) {
        // Match pattern: date, time - Name: Message
        const match = line.match(/^\d{1,2}\/\d{1,2}\/\d{2,4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\s*-\s*([^:]+):\s*(.+)$/)
        if (match) {
          const [, name, content] = match
          const isOutgoing = name.trim().toLowerCase() === 'you' || name.trim().toLowerCase() === 'vous'
          
          await db.conversation.create({
            data: {
              contactName: isOutgoing ? 'You' : name.trim(),
              direction: isOutgoing ? 'outgoing' : 'incoming',
              content: content.trim(),
            },
          })
          count++
        }
      }

      return NextResponse.json({ count, message: `Imported ${count} messages` })
    }

    return NextResponse.json({ error: 'Invalid action. Use "train", "generate-reply", "toggle-auto-reply", or "import-conversations"' }, { status: 400 })
  } catch (error) {
    console.error('Personality POST error:', error)
    return NextResponse.json({ error: 'Failed to process personality request' }, { status: 500 })
  }
}

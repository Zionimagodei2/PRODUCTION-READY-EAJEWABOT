import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    const where = contactId ? { contactId } : {}

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    const total = await db.conversation.count({ where })

    return NextResponse.json({
      total,
      conversations: conversations.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    const conversation = await db.conversation.create({
      data: {
        contactId: body.contactId || '',
        contactName: body.contactName || '',
        direction: body.direction || 'incoming',
        content: body.content,
      },
    })

    return NextResponse.json({
      ...conversation,
      timestamp: conversation.timestamp.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

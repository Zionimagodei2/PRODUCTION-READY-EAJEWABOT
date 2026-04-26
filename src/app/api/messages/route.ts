import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    const messages = await db.conversation.findMany({
      where: { contactId },
      orderBy: { timestamp: 'asc' },
      take: 500,
    })

    return NextResponse.json({
      messages: messages.map(m => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.content || !body.contactId) {
      return NextResponse.json({ error: 'content and contactId are required' }, { status: 400 })
    }

    const message = await db.conversation.create({
      data: {
        contactId: body.contactId,
        contactName: body.contactName || '',
        contactPhone: body.contactPhone || '',
        direction: 'outgoing',
        content: body.content,
        status: 'sent',
        isRead: true,
        mediaType: body.mediaType || '',
        mediaUrl: body.mediaUrl || '',
      },
    })

    // Also update the contact's lastMessage
    try {
      await db.contact.updateMany({
        where: { id: body.contactId },
        data: { lastMessage: body.content },
      })
    } catch {
      // Contact may not exist, that's okay
    }

    return NextResponse.json({
      ...message,
      timestamp: message.timestamp.toISOString(),
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() || null,
    }, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

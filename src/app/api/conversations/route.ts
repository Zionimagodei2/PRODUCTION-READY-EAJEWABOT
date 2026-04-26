import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const search = searchParams.get('search')
    const filter = searchParams.get('filter') // 'all', 'unread', 'groups', 'archived'
    const view = searchParams.get('view') // 'threads' or 'messages'

    // If viewing messages for a specific contact (thread view)
    if (view === 'messages' && contactId) {
      const messages = await db.conversation.findMany({
        where: { contactId },
        orderBy: { timestamp: 'asc' },
        take: 200,
      })

      return NextResponse.json({
        messages: messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() || null,
        })),
      })
    }

    // Build where clause
    const where: Record<string, unknown> = {}
    if (contactId) where.contactId = contactId

    // Filter logic
    if (filter === 'unread') {
      where.isRead = false
      where.isArchived = false
    } else if (filter === 'archived') {
      where.isArchived = true
    } else if (filter === 'groups') {
      // Groups are conversations with multiple participants (heuristic: group name patterns)
      where.isArchived = false
    } else {
      // 'all' - exclude archived by default
      where.isArchived = false
    }

    // Search logic
    if (search) {
      where.OR = [
        { contactName: { contains: search } },
        { contactPhone: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 200,
    })

    const total = await db.conversation.count({ where: { isArchived: false } })

    // Group by contactId to create thread summaries
    const threadMap = new Map<string, {
      contactId: string
      contactName: string
      contactPhone: string
      lastMessage: string
      lastTimestamp: string
      unreadCount: number
      totalMessages: number
      isPinned: boolean
      isArchived: boolean
      lastDirection: string
      lastStatus: string
      isOnline: boolean
    }>()

    for (const conv of conversations) {
      const key = conv.contactId || conv.contactName || 'unknown'
      const existing = threadMap.get(key)

      const msgDate = conv.timestamp.toISOString()
      if (!existing || new Date(msgDate) > new Date(existing.lastTimestamp)) {
        threadMap.set(key, {
          contactId: conv.contactId || key,
          contactName: conv.contactName || 'Unknown Contact',
          contactPhone: conv.contactPhone || '',
          lastMessage: conv.content,
          lastTimestamp: msgDate,
          unreadCount: existing?.unreadCount || 0,
          totalMessages: (existing?.totalMessages || 0) + 1,
          isPinned: existing?.isPinned || conv.isPinned,
          isArchived: existing?.isArchived || conv.isArchived,
          lastDirection: conv.direction,
          lastStatus: conv.status,
          isOnline: false,
        })
      } else {
        // Update counts
        existing.totalMessages += 1
        if (conv.isPinned) existing.isPinned = true
      }

      if (!conv.isRead && conv.direction === 'incoming') {
        const entry = threadMap.get(key)!
        entry.unreadCount += 1
      }
    }

    // Convert to array and sort
    const threads = Array.from(threadMap.values())
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    })

    return NextResponse.json({
      total,
      conversations: conversations.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        createdAt: c.createdAt.toISOString(),
        readAt: c.readAt?.toISOString() || null,
      })),
      threads,
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
        contactPhone: body.contactPhone || '',
        direction: body.direction || 'incoming',
        content: body.content,
        status: body.status || 'sent',
        isRead: body.isRead ?? (body.direction === 'outgoing'),
        isPinned: body.isPinned ?? false,
        isArchived: body.isArchived ?? false,
        mediaType: body.mediaType || '',
        mediaUrl: body.mediaUrl || '',
      },
    })

    return NextResponse.json({
      ...conversation,
      timestamp: conversation.timestamp.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
      readAt: conversation.readAt?.toISOString() || null,
    }, { status: 201 })
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, contactId, ...data } = body

    // Bulk actions by contactId
    if (action && contactId) {
      if (action === 'mark-read') {
        await db.conversation.updateMany({
          where: { contactId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        })
        return NextResponse.json({ success: true, action: 'mark-read' })
      }
      if (action === 'mark-unread') {
        await db.conversation.updateMany({
          where: { contactId },
          data: { isRead: false, readAt: null },
        })
        return NextResponse.json({ success: true, action: 'mark-unread' })
      }
      if (action === 'pin') {
        await db.conversation.updateMany({
          where: { contactId },
          data: { isPinned: true },
        })
        return NextResponse.json({ success: true, action: 'pin' })
      }
      if (action === 'unpin') {
        await db.conversation.updateMany({
          where: { contactId },
          data: { isPinned: false },
        })
        return NextResponse.json({ success: true, action: 'unpin' })
      }
      if (action === 'archive') {
        await db.conversation.updateMany({
          where: { contactId },
          data: { isArchived: true },
        })
        return NextResponse.json({ success: true, action: 'archive' })
      }
      if (action === 'unarchive') {
        await db.conversation.updateMany({
          where: { contactId },
          data: { isArchived: false },
        })
        return NextResponse.json({ success: true, action: 'unarchive' })
      }
    }

    // Single message update
    if (id) {
      const conversation = await db.conversation.update({
        where: { id },
        data,
      })
      return NextResponse.json({
        ...conversation,
        timestamp: conversation.timestamp.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        readAt: conversation.readAt?.toISOString() || null,
      })
    }

    return NextResponse.json({ error: 'No action specified' }, { status: 400 })
  } catch (error) {
    console.error('Conversations PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}

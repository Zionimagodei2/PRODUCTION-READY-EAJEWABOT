import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [contacts, campaigns, conversations] = await Promise.all([
      db.contact.findMany(),
      db.campaign.findMany(),
      db.conversation.findMany(),
    ])

    // Compute aggregate stats for analytics record count
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0
    const replyRate = totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 1000) / 10 : 0

    // Analytics record count = number of campaigns that have been sent + overall stats entry
    const analyticsCount = campaigns.filter(c => c.sent > 0).length + (totalSent > 0 ? 1 : 0)

    return NextResponse.json({
      contacts: contacts.length,
      campaigns: campaigns.length,
      messages: conversations.length,
      analytics: analyticsCount,
      // Include aggregate stats for analytics export
      stats: {
        totalSent,
        totalDelivered,
        totalReplies,
        deliveryRate,
        replyRate,
      },
    })
  } catch (error) {
    console.error('Export counts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch record counts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, format } = body as { type: 'contacts' | 'campaigns' | 'messages' | 'analytics'; format: 'csv' | 'json' }

    if (!type || !format) {
      return NextResponse.json({ error: 'Type and format are required' }, { status: 400 })
    }

    if (format === 'json') {
      return handleJsonExport(type)
    }

    return handleCsvExport(type)
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

async function handleJsonExport(type: string) {
  switch (type) {
    case 'contacts': {
      const contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } })
      const data = contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        company: c.company,
        location: c.location,
        tags: c.tags,
        status: c.status,
        score: c.score,
        lastMessage: c.lastMessage,
        dateAdded: c.dateAdded,
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-contacts-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }
    case 'campaigns': {
      const campaigns = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
      const data = campaigns.map(c => ({
        name: c.name,
        status: c.status,
        total: c.total,
        sent: c.sent,
        delivered: c.delivered,
        replies: c.replies,
        deliveryRate: c.sent > 0 ? `${((c.delivered / c.sent) * 100).toFixed(1)}%` : 'N/A',
        message: c.message,
        createdAt: c.createdAt,
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-campaigns-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }
    case 'messages': {
      const conversations = await db.conversation.findMany({ orderBy: { timestamp: 'desc' } })
      const data = conversations.map(c => ({
        timestamp: c.timestamp,
        contact: c.contactName,
        contactId: c.contactId,
        direction: c.direction,
        content: c.content,
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-messages-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }
    case 'analytics': {
      const campaigns = await db.campaign.findMany()
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
      const data = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalCampaigns: campaigns.length,
          totalSent,
          totalDelivered,
          totalReplies,
          deliveryRate: totalSent > 0 ? `${((totalDelivered / totalSent) * 100).toFixed(1)}%` : '0%',
          replyRate: totalDelivered > 0 ? `${((totalReplies / totalDelivered) * 100).toFixed(1)}%` : '0%',
        },
        campaigns: campaigns.map(c => ({
          name: c.name,
          status: c.status,
          sent: c.sent,
          delivered: c.delivered,
          replies: c.replies,
          deliveryRate: c.sent > 0 ? `${((c.delivered / c.sent) * 100).toFixed(1)}%` : 'N/A',
        })),
      }
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-analytics-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }
    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }
}

async function handleCsvExport(type: string) {
  switch (type) {
    case 'contacts': {
      const contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } })
      const header = 'Name,Phone,Email,Company,Location,Tags,Status,Score,LastMessage,DateAdded'
      const rows = contacts.map(c =>
        `"${c.name}","${c.phone}","${c.email}","${c.company}","${c.location}","${c.tags}","${c.status}",${c.score},"${c.lastMessage.replace(/"/g, '""')}","${c.dateAdded.toISOString()}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    case 'campaigns': {
      const campaigns = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
      const header = 'Campaign Name,Status,Total,Sent,Delivered,Replies,Delivery Rate,Message,Created At'
      const rows = campaigns.map(c =>
        `"${c.name}","${c.status}",${c.total},${c.sent},${c.delivered},${c.replies},"${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) + '%' : 'N/A'}","${c.message.replace(/"/g, '""')}","${c.createdAt.toISOString()}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-campaigns-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    case 'messages': {
      const conversations = await db.conversation.findMany({ orderBy: { timestamp: 'desc' } })
      const header = 'Timestamp,Contact,Contact ID,Direction,Content'
      const rows = conversations.map(c =>
        `"${c.timestamp.toISOString()}","${c.contactName}","${c.contactId}","${c.direction}","${c.content.replace(/"/g, '""')}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    case 'analytics': {
      const campaigns = await db.campaign.findMany()
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
      const header = 'Campaign Name,Status,Sent,Delivered,Replies,Delivery Rate'
      const rows = campaigns.map(c =>
        `"${c.name}","${c.status}",${c.sent},${c.delivered},${c.replies},"${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) + '%' : 'N/A'}"`
      )
      const summaryRow = `"TOTAL","-",${totalSent},${totalDelivered},${totalReplies},"${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) + '%' : '0%'}"`
      const csv = [header, ...rows, '', summaryRow].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }
    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }
}

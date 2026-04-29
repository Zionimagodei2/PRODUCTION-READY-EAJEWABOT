import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getRequestId } from '@/lib/request-id'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'

type ExportType = 'contacts' | 'campaigns' | 'messages' | 'analytics'
type ExportFormat = 'csv' | 'json' | 'vcard' | 'pdf'
type DateRange = '7d' | '30d' | '90d' | 'all'

function getDateFilter(range: DateRange): Date | null {
  if (range === 'all') return null
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function safeStr(val: string | null | undefined, fallback = ''): string {
  if (!val) return fallback
  return val.replace(/"/g, '""')
}

function safeDate(val: Date | null | undefined): string {
  if (!val) return ''
  try {
    return new Date(val).toISOString()
  } catch {
    return ''
  }
}

export async function GET() {
  try {
    const [contactsCount, campaignsCount, conversationsCount] = await Promise.all([
      db.contact.count(),
      db.campaign.count(),
      db.conversation.count(),
    ])

    // Analytics count = campaigns with activity + 1 for summary if any data exists
    const campaignsSent = await db.campaign.count({ where: { sent: { gt: 0 } } })
    const analyticsCount = campaignsSent + (campaignsCount > 0 ? 1 : 0)

    // Compute aggregate stats for analytics export
    const campaigns = await db.campaign.findMany()
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0
    const replyRate = totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 1000) / 10 : 0

    return NextResponse.json({
      contacts: contactsCount,
      campaigns: campaignsCount,
      messages: conversationsCount,
      analytics: analyticsCount,
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
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const { type, format, dateRange } = body as {
      type: ExportType
      format: ExportFormat
      dateRange?: DateRange
    }

    if (!type || !format) {
      return NextResponse.json({ error: 'Type and format are required', requestId }, { status: 400 })
    }

    const range: DateRange = dateRange || 'all'
    const since = getDateFilter(range)

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'export_requested',
      entity: 'export',
      requestId,
      metadata: { type, format, dateRange: range },
    })

    switch (format) {
      case 'json':
        return handleJsonExport(type, since)
      case 'csv':
        return handleCsvExport(type, since)
      case 'vcard':
        return handleVcardExport(type, since)
      case 'pdf':
        return handlePdfExport(type, since)
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json({ error: 'Failed to export data', requestId }, { status: 500 })
  }
}

async function handleJsonExport(type: ExportType, since: Date | null) {
  const timestamp = new Date().toISOString().slice(0, 10)

  switch (type) {
    case 'contacts': {
      const where = since ? { dateAdded: { gte: since } } : {}
      const contacts = await db.contact.findMany({ where, orderBy: { createdAt: 'desc' } })
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
        dateAdded: safeDate(c.dateAdded),
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-contacts-${timestamp}.json"`,
        },
      })
    }
    case 'campaigns': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where, orderBy: { createdAt: 'desc' } })
      const data = campaigns.map(c => ({
        name: c.name,
        status: c.status,
        total: c.total,
        sent: c.sent,
        delivered: c.delivered,
        replies: c.replies,
        deliveryRate: c.sent > 0 ? `${((c.delivered / c.sent) * 100).toFixed(1)}%` : 'N/A',
        replyRate: c.delivered > 0 ? `${((c.replies / c.delivered) * 100).toFixed(1)}%` : 'N/A',
        message: c.message,
        createdAt: safeDate(c.createdAt),
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-campaigns-${timestamp}.json"`,
        },
      })
    }
    case 'messages': {
      const where = since ? { timestamp: { gte: since } } : {}
      const conversations = await db.conversation.findMany({ where, orderBy: { timestamp: 'desc' } })
      const data = conversations.map(c => ({
        timestamp: safeDate(c.timestamp),
        contact: c.contactName,
        contactId: c.contactId,
        direction: c.direction,
        content: c.content,
      }))
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-messages-${timestamp}.json"`,
        },
      })
    }
    case 'analytics': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where })
      const contactsCount = await db.contact.count(since ? { where: { dateAdded: { gte: since } } } : {})
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
      const data = {
        generatedAt: new Date().toISOString(),
        dateRange: since ? `From ${since.toISOString()}` : 'All time',
        summary: {
          totalContacts: contactsCount,
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
          replyRate: c.delivered > 0 ? `${((c.replies / c.delivered) * 100).toFixed(1)}%` : 'N/A',
        })),
      }
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="eaje-analytics-${timestamp}.json"`,
        },
      })
    }
    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }
}

async function handleCsvExport(type: ExportType, since: Date | null) {
  const timestamp = new Date().toISOString().slice(0, 10)

  switch (type) {
    case 'contacts': {
      const where = since ? { dateAdded: { gte: since } } : {}
      const contacts = await db.contact.findMany({ where, orderBy: { createdAt: 'desc' } })
      const header = 'Name,Phone,Email,Company,Location,Tags,Status,Score,LastMessage,DateAdded'
      const rows = contacts.map(c =>
        `"${safeStr(c.name)}","${safeStr(c.phone)}","${safeStr(c.email)}","${safeStr(c.company)}","${safeStr(c.location)}","${safeStr(c.tags)}","${safeStr(c.status)}",${c.score},"${safeStr(c.lastMessage)}","${safeDate(c.dateAdded)}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-contacts-${timestamp}.csv"`,
        },
      })
    }
    case 'campaigns': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where, orderBy: { createdAt: 'desc' } })
      const header = 'Campaign Name,Status,Total,Sent,Delivered,Replies,Delivery Rate,Reply Rate,Message,Created At'
      const rows = campaigns.map(c =>
        `"${safeStr(c.name)}","${safeStr(c.status)}",${c.total},${c.sent},${c.delivered},${c.replies},"${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) + '%' : 'N/A'}","${c.delivered > 0 ? ((c.replies / c.delivered) * 100).toFixed(1) + '%' : 'N/A'}","${safeStr(c.message)}","${safeDate(c.createdAt)}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-campaigns-${timestamp}.csv"`,
        },
      })
    }
    case 'messages': {
      const where = since ? { timestamp: { gte: since } } : {}
      const conversations = await db.conversation.findMany({ where, orderBy: { timestamp: 'desc' } })
      const header = 'Timestamp,Contact,Contact ID,Direction,Content'
      const rows = conversations.map(c =>
        `"${safeDate(c.timestamp)}","${safeStr(c.contactName)}","${safeStr(c.contactId)}","${safeStr(c.direction)}","${safeStr(c.content)}"`
      )
      const csv = [header, ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-messages-${timestamp}.csv"`,
        },
      })
    }
    case 'analytics': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where })
      const contactsCount = await db.contact.count(since ? { where: { dateAdded: { gte: since } } } : {})
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

      let csv = `EAJE WhatsBot Analytics Report\n`
      csv += `Generated,${new Date().toISOString()}\n`
      csv += `Date Range,${since ? since.toISOString() : 'All time'}\n\n`
      csv += `SUMMARY STATISTICS\n`
      csv += `Total Contacts,${contactsCount}\n`
      csv += `Total Campaigns,${campaigns.length}\n`
      csv += `Total Sent,${totalSent}\n`
      csv += `Total Delivered,${totalDelivered}\n`
      csv += `Total Replies,${totalReplies}\n`
      csv += `Delivery Rate,${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) + '%' : '0%'}\n`
      csv += `Reply Rate,${totalDelivered > 0 ? ((totalReplies / totalDelivered) * 100).toFixed(1) + '%' : '0%'}\n\n`
      csv += `CAMPAIGN BREAKDOWN\n`
      csv += `Campaign Name,Status,Sent,Delivered,Replies,Delivery Rate,Reply Rate\n`
      campaigns.forEach(c => {
        csv += `"${safeStr(c.name)}","${safeStr(c.status)}",${c.sent},${c.delivered},${c.replies},"${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) + '%' : 'N/A'}","${c.delivered > 0 ? ((c.replies / c.delivered) * 100).toFixed(1) + '%' : 'N/A'}"\n`
      })
      csv += `\nTOTALS,,${totalSent},${totalDelivered},${totalReplies},"${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) + '%' : '0%'}","${totalDelivered > 0 ? ((totalReplies / totalDelivered) * 100).toFixed(1) + '%' : '0%'}"\n`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="eaje-analytics-${timestamp}.csv"`,
        },
      })
    }
    default:
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
  }
}

async function handleVcardExport(type: ExportType, since: Date | null) {
  if (type !== 'contacts') {
    return NextResponse.json({ error: 'vCard format is only available for contacts' }, { status: 400 })
  }

  const where = since ? { dateAdded: { gte: since } } : {}
  const contacts = await db.contact.findMany({ where, orderBy: { createdAt: 'desc' } })

  const vcardContent = contacts.map(c => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.name}`,
    ]
    if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`)
    if (c.email) lines.push(`EMAIL;TYPE=WORK:${c.email}`)
    if (c.company) lines.push(`ORG:${c.company}`)
    if (c.location) lines.push(`ADR;TYPE=WORK:;;${c.location};;;;`)
    if (c.tags) lines.push(`CATEGORIES:${c.tags}`)
    lines.push(`NOTE:Status: ${c.status}\\nScore: ${c.score}\\nAdded: ${safeDate(c.dateAdded)}`)
    lines.push('END:VCARD')
    return lines.join('\n')
  }).join('\n')

  return new NextResponse(vcardContent, {
    headers: {
      'Content-Type': 'text/vcard',
      'Content-Disposition': `attachment; filename="eaje-contacts-${new Date().toISOString().slice(0, 10)}.vcf"`,
    },
  })
}

async function handlePdfExport(type: ExportType, since: Date | null) {
  // PDF generation: Return a structured text report (CSV-like) since we can't generate real PDFs server-side
  // The frontend will download it as a .txt file with proper formatting
  const timestamp = new Date().toISOString().slice(0, 10)
  const dateRangeLabel = since ? `From ${since.toISOString().slice(0, 10)}` : 'All time'

  switch (type) {
    case 'campaigns': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where, orderBy: { createdAt: 'desc' } })
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

      let report = `╔══════════════════════════════════════════════╗\n`
      report += `║      EAJE WhatsBot - Campaigns Report       ║\n`
      report += `╚══════════════════════════════════════════════╝\n\n`
      report += `Generated: ${new Date().toLocaleString()}\n`
      report += `Date Range: ${dateRangeLabel}\n`
      report += `Total Campaigns: ${campaigns.length}\n\n`
      report += `── Summary ──────────────────────────────────\n`
      report += `Total Sent:      ${totalSent}\n`
      report += `Total Delivered: ${totalDelivered}\n`
      report += `Total Replies:   ${totalReplies}\n`
      report += `Delivery Rate:   ${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'}%\n`
      report += `Reply Rate:      ${totalDelivered > 0 ? ((totalReplies / totalDelivered) * 100).toFixed(1) : '0'}%\n\n`
      report += `── Campaign Details ─────────────────────────\n\n`

      campaigns.forEach((c, i) => {
        report += `${i + 1}. ${c.name}\n`
        report += `   Status: ${c.status}  |  Total: ${c.total}  |  Sent: ${c.sent}\n`
        report += `   Delivered: ${c.delivered}  |  Replies: ${c.replies}\n`
        report += `   Delivery Rate: ${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) : '0'}%\n`
        if (c.message) report += `   Message: "${c.message.substring(0, 80)}${c.message.length > 80 ? '...' : ''}"\n`
        report += `   Created: ${safeDate(c.createdAt)}\n\n`
      })

      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="eaje-campaigns-${timestamp}.txt"`,
        },
      })
    }
    case 'analytics': {
      const where = since ? { createdAt: { gte: since } } : {}
      const campaigns = await db.campaign.findMany({ where })
      const contactsCount = await db.contact.count(since ? { where: { dateAdded: { gte: since } } } : {})
      const conversationsCount = await db.conversation.count(since ? { where: { timestamp: { gte: since } } } : {})
      const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
      const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
      const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

      let report = `╔══════════════════════════════════════════════╗\n`
      report += `║      EAJE WhatsBot - Analytics Report       ║\n`
      report += `╚══════════════════════════════════════════════╝\n\n`
      report += `Generated: ${new Date().toLocaleString()}\n`
      report += `Date Range: ${dateRangeLabel}\n\n`
      report += `── Overview ─────────────────────────────────\n`
      report += `Total Contacts:    ${contactsCount}\n`
      report += `Total Campaigns:   ${campaigns.length}\n`
      report += `Total Messages:    ${conversationsCount}\n\n`
      report += `── Delivery Performance ──────────────────────\n`
      report += `Messages Sent:     ${totalSent}\n`
      report += `Messages Delivered:${totalDelivered}\n`
      report += `Replies Received:  ${totalReplies}\n`
      report += `Delivery Rate:     ${totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'}%\n`
      report += `Reply Rate:        ${totalDelivered > 0 ? ((totalReplies / totalDelivered) * 100).toFixed(1) : '0'}%\n\n`

      // Campaign breakdown
      report += `── Per-Campaign Breakdown ────────────────────\n\n`
      campaigns.forEach((c, i) => {
        report += `${i + 1}. ${c.name} (${c.status})\n`
        report += `   Sent: ${c.sent} | Delivered: ${c.delivered} | Replies: ${c.replies}\n`
        report += `   Delivery Rate: ${c.sent > 0 ? ((c.delivered / c.sent) * 100).toFixed(1) : '0'}%\n`
        report += `   Reply Rate: ${c.delivered > 0 ? ((c.replies / c.delivered) * 100).toFixed(1) : '0'}%\n\n`
      })

      // Status breakdown
      const byStatus: Record<string, number> = {}
      campaigns.forEach(c => {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1
      })
      report += `── Campaign Status Breakdown ─────────────────\n`
      Object.entries(byStatus).forEach(([status, count]) => {
        report += `${status}: ${count}\n`
      })

      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="eaje-analytics-${timestamp}.txt"`,
        },
      })
    }
    default:
      return NextResponse.json({ error: `PDF format is not available for ${type}` }, { status: 400 })
  }
}

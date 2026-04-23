import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export async function GET() {
  try {
    // Get all contacts
    const contacts = await db.contact.findMany()
    const totalContacts = contacts.length
    const activeContacts = contacts.filter(c => c.status === 'active').length

    // New contacts this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newThisWeek = contacts.filter(c => new Date(c.dateAdded) >= oneWeekAgo).length

    // Get all campaigns
    const campaigns = await db.campaign.findMany()
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'sending').length

    // Aggregate message stats from campaigns
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

    // Compute rates
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0
    const replyRate = totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 1000) / 10 : 0

    // Weekly activity - last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      // Count conversations for this day
      const dayConversations = await db.conversation.findMany({
        where: {
          timestamp: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      weeklyActivity.push({
        day: dayNames[day.getDay()],
        messages: dayConversations.length,
      })
    }

    // Recent activity - combine campaigns and conversations, last 10
    const recentCampaignActivity = campaigns
      .filter(c => c.sent > 0 || c.status === 'active' || c.status === 'sending')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(c => ({
        type: 'campaign' as const,
        description: `Campaign "${c.name}" - ${c.status} (${c.sent} sent)`,
        timestamp: c.updatedAt.toISOString(),
        timeAgo: formatTimeAgo(new Date(c.updatedAt)),
      }))

    const recentConversations = await db.conversation.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
    })

    const recentMessageActivity = recentConversations.map(c => ({
      type: 'message' as const,
      description: `${c.direction === 'outgoing' ? 'Sent to' : 'Message from'} ${c.contactName || 'Unknown'}`,
      timestamp: c.timestamp.toISOString(),
      timeAgo: formatTimeAgo(new Date(c.timestamp)),
    }))

    const recentActivity = [...recentCampaignActivity, ...recentMessageActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      totalContacts,
      activeContacts,
      newThisWeek,
      totalCampaigns,
      activeCampaigns,
      totalSent,
      totalDelivered,
      totalReplies,
      deliveryRate,
      replyRate,
      weeklyActivity,
      recentActivity,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

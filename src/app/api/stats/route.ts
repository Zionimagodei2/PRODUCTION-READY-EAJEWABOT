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

function computeTrend(current: number, previous: number): { direction: 'up' | 'down' | 'neutral'; percentage: number } {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'neutral', percentage: 0 }
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct > 0) return { direction: 'up', percentage: pct }
  if (pct < 0) return { direction: 'down', percentage: Math.abs(pct) }
  return { direction: 'neutral', percentage: 0 }
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

    // Two weeks ago for trend comparison
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const newLastWeek = contacts.filter(c => {
      const d = new Date(c.dateAdded)
      return d >= twoWeeksAgo && d < oneWeekAgo
    }).length

    // Get all campaigns
    const campaigns = await db.campaign.findMany()
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'sending').length

    // Aggregate message stats from campaigns
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

    // Week-over-week: campaigns created this week vs last week
    const campaignsThisWeek = campaigns.filter(c => new Date(c.createdAt) >= oneWeekAgo).length
    const campaignsLastWeek = campaigns.filter(c => {
      const d = new Date(c.createdAt)
      return d >= twoWeeksAgo && d < oneWeekAgo
    }).length

    // Compute rates
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0
    const replyRate = totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 1000) / 10 : 0

    // Weekly activity - last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = []
    const prevWeekActivity = []
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

      // Previous week same day
      const prevDay = new Date(day)
      prevDay.setDate(prevDay.getDate() - 7)
      const prevDayStart = new Date(prevDay)
      prevDayStart.setHours(0, 0, 0, 0)
      const prevDayEnd = new Date(prevDay)
      prevDayEnd.setHours(23, 59, 59, 999)

      const prevDayConversations = await db.conversation.findMany({
        where: {
          timestamp: {
            gte: prevDayStart,
            lte: prevDayEnd,
          },
        },
      })

      prevWeekActivity.push({
        day: dayNames[prevDay.getDay()],
        messages: prevDayConversations.length,
      })
    }

    // Compute weekly activity trend
    const thisWeekTotal = weeklyActivity.reduce((s, d) => s + d.messages, 0)
    const prevWeekTotal = prevWeekActivity.reduce((s, d) => s + d.messages, 0)
    const weeklyTrend = computeTrend(thisWeekTotal, prevWeekTotal)

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

    // Compute trends for stat cards
    const sentTrend = computeTrend(campaignsThisWeek, campaignsLastWeek)
    const deliveredTrend = computeTrend(
      campaigns.filter(c => new Date(c.createdAt) >= oneWeekAgo).reduce((s, c) => s + c.delivered, 0),
      campaigns.filter(c => { const d = new Date(c.createdAt); return d >= twoWeeksAgo && d < oneWeekAgo }).reduce((s, c) => s + c.delivered, 0)
    )
    const repliesTrend = computeTrend(
      campaigns.filter(c => new Date(c.createdAt) >= oneWeekAgo).reduce((s, c) => s + c.replies, 0),
      campaigns.filter(c => { const d = new Date(c.createdAt); return d >= twoWeeksAgo && d < oneWeekAgo }).reduce((s, c) => s + c.replies, 0)
    )

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
      prevWeekActivity,
      weeklyTrend,
      recentActivity,
      sentTrend,
      deliveredTrend,
      repliesTrend,
      campaignsThisWeek,
      campaignsLastWeek,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

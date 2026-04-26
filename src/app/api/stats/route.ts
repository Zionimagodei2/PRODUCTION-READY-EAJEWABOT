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

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
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

function getStartDate(period: string, customStart?: string, customEnd?: string): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      now.setDate(now.getDate() - 7)
      return now
    case '30d':
      now.setDate(now.getDate() - 30)
      return now
    case '90d':
      now.setDate(now.getDate() - 90)
      return now
    case 'custom':
      return customStart ? new Date(customStart) : new Date(now.getFullYear(), 0, 1)
    case 'all':
    default:
      return new Date(2020, 0, 1) // Far enough back
  }
}

function getEndDate(customEnd?: string): Date {
  if (customEnd) {
    const d = new Date(customEnd)
    d.setHours(23, 59, 59, 999)
    return d
  }
  return new Date()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    const customStart = searchParams.get('start') || undefined
    const customEnd = searchParams.get('end') || undefined

    const startDate = getStartDate(period, customStart, customEnd)
    const endDate = getEndDate(customEnd)

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

    // Get campaigns within the date range
    const allCampaigns = await db.campaign.findMany()
    const campaigns = allCampaigns.filter(c => {
      const d = new Date(c.createdAt)
      return d >= startDate && d <= endDate
    })
    const totalCampaigns = allCampaigns.length
    const activeCampaigns = allCampaigns.filter(c => c.status === 'active' || c.status === 'sending').length

    // Aggregate message stats from campaigns
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)

    // Previous period for trend comparison
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 7
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - periodDays)
    const prevCampaigns = allCampaigns.filter(c => {
      const d = new Date(c.createdAt)
      return d >= prevStartDate && d < startDate
    })
    const prevSent = prevCampaigns.reduce((sum, c) => sum + c.sent, 0)
    const prevDelivered = prevCampaigns.reduce((sum, c) => sum + c.delivered, 0)
    const prevReplies = prevCampaigns.reduce((sum, c) => sum + c.replies, 0)

    // Week-over-week: campaigns created this week vs last week
    const campaignsThisWeek = allCampaigns.filter(c => new Date(c.createdAt) >= oneWeekAgo).length
    const campaignsLastWeek = allCampaigns.filter(c => {
      const d = new Date(c.createdAt)
      return d >= twoWeeksAgo && d < oneWeekAgo
    }).length

    // Compute rates
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0
    const replyRate = totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 1000) / 10 : 0

    // Determine number of days to show in daily activity based on period
    const daysToShow = period === '7d' ? 7 : period === '30d' ? 14 : period === '90d' ? 12 : 7

    // Weekly activity - last N days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = []
    const prevWeekActivity = []
    for (let i = daysToShow - 1; i >= 0; i--) {
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
    const recentCampaignActivity = allCampaigns
      .filter(c => c.sent > 0 || c.status === 'active' || c.status === 'sending')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(c => ({
        id: `campaign-${c.id}`,
        type: 'campaign' as const,
        text: `Campaign "${c.name}" - ${c.status} (${c.sent} sent)`,
        time: formatTimeAgo(new Date(c.updatedAt)),
        color: c.status === 'active' ? '#22c55e' : c.status === 'completed' ? '#8b5cf6' : '#3b82f6',
        timestamp: c.updatedAt.toISOString(),
      }))

    const recentConversations = await db.conversation.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
    })

    const recentMessageActivity = recentConversations.map(c => ({
      id: `message-${c.id}`,
      type: 'message' as const,
      text: `${c.direction === 'outgoing' ? 'Sent to' : 'Message from'} ${c.contactName || 'Unknown'}`,
      time: formatTimeAgo(new Date(c.timestamp)),
      color: c.direction === 'outgoing' ? '#3b82f6' : '#22c55e',
      timestamp: c.timestamp.toISOString(),
    }))

    const recentActivity = [...recentCampaignActivity, ...recentMessageActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // Hourly activity distribution - count conversations per hour across all data
    const allConversations = await db.conversation.findMany()
    const hourlyActivity: { hour: number; count: number; label: string }[] = []
    const hourLabels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm']
    for (let h = 0; h < 24; h++) {
      const count = allConversations.filter(c => new Date(c.timestamp).getHours() === h).length
      hourlyActivity.push({ hour: h, count, label: hourLabels[h] })
    }

    // Find peak hour
    const peakHourData = hourlyActivity.reduce((peak, h) => h.count > peak.count ? h : peak, hourlyActivity[0])
    const peakHour = peakHourData.count > 0
      ? { hour: peakHourData.hour, label: peakHourData.label, count: peakHourData.count, formatted: formatHour(peakHourData.hour) }
      : null

    // Compute trends for stat cards using period comparison
    const sentTrend = computeTrend(totalSent, prevSent)
    const deliveredTrend = computeTrend(totalDelivered, prevDelivered)
    const repliesTrend = computeTrend(totalReplies, prevReplies)

    // Compute Quick Insight
    const quickInsights: string[] = []

    if (weeklyTrend.direction === 'up' && weeklyTrend.percentage > 0) {
      quickInsights.push(`You sent ${weeklyTrend.percentage}% more messages this week`)
    } else if (weeklyTrend.direction === 'down' && weeklyTrend.percentage > 0) {
      quickInsights.push(`Message activity dropped ${weeklyTrend.percentage}% this week`)
    }

    if (totalSent > 0 && deliveryRate > 95) {
      quickInsights.push(`Delivery rate is excellent at ${deliveryRate}%`)
    } else if (totalSent > 0 && deliveryRate < 80) {
      quickInsights.push(`Delivery rate needs attention (${deliveryRate}%)`)
    }

    if (replyRate > 20) {
      quickInsights.push(`Reply rate is strong at ${replyRate}%`)
    }

    // Contacts that haven't received a reply in 7+ days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const inactiveContacts = contacts.filter(c => {
      if (c.status !== 'active') return false
      const lastMsg = c.lastMessage ? new Date(c.lastMessage) : null
      if (!lastMsg) return true
      return lastMsg < sevenDaysAgo
    }).length

    if (inactiveContacts > 0) {
      quickInsights.push(`${inactiveContacts} contact${inactiveContacts > 1 ? 's haven\'t' : ' hasn\'t'} replied in 7 days`)
    }

    if (newThisWeek > 0) {
      quickInsights.push(`${newThisWeek} new contact${newThisWeek > 1 ? 's' : ''} added this week`)
    }

    if (activeCampaigns > 0) {
      quickInsights.push(`${activeCampaigns} active campaign${activeCampaigns > 1 ? 's' : ''} running`)
    }

    const quickInsight = quickInsights.length > 0 ? quickInsights[0] : 'Start by connecting WhatsApp and adding contacts'

    // What's New
    const whatsNew = [
      { title: 'AI Twin', description: 'Auto-reply in your style', badge: 'NEW' },
      { title: 'Campaign Wizard', description: 'Step-by-step campaign builder', badge: 'NEW' },
      { title: 'Flow Builder', description: 'Design conversation flows', badge: 'NEW' },
      { title: 'Number Validator', description: 'Verify WhatsApp numbers', badge: 'NEW' },
    ]

    const isReturningUser = totalContacts > 0 || totalCampaigns > 0

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
      hourlyActivity,
      peakHour,
      quickInsight,
      whatsNew,
      isReturningUser,
      inactiveContacts,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

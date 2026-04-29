import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { db } from '@/lib/db'
import { getRequestId } from '@/lib/request-id'

type AntiBanConfig = {
  dailyLimit: number
  hourlyLimit: number
  delayBetween: number
  randomDelay: boolean
  maxPerContact: number
  messageVariation: boolean
  typingSimulation: boolean
  onlinePattern: boolean
  profileSimulation: boolean
  groupThrottle: boolean
  activeDays: number[]
  morningWindow: [number, number]
  afternoonWindow: [number, number]
  eveningWindow: [number, number]
  timezone: string
}

const defaultConfig: AntiBanConfig = {
  dailyLimit: 200,
  hourlyLimit: 25,
  delayBetween: 15,
  randomDelay: true,
  maxPerContact: 5,
  messageVariation: true,
  typingSimulation: true,
  onlinePattern: false,
  profileSimulation: false,
  groupThrottle: true,
  activeDays: [0, 1, 2, 3, 4],
  morningWindow: [8, 12],
  afternoonWindow: [13, 17],
  eveningWindow: [18, 21],
  timezone: 'UTC-5 (EST)',
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

function normalizeConfig(input: unknown): AntiBanConfig {
  const cfg = (input || {}) as Partial<AntiBanConfig>
  return {
    ...defaultConfig,
    ...cfg,
    activeDays: Array.isArray(cfg.activeDays) ? cfg.activeDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : defaultConfig.activeDays,
    morningWindow: Array.isArray(cfg.morningWindow) && cfg.morningWindow.length === 2 ? [Number(cfg.morningWindow[0]), Number(cfg.morningWindow[1])] : defaultConfig.morningWindow,
    afternoonWindow: Array.isArray(cfg.afternoonWindow) && cfg.afternoonWindow.length === 2 ? [Number(cfg.afternoonWindow[0]), Number(cfg.afternoonWindow[1])] : defaultConfig.afternoonWindow,
    eveningWindow: Array.isArray(cfg.eveningWindow) && cfg.eveningWindow.length === 2 ? [Number(cfg.eveningWindow[0]), Number(cfg.eveningWindow[1])] : defaultConfig.eveningWindow,
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const row = await db.setting.findUnique({ where: { key: 'anti_ban_config' } })
    const storedConfig = row?.value ? normalizeConfig(JSON.parse(row.value)) : defaultConfig

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const hourStart = new Date(now)
    hourStart.setMinutes(0, 0, 0)

    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [messagesSentToday, messagesSentThisHour, recentOutgoing] = await Promise.all([
      db.conversation.count({ where: { direction: 'outgoing', timestamp: { gte: todayStart } } }),
      db.conversation.count({ where: { direction: 'outgoing', timestamp: { gte: hourStart } } }),
      db.conversation.findMany({
        where: { direction: 'outgoing', timestamp: { gte: dayAgo } },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true, content: true },
      }),
    ])

    const intervals: number[] = []
    let burstCount = 0
    const hourBuckets = new Set<number>()
    const contentFrequency = new Map<string, number>()

    for (let i = 0; i < recentOutgoing.length; i += 1) {
      const current = recentOutgoing[i]
      hourBuckets.add(new Date(current.timestamp).getHours())
      const normalizedContent = current.content.trim().toLowerCase()
      contentFrequency.set(normalizedContent, (contentFrequency.get(normalizedContent) || 0) + 1)

      if (i > 0) {
        const previous = recentOutgoing[i - 1]
        const diffSeconds = Math.max(0, (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000)
        intervals.push(diffSeconds)
        if (diffSeconds < 8) burstCount += 1
      }
    }

    const medianInterval = Math.round(percentile(intervals, 50))
    const p95Interval = Math.round(percentile(intervals, 95))
    const burstRatio = intervals.length > 0 ? Math.round((burstCount / intervals.length) * 1000) / 10 : 0
    const offHoursMessages = recentOutgoing.filter((m) => {
      const h = new Date(m.timestamp).getHours()
      return h < 7 || h > 22
    }).length
    const offHoursRatio = recentOutgoing.length > 0 ? Math.round((offHoursMessages / recentOutgoing.length) * 1000) / 10 : 0

    const duplicateMessages = Array.from(contentFrequency.values()).filter((count) => count > 1).reduce((sum, count) => sum + count, 0)
    const duplicateRatio = recentOutgoing.length > 0 ? Math.round((duplicateMessages / recentOutgoing.length) * 1000) / 10 : 0

    let humanBehaviorScore = 100
    if (medianInterval < 12) humanBehaviorScore -= 20
    if (burstRatio > 10) humanBehaviorScore -= 20
    if (offHoursRatio > 25) humanBehaviorScore -= 15
    if (duplicateRatio > 30) humanBehaviorScore -= 20
    if (hourBuckets.size < 4 && recentOutgoing.length > 30) humanBehaviorScore -= 10
    humanBehaviorScore = Math.max(5, humanBehaviorScore)

    const recommendations: string[] = []
    if (medianInterval < 12) recommendations.push('Increase minimum delay between messages to mimic natural typing cadence.')
    if (burstRatio > 10) recommendations.push('Reduce burst sending. Spread sends more evenly across active windows.')
    if (offHoursRatio > 25) recommendations.push('Avoid heavy sending at off-hours (11PM–6AM local time).')
    if (duplicateRatio > 30) recommendations.push('Increase message variation to reduce repeated-content patterns.')
    if (recommendations.length === 0) recommendations.push('Behavioral profile looks healthy. Keep current anti-ban controls active.')

    return ok({
      config: storedConfig,
      metrics: {
        messagesSentToday,
        messagesSentThisHour,
        behavior: {
          humanBehaviorScore,
          medianIntervalSeconds: medianInterval,
          p95IntervalSeconds: p95Interval,
          burstRatioPercent: burstRatio,
          offHoursRatioPercent: offHoursRatio,
          duplicateRatioPercent: duplicateRatio,
          activeHourSpread: hourBuckets.size,
          recommendations,
        },
      },
    }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to load anti-ban configuration', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    if (!body?.config || typeof body.config !== 'object') {
      throw new ApiError('config object is required', 400)
    }
    const normalized = normalizeConfig(body.config)

    await db.setting.upsert({
      where: { key: 'anti_ban_config' },
      update: { value: JSON.stringify(normalized) },
      create: { key: 'anti_ban_config', value: JSON.stringify(normalized) },
    })

    return ok({ success: true, config: normalized }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to save anti-ban configuration', requestId)
  }
}

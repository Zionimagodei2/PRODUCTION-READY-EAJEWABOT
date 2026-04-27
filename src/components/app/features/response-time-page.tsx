'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from '@/lib/framer-shim'
import {
  ArrowLeft, Timer, TrendingDown, TrendingUp, Zap,
  Lightbulb, Target, Loader2, Inbox
} from 'lucide-react'

interface ConversationMessage {
  id: string
  contactId: string
  contactName: string
  direction: string
  content: string
  timestamp: string
  createdAt: string
}

interface KpiStat {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color: string
  icon: React.ReactNode
}

interface DayResponse {
  day: string
  minutes: number
}

interface DistributionBucket {
  label: string
  percentage: number
  color: string
}

const tips = [
  { id: '1', title: 'Use Quick Replies', description: 'Set up template responses for common questions to cut response time by 40%' },
  { id: '2', title: 'Prioritize Conversations', description: 'Focus on unread messages first, then follow-ups, then new inquiries' },
  { id: '3', title: 'Set Auto-Acknowledgment', description: 'Let customers know you received their message with an instant auto-reply' },
]

function getBarColor(minutes: number): string {
  if (minutes < 2) return '#22c55e'
  if (minutes <= 5) return '#f59e0b'
  return '#ef4444'
}

function formatResponseTime(minutes: number): string {
  if (minutes === 0) return '0 min'
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`
  if (minutes < 60) return `${minutes.toFixed(1)} min`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function ResponseTimePage() {
  const { goBack } = useAppStore()
  const [targetMinutes, setTargetMinutes] = useState(5)
  const [conversations, setConversations] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/conversations')
        if (res.ok) {
          const responseData = await res.json()
          const conversations: ConversationMessage[] = responseData.conversations || []
          queueMicrotask(() => setConversations(conversations))
        } else {
          queueMicrotask(() => setError('Failed to load conversations'))
        }
      } catch {
        queueMicrotask(() => setError('Failed to load conversations'))
      } finally {
        queueMicrotask(() => setLoading(false))
      }
    }
    fetchConversations()
  }, [])

  // Derive response times from conversations
  // For each contact, find pairs where incoming message is followed by outgoing message
  const responseTimeData = useMemo(() => {
    if (conversations.length === 0) {
      return { responseTimes: [], avgMinutes: 0, fastestMinutes: 0, slowestMinutes: 0, weeklyData: [], distribution: [] }
    }

    // Group conversations by contact
    const byContact = new Map<string, ConversationMessage[]>()
    for (const msg of conversations) {
      const key = msg.contactId || msg.contactName || 'unknown'
      if (!byContact.has(key)) {
        byContact.set(key, [])
      }
      byContact.get(key)!.push(msg)
    }

    // For each contact, sort by timestamp and find response pairs
    const responseTimes: { minutes: number; timestamp: Date }[] = []

    for (const [, msgs] of byContact) {
      const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]
        const next = sorted[i + 1]

        // Response = incoming followed by outgoing (agent responding to customer)
        if (current.direction === 'incoming' && next.direction === 'outgoing') {
          const diffMs = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()
          const diffMinutes = diffMs / 60000

          // Only count reasonable response times (< 24 hours)
          if (diffMinutes > 0 && diffMinutes < 1440) {
            responseTimes.push({
              minutes: diffMinutes,
              timestamp: new Date(next.timestamp),
            })
          }
        }
      }
    }

    const avgMinutes = responseTimes.length > 0
      ? responseTimes.reduce((sum, r) => sum + r.minutes, 0) / responseTimes.length
      : 0
    const fastestMinutes = responseTimes.length > 0
      ? Math.min(...responseTimes.map(r => r.minutes))
      : 0
    const slowestMinutes = responseTimes.length > 0
      ? Math.max(...responseTimes.map(r => r.minutes))
      : 0

    // Weekly data - last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyData: DayResponse[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const dayResponses = responseTimes.filter(r => {
        const t = r.timestamp.getTime()
        return t >= dayStart.getTime() && t <= dayEnd.getTime()
      })

      const avgDay = dayResponses.length > 0
        ? dayResponses.reduce((sum, r) => sum + r.minutes, 0) / dayResponses.length
        : 0

      weeklyData.push({
        day: dayNames[day.getDay()],
        minutes: Math.round(avgDay * 10) / 10,
      })
    }

    // Distribution buckets
    const buckets = [
      { label: '<1 min', maxMinutes: 1, color: '#22c55e' },
      { label: '1-3 min', maxMinutes: 3, color: '#84cc16' },
      { label: '3-5 min', maxMinutes: 5, color: '#f59e0b' },
      { label: '5-10 min', maxMinutes: 10, color: '#f97316' },
      { label: '>10 min', maxMinutes: Infinity, color: '#ef4444' },
    ]

    const distribution: DistributionBucket[] = buckets.map((bucket, idx) => {
      let count: number
      if (idx === 0) {
        count = responseTimes.filter(r => r.minutes < bucket.maxMinutes).length
      } else if (idx === buckets.length - 1) {
        count = responseTimes.filter(r => r.minutes >= buckets[idx - 1].maxMinutes).length
      } else {
        count = responseTimes.filter(r => r.minutes >= buckets[idx - 1].maxMinutes && r.minutes < bucket.maxMinutes).length
      }
      return {
        label: bucket.label,
        percentage: responseTimes.length > 0 ? Math.round((count / responseTimes.length) * 100) : 0,
        color: bucket.color,
      }
    })

    return { responseTimes, avgMinutes, fastestMinutes, slowestMinutes, weeklyData, distribution }
  }, [conversations])

  const hasData = responseTimeData.responseTimes.length > 0
  const currentAvg = responseTimeData.avgMinutes
  const goalProgress = hasData ? Math.min(100, (targetMinutes / currentAvg) * 100) : 0
  const isGoalMet = hasData && currentAvg <= targetMinutes

  // KPI stats derived from real data
  const kpiStats: KpiStat[] = useMemo(() => [
    {
      label: 'Avg Response Time',
      value: hasData ? formatResponseTime(currentAvg) : 'N/A',
      trend: 'down' as const,
      trendValue: hasData ? `${responseTimeData.responseTimes.length} responses` : 'No data',
      color: '#8b5cf6',
      icon: <Timer className="w-4 h-4" />,
    },
    {
      label: 'Fastest Response',
      value: hasData ? formatResponseTime(responseTimeData.fastestMinutes) : 'N/A',
      trend: 'up' as const,
      trendValue: hasData ? 'Best' : 'No data',
      color: '#22c55e',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: 'Slowest Response',
      value: hasData ? formatResponseTime(responseTimeData.slowestMinutes) : 'N/A',
      trend: 'down' as const,
      trendValue: hasData ? 'Worst' : 'No data',
      color: '#ef4444',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ], [hasData, currentAvg, responseTimeData])

  // Ring progress calculation
  const ringSize = 80
  const ringStroke = 6
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringDashoffset = ringCircumference - (Math.min(goalProgress, 100) / 100) * ringCircumference

  // Loading state
  if (loading) {
    return (
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-extrabold text-white/95">Response Time</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={goBack}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </motion.button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-extrabold text-white/95">Response Time</h2>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center">
          <Inbox className="w-10 h-10 mx-auto text-white/10 mb-3" />
          <p className="text-sm text-white/40 font-medium">Failed to load data</p>
          <p className="text-xs text-white/20 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Response Time</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Track your response performance</p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {kpiStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-3 text-center card-hover-lift"
            style={{ borderLeft: `2px solid ${stat.color}` }}
          >
            <div
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-2"
              style={{
                backgroundColor: `${stat.color}12`,
                border: `1px solid ${stat.color}20`,
                boxShadow: `0 0 12px ${stat.color}10`,
              }}
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
            </div>
            <p className="text-lg font-extrabold text-white/95">{stat.value}</p>
            <p className="text-[9px] text-white/40 font-semibold mt-0.5">{stat.label}</p>
            <p className={`text-[9px] font-bold mt-1 flex items-center justify-center gap-0.5 ${
              stat.trend === 'down' ? 'text-emerald-400' : stat.trend === 'up' ? 'text-emerald-400' : 'text-white/30'
            }`}>
              {stat.trendValue}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Response Time Chart - Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Daily Response Times</span>
        </div>
        {hasData ? (
          <>
            <div className="flex items-end gap-2 h-28">
              {responseTimeData.weeklyData.map((day, i) => {
                const maxMinutes = 8
                const heightPercent = day.minutes > 0 ? Math.min(100, (day.minutes / maxMinutes) * 100) : 2
                const barColor = day.minutes > 0 ? getBarColor(day.minutes) : 'rgba(255,255,255,0.06)'
                return (
                  <motion.div
                    key={day.day}
                    className="flex-1 flex flex-col items-center gap-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <span className="text-[8px] font-mono text-white/30">
                      {day.minutes > 0 ? `${day.minutes}m` : '—'}
                    </span>
                    <div className="w-full relative group">
                      <motion.div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${heightPercent}%`,
                          background: day.minutes > 0
                            ? `linear-gradient(to top, ${barColor}30, ${barColor}90)`
                            : 'rgba(255,255,255,0.04)',
                          boxShadow: day.minutes > 0 ? `0 0 8px ${barColor}20` : 'none',
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                        whileHover={day.minutes > 0 ? { filter: 'brightness(1.3)' } : undefined}
                      />
                    </div>
                    <span className="text-[9px] text-white/35 font-medium">{day.day}</span>
                  </motion.div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
                <span className="text-[8px] text-white/30">&lt;2 min</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                <span className="text-[8px] text-white/30">2-5 min</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                <span className="text-[8px] text-white/30">&gt;5 min</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-[11px] text-white/30">No response time data yet</p>
            <p className="text-[10px] text-white/20 mt-0.5">Data will appear as conversations occur</p>
          </div>
        )}
      </motion.div>

      {/* Response Time Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Response Distribution</span>
        </div>
        {hasData ? (
          <div className="space-y-3">
            {responseTimeData.distribution.map((bucket, i) => (
              <motion.div
                key={bucket.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-white/55 font-medium">{bucket.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: bucket.color }}>{bucket.percentage}%</span>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${bucket.color}60, ${bucket.color})`,
                      boxShadow: `0 0 6px ${bucket.color}30`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${bucket.percentage}%` }}
                    transition={{ delay: 0.45 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-[11px] text-white/30">No distribution data</p>
            <p className="text-[10px] text-white/20 mt-0.5">Response distribution will appear with more conversations</p>
          </div>
        )}
      </motion.div>

      {/* Response Goals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Response Goals</span>
        </div>

        <div className="flex items-center gap-5">
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg width={ringSize} height={ringSize}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                strokeWidth={ringStroke}
                fill="none"
                stroke="rgba(255,255,255,0.04)"
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                strokeWidth={ringStroke}
                fill="none"
                stroke={hasData ? (isGoalMet ? '#22c55e' : '#8b5cf6') : 'rgba(255,255,255,0.08)'}
                strokeDasharray={ringCircumference}
                strokeDashoffset={hasData ? ringDashoffset : ringCircumference}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{
                  filter: hasData ? `drop-shadow(0 0 6px ${isGoalMet ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.4)'})` : 'none',
                  transition: 'stroke-dashoffset 0.5s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-white/90">
                {hasData ? currentAvg.toFixed(1) : '—'}
              </span>
              <span className="text-[7px] text-white/30 font-medium">min avg</span>
            </div>
          </div>

          {/* Goal details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-white/50 font-medium">Target:</span>
              <span className="text-sm font-bold text-purple-400">{targetMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] text-white/50 font-medium">Status:</span>
              <span className={`text-[11px] font-bold ${!hasData ? 'text-white/30' : isGoalMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                {!hasData ? 'No data' : isGoalMet ? '✓ Goal Met' : '⚡ Improving'}
              </span>
            </div>
            <div>
              <label className="text-[9px] text-white/30 uppercase tracking-wider font-semibold block mb-1">
                Set Target (1-30 min)
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #8b5cf6 ${((targetMinutes - 1) / 29) * 100}%, rgba(255,255,255,0.06) ${((targetMinutes - 1) / 29) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-white/20">1 min</span>
                <span className="text-[8px] text-white/20">30 min</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Tips to Improve</span>
        </div>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.06 }}
              className="flex items-start gap-3"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400/70" />
              </div>
              <div>
                <p className="text-[12px] text-white/80 font-semibold">{tip.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{tip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

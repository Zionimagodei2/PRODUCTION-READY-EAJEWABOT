'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Eye, Clock, ArrowUpRight, ArrowDownRight, ArrowLeft, Hash, Zap, Flame, Target, Activity, Loader2 } from 'lucide-react'

interface StatsData {
  totalContacts: number
  activeContacts: number
  newThisWeek: number
  totalCampaigns: number
  activeCampaigns: number
  totalSent: number
  totalDelivered: number
  totalReplies: number
  deliveryRate: number
  replyRate: number
  weeklyActivity: { day: string; messages: number }[]
  prevWeekActivity: { day: string; messages: number }[]
  weeklyTrend: { direction: string; percentage: number }
  recentActivity: { type: string; description: string; timestamp: string; timeAgo: string }[]
  sentTrend: { direction: string; percentage: number }
  deliveredTrend: { direction: string; percentage: number }
  repliesTrend: { direction: string; percentage: number }
  campaignsThisWeek: number
  campaignsLastWeek: number
  hourlyActivity: { hour: number; count: number; label: string }[]
  peakHour: { hour: number; label: string; count: number; formatted: string } | null
}

interface CampaignData {
  id: string
  name: string
  status: string
  total: number
  sent: number
  delivered: number
  replies: number
  message: string
  date: string
  createdAt: string
  updatedAt: string
}

function RingProgress({ size = 44, strokeWidth = 3.5, progress = 0, color = '#3b82f6' }: {
  size?: number; strokeWidth?: number; progress?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  return (
    <svg width={size} height={size} className="ring-progress">
      <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="rgba(255,255,255,0.06)" />
      <circle
        cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none"
        stroke={color} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 4px ${color}40)`, transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  )
}

export function AnalyticsPage() {
  const { goBack } = useAppStore()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, campaignsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/campaigns'),
        ])
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          queueMicrotask(() => setStats(statsData))
        }
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          queueMicrotask(() => setCampaigns(campaignsData))
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        queueMicrotask(() => setLoading(false))
      }
    }
    fetchData()
  }, [])

  // Derived data from stats
  const messagesSent = stats?.totalSent ?? 0
  const delivered = stats?.totalDelivered ?? 0
  const replied = stats?.totalReplies ?? 0
  const deliveryRate = stats?.deliveryRate ?? 0
  const replyRate = stats?.replyRate ?? 0

  // Daily stats from weeklyActivity
  const dailyStats = (stats?.weeklyActivity ?? []).map(d => ({
    day: d.day,
    sent: d.messages,
    delivered: Math.round(d.messages * (deliveryRate / 100 || 0.89)),
  }))

  // Hourly peaks - derive from real conversation data via API
  const hourlyPeaks = (stats?.hourlyActivity ?? []).map(h => ({
    hour: h.label,
    value: h.count,
  }))
  const maxHourly = hourlyPeaks.length > 0 ? Math.max(...hourlyPeaks.map(h => h.value), 1) : 1

  // Sparkline data derived from weeklyActivity - map each day's messages to percentage
  const weeklyMessages = (stats?.weeklyActivity ?? []).map(d => d.messages)
  const maxWeeklyMsg = weeklyMessages.length > 0 ? Math.max(...weeklyMessages, 1) : 1
  const sparklineFromWeekly = weeklyMessages.map(m => Math.round((m / maxWeeklyMsg) * 100))

  const maxSent = dailyStats.length > 0 ? Math.max(...dailyStats.map(d => d.sent), 1) : 1

  // Top campaigns from real data
  const topCampaigns = campaigns
    .filter(c => c.sent > 0)
    .sort((a, b) => {
      const rateA = a.sent > 0 ? (a.delivered / a.sent) * 100 : 0
      const rateB = b.sent > 0 ? (b.delivered / b.sent) * 100 : 0
      return rateB - rateA
    })
    .slice(0, 3)
    .map(c => ({
      name: c.name,
      rate: c.sent > 0 ? Math.round((c.delivered / c.sent) * 1000) / 10 : 0,
      trend: c.sent > 0 && (c.delivered / c.sent) > 0.8 ? 'up' : 'down',
      sent: c.sent,
      color: c.sent > 0 && (c.delivered / c.sent) > 0.85 ? '#22c55e' : c.sent > 0 && (c.delivered / c.sent) > 0.7 ? '#3b82f6' : '#ef4444',
    }))

  // Quick insights derived from real data
  const bestDay = dailyStats.length > 0
    ? dailyStats.reduce((best, d) => d.sent > best.sent ? d : best, dailyStats[0])
    : null
  const avgMsgDay = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((s, d) => s + d.sent, 0) / dailyStats.length)
    : 0

  if (loading) {
    return (
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-extrabold text-white/95">Analytics</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
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
            <BarChart3 className="w-5 h-5 text-pink-400" style={{ filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Analytics</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Track performance & metrics</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/15">
          <Activity className="w-3 h-3 text-pink-400 animate-pulse" />
          <span className="text-[9px] font-bold text-pink-400/80 uppercase">Live</span>
        </div>
      </div>

      {/* Period Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        {(['7d', '30d', '90d'] as const).map((p) => (
          <motion.button
            key={p}
            onClick={() => setPeriod(p)}
            whileTap={{ scale: 0.95 }}
            className={`py-2.5 rounded-xl text-[10px] font-semibold border transition-all duration-200 ${
              period === p ? 'bg-pink-500/15 text-pink-400 border-pink-500/30' : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
            style={period === p ? { boxShadow: '0 0 15px rgba(236,72,153,0.15)' } : undefined}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
          </motion.button>
        ))}
      </motion.div>

      {/* KPI Cards - Enhanced with mini sparklines derived from weekly activity */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <MessageSquare className="w-4 h-4" />, label: 'Messages Sent', value: messagesSent.toLocaleString(), trend: stats?.sentTrend, color: '#3b82f6', spark: sparklineFromWeekly },
          { icon: <Eye className="w-4 h-4" />, label: 'Delivered', value: delivered.toLocaleString(), trend: stats?.deliveredTrend, color: '#22c55e', spark: sparklineFromWeekly },
          { icon: <Users className="w-4 h-4" />, label: 'Replied', value: replied.toLocaleString(), trend: stats?.repliesTrend, color: '#f59e0b', spark: sparklineFromWeekly },
          { icon: <Clock className="w-4 h-4" />, label: 'Reply Rate', value: `${replyRate}%`, trend: null, color: '#8b5cf6', spark: sparklineFromWeekly },
        ].map((stat, i) => {
          const trendUp = stat.trend ? stat.trend.direction === 'up' : true
          const trendPct = stat.trend ? `${stat.trend.direction === 'down' ? '-' : '+'}${stat.trend.percentage}%` : (stat.value === '0' ? '0%' : '+0%')
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-4 card-hover-lift"
              style={{ borderLeft: `2px solid ${stat.color}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}20`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trendPct}
                </span>
              </div>
              <p className="text-xl font-extrabold text-white/95">{stat.value}</p>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">{stat.label}</p>
              {/* Mini sparkline */}
              <div className="flex items-end gap-[2px] h-4 mt-2">
                {stat.spark.map((h, si) => (
                  <div
                    key={si}
                    className="w-[3px] rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, ${stat.color}30, ${stat.color}70)`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Rate Cards - Enhanced with ring progress */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Delivery', value: deliveryRate, color: '#22c55e' },
          { label: 'Reply', value: replyRate, color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass-card rounded-2xl p-3 text-center card-hover-lift"
            style={{ borderTop: `2px solid ${stat.color}` }}
          >
            <div className="flex justify-center mb-1.5">
              <div className="relative flex items-center justify-center">
                <RingProgress size={40} strokeWidth={3} progress={stat.value} color={stat.color} />
                <span className="absolute text-[10px] font-extrabold" style={{ color: stat.color }}>{stat.value}%</span>
              </div>
            </div>
            <p className="text-[9px] text-white/40 font-semibold mt-0.5">{stat.label} Rate</p>
          </motion.div>
        ))}
      </div>

      <div className="gradient-divider" />

      {/* Delivery Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Delivery Funnel</span>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Sent', value: messagesSent, pct: messagesSent > 0 ? 100 : 0, color: '#3b82f6' },
            { label: 'Delivered', value: delivered, pct: messagesSent > 0 ? Math.round((delivered / messagesSent) * 1000) / 10 : 0, color: '#22c55e' },
            { label: 'Replied', value: replied, pct: messagesSent > 0 ? Math.round((replied / messagesSent) * 1000) / 10 : 0, color: '#f59e0b' },
          ].map((step, i) => (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color, boxShadow: `0 0 6px ${step.color}60` }} />
                  <span className="text-[11px] text-white/60 font-medium">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white/85">{step.value.toLocaleString()}</span>
                  <span className="text-[9px] text-white/30">{step.pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${step.color}50, ${step.color})`,
                    boxShadow: `0 0 6px ${step.color}30`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${step.pct}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily Activity Chart - Enhanced with dual bars */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Daily Activity</span>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        {dailyStats.length > 0 ? (
          <div className="flex items-end gap-1.5 h-32">
            {dailyStats.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-[2px]" style={{ height: '100px' }}>
                  <div className="flex-1 flex flex-col justify-end relative group cursor-pointer">
                    {/* Sent bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.sent / maxSent) * 85}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                      className="w-full rounded-t-md"
                      style={{
                        background: `linear-gradient(to top, rgba(236,72,153,0.25), rgba(236,72,153,0.6))`,
                      }}
                      whileHover={{ filter: 'brightness(1.3)' }}
                    />
                    {/* Delivered bar (overlaid) */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.delivered / maxSent) * 85}%` }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.05 }}
                      className="w-full rounded-t-md absolute bottom-0"
                      style={{
                        background: `linear-gradient(to top, rgba(59,130,246,0.2), rgba(59,130,246,0.5))`,
                        boxShadow: '0 0 6px rgba(59,130,246,0.1)',
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-white/10 text-[7px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {day.sent} sent / {day.delivered} delivered
                    </div>
                  </div>
                </div>
                <span className="text-[8px] text-white/25 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-white/30 text-xs">
            No activity data yet
          </div>
        )}
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-[8px] text-white/30">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(236,72,153,0.6)' }} /> Sent
          </span>
          <span className="flex items-center gap-1 text-[8px] text-white/30">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(59,130,246,0.5)' }} /> Delivered
          </span>
        </div>
      </motion.div>

      {/* Peak Hours Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-amber-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Peak Hours</span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
        {messagesSent > 0 && hourlyPeaks.some(h => h.value > 0) ? (
          <div className="flex items-end gap-[2px] h-16 overflow-x-auto no-scrollbar">
            {hourlyPeaks.filter(h => h.value > 0).map((hour, i) => (
              <motion.div
                key={hour.hour}
                className="flex-1 min-w-[12px] flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.02 }}
              >
                <div className="w-full relative group cursor-pointer" style={{ height: '48px' }}>
                  <motion.div
                    className="w-full rounded-t-sm absolute bottom-0"
                    style={{
                      height: `${maxHourly > 0 ? (hour.value / maxHourly) * 100 : 0}%`,
                      background: (hour.value / maxHourly) > 0.8
                        ? 'linear-gradient(to top, rgba(239,68,68,0.3), rgba(239,68,68,0.7))'
                        : (hour.value / maxHourly) > 0.5
                          ? 'linear-gradient(to top, rgba(245,158,11,0.3), rgba(245,158,11,0.6))'
                          : 'linear-gradient(to top, rgba(34,197,94,0.2), rgba(34,197,94,0.4))',
                      boxShadow: (hour.value / maxHourly) > 0.8 ? '0 0 8px rgba(239,68,68,0.15)' : 'none',
                    }}
                    whileHover={{ filter: 'brightness(1.3)' }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-white/10 text-[7px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {hour.value} messages
                  </div>
                </div>
                <span className="text-[7px] text-white/20 font-medium">{hour.hour}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 text-white/30 text-xs">
            No message data yet
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-[7px] text-white/25">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(34,197,94,0.4)' }} /> Low
          </span>
          <span className="flex items-center gap-1 text-[7px] text-white/25">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(245,158,11,0.6)' }} /> Medium
          </span>
          <span className="flex items-center gap-1 text-[7px] text-white/25">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(239,68,68,0.7)' }} /> High
          </span>
        </div>
      </motion.div>

      {/* Top Performing Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Top Campaigns</span>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        {topCampaigns.length > 0 ? (
          <div className="space-y-3">
            {topCampaigns.map((campaign, i) => (
              <motion.div
                key={campaign.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.06 }}
                className="flex items-center justify-between py-1.5 group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${campaign.color}12`, border: `1px solid ${campaign.color}20` }}
                  >
                    {campaign.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3" style={{ color: campaign.color }} />
                    ) : (
                      <TrendingDown className="w-3 h-3" style={{ color: campaign.color }} />
                    )}
                  </div>
                  <div>
                    <span className="text-[12px] text-white/70 font-medium">{campaign.name}</span>
                    <p className="text-[9px] text-white/25">{campaign.sent} messages sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${campaign.color}50, ${campaign.color})`,
                        boxShadow: `0 0 4px ${campaign.color}30`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.rate}%` }}
                      transition={{ delay: 0.7 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white/85 w-10 text-right">{campaign.rate}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-white/30 text-xs">
            No campaign data yet
          </div>
        )}
      </motion.div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Quick Insights</span>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Best Day', value: bestDay ? bestDay.day : 'N/A', sub: bestDay ? `${bestDay.sent} messages` : 'No data', icon: <Flame className="w-3 h-3" />, color: '#22c55e' },
            { label: 'Peak Hour', value: stats?.peakHour ? stats.peakHour.formatted : 'N/A', sub: stats?.peakHour ? `${stats.peakHour.count} messages` : 'No data', icon: <Clock className="w-3 h-3" />, color: '#ef4444' },
            { label: 'Avg Msg/Day', value: avgMsgDay.toString(), sub: 'This week', icon: <MessageSquare className="w-3 h-3" />, color: '#3b82f6' },
            { label: 'Growth', value: stats?.weeklyTrend ? `${stats.weeklyTrend.direction === 'up' ? '+' : '-'}${stats.weeklyTrend.percentage}%` : '0%', sub: 'vs last week', icon: <TrendingUp className="w-3 h-3" />, color: '#8b5cf6' },
          ].map((insight, i) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75 + i * 0.05 }}
              className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div style={{ color: insight.color }}>{insight.icon}</div>
                <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">{insight.label}</span>
              </div>
              <p className="text-sm font-extrabold text-white/90">{insight.value}</p>
              <p className="text-[9px] text-white/25 mt-0.5">{insight.sub}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

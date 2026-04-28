'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  BarChart3, TrendingUp, TrendingDown, Target, Users, Globe,
  Mail, Download, ArrowLeft, Calendar, Award, Zap, DollarSign,
  ChevronRight, Clock, Send, CheckCircle2, Reply, Trophy,
  Smartphone, Monitor, Tablet, FileSpreadsheet, FileText,
  FileDown, ToggleLeft, ToggleRight, Star, MessageSquare,
  Percent, Hash, Eye
} from 'lucide-react'

// ============================================================
// Mock Data
// ============================================================

const PERIODS = ['7d', '30d', '90d', 'All time'] as const
type Period = typeof PERIODS[number]

const dailyMessages: Record<Period, { day: string; sent: number; delivered: number }[]> = {
  '7d': [
    { day: 'Mon', sent: 1240, delivered: 1180 },
    { day: 'Tue', sent: 980, delivered: 920 },
    { day: 'Wed', sent: 1560, delivered: 1480 },
    { day: 'Thu', sent: 870, delivered: 810 },
    { day: 'Fri', sent: 2100, delivered: 1990 },
    { day: 'Sat', sent: 650, delivered: 620 },
    { day: 'Sun', sent: 420, delivered: 390 },
  ],
  '30d': [
    { day: 'W1', sent: 8540, delivered: 8120 },
    { day: 'W2', sent: 9200, delivered: 8780 },
    { day: 'W3', sent: 7650, delivered: 7200 },
    { day: 'W4', sent: 10200, delivered: 9850 },
  ],
  '90d': [
    { day: 'M1', sent: 32400, delivered: 30800 },
    { day: 'M2', sent: 35600, delivered: 33900 },
    { day: 'M3', sent: 38200, delivered: 36400 },
  ],
  'All time': [
    { day: 'Q1', sent: 98000, delivered: 93200 },
    { day: 'Q2', sent: 112000, delivered: 106800 },
    { day: 'Q3', sent: 105000, delivered: 99800 },
    { day: 'Q4', sent: 128000, delivered: 121600 },
  ],
}

const topCampaigns = [
  { id: 1, name: 'Black Friday Sale 2024', sent: 5200, delivery: 97.2, reply: 34.8, status: 'completed' as const, score: 96 },
  { id: 2, name: 'New Year Welcome Series', sent: 3800, delivery: 95.6, reply: 28.4, status: 'completed' as const, score: 91 },
  { id: 3, name: 'Product Launch - Pro Plan', sent: 4100, delivery: 93.1, reply: 22.6, status: 'completed' as const, score: 87 },
  { id: 4, name: 'Weekly Newsletter #42', sent: 2900, delivery: 91.4, reply: 18.2, status: 'active' as const, score: 78 },
  { id: 5, name: 'Re-engagement Campaign', sent: 1500, delivery: 88.7, reply: 15.3, status: 'active' as const, score: 72 },
]

const ageGroups = [
  { label: '18-24', value: 18, color: '#06b6d4' },
  { label: '25-34', value: 35, color: '#10b981' },
  { label: '35-44', value: 28, color: '#8b5cf6' },
  { label: '45-54', value: 13, color: '#f59e0b' },
  { label: '55+', value: 6, color: '#ef4444' },
]

const topCountries = [
  { label: 'Brazil', value: 42, color: '#10b981' },
  { label: 'India', value: 24, color: '#06b6d4' },
  { label: 'Indonesia', value: 14, color: '#8b5cf6' },
  { label: 'Mexico', value: 11, color: '#f59e0b' },
  { label: 'Nigeria', value: 9, color: '#f97316' },
]

const deviceTypes = [
  { label: 'Mobile', value: 72, color: '#10b981', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { label: 'Desktop', value: 19, color: '#06b6d4', icon: <Monitor className="w-3.5 h-3.5" /> },
  { label: 'Tablet', value: 9, color: '#8b5cf6', icon: <Tablet className="w-3.5 h-3.5" /> },
]

// Heatmap: 7 days x 4 time periods
const heatmapData = [
  // Morning, Afternoon, Evening, Night
  [35, 62, 88, 22], // Mon
  [42, 58, 91, 18], // Tue
  [38, 65, 85, 25], // Wed
  [31, 55, 78, 15], // Thu
  [48, 72, 95, 28], // Fri
  [22, 45, 68, 35], // Sat
  [18, 38, 55, 42], // Sun
]

const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const heatmapPeriods = ['Morning', 'Afternoon', 'Evening', 'Night']

// ============================================================
// Animated Counter Hook
// ============================================================

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])
  return count
}

// ============================================================
// Sub-components
// ============================================================

function MetricCard({
  label, value, suffix, icon, trend, trendValue, color, accentBorder
}: {
  label: string
  value: number
  suffix?: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color: string
  accentBorder: string
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card rounded-2xl p-4 relative overflow-hidden ${accentBorder} card-hover-lift`}
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)`, boxShadow: `0 0 15px ${color}12` }}>
          <div style={{ color, filter: `drop-shadow(0 0 4px ${color}40)` }}>{icon}</div>
        </div>
        {trend !== 'neutral' && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-extrabold text-white/95">
        {animatedValue.toLocaleString()}{suffix}
      </p>
      <p className="text-[11px] text-white/50 font-semibold mt-1">{label}</p>
    </motion.div>
  )
}

function BarChart({ data, period }: { data: typeof dailyMessages[Period]; period: Period }) {
  const maxSent = Math.max(...data.map(d => d.sent), 1)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  const getBarColor = (deliveryRate: number) => {
    if (deliveryRate >= 94) return { bar: '#10b981', glow: 'rgba(16,185,129,0.15)' }
    if (deliveryRate >= 88) return { bar: '#f59e0b', glow: 'rgba(245,158,11,0.15)' }
    return { bar: '#ef4444', glow: 'rgba(239,68,68,0.15)' }
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/85">Messages Sent</h3>
            <p className="text-[10px] text-white/40">Per {period === '7d' ? 'day' : period === '30d' ? 'week' : period === '90d' ? 'month' : 'quarter'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Low</span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-40">
        {data.map((item, i) => {
          const deliveryRate = (item.delivered / item.sent) * 100
          const colors = getBarColor(deliveryRate)
          const heightPct = (item.sent / maxSent) * 100
          const isHovered = hoveredBar === i

          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center gap-1 relative"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-10 px-3 py-2 rounded-xl bg-[#0c0c14]/95 border border-white/10 backdrop-blur-xl shadow-lg text-center min-w-[100px]">
                  <p className="text-[10px] text-white/40 font-medium">{item.day}</p>
                  <p className="text-sm font-bold text-white/90">{item.sent.toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-400">{deliveryRate.toFixed(1)}% delivered</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#0c0c14]/95 border-r border-b border-white/10" />
                </div>
              )}
              <motion.div
                className="w-full rounded-t-lg cursor-pointer relative"
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
                style={{
                  background: `linear-gradient(to top, ${colors.bar}30, ${colors.bar}90)`,
                  boxShadow: isHovered ? `0 0 20px ${colors.glow}, 0 -4px 15px ${colors.glow}` : `0 0 8px ${colors.glow}`,
                  filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                  transition: 'filter 0.2s, box-shadow 0.2s',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((item) => (
          <span key={item.day} className="flex-1 text-center text-[9px] text-white/35 font-medium">{item.day}</span>
        ))}
      </div>
    </div>
  )
}

function CampaignRank({ campaign, rank }: { campaign: typeof topCampaigns[0]; rank: number }) {
  const medalColors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#d97706' }
  const medalEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' }
  const scoreColor = campaign.score >= 90 ? '#10b981' : campaign.score >= 75 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * rank, duration: 0.3 }}
      className="glass-card rounded-xl p-3.5 border border-white/[0.04] card-hover-lift"
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{
          background: rank <= 3 ? `${medalColors[rank as 1|2|3]}15` : 'rgba(255,255,255,0.03)',
          boxShadow: rank <= 3 ? `0 0 12px ${medalColors[rank as 1|2|3]}10` : 'none',
        }}>
          {rank <= 3 ? <span className="text-base">{medalEmoji[rank as 1|2|3]}</span> : <span className="text-xs font-bold text-white/40">{rank}</span>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-bold text-white/85 truncate">{campaign.name}</p>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              campaign.status === 'active'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/5 text-white/40'
            }`}>
              {campaign.status === 'active' ? 'LIVE' : 'DONE'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Send className="w-2.5 h-2.5" />{campaign.sent.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />{campaign.delivery}%
            </span>
            <span className="text-[10px] text-cyan-400/70 flex items-center gap-1">
              <Reply className="w-2.5 h-2.5" />{campaign.reply}%
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="text-right">
            <span className="text-lg font-extrabold" style={{ color: scoreColor }}>{campaign.score}</span>
            <span className="text-[8px] text-white/30 ml-0.5">/100</span>
          </div>
          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${campaign.score}%` }}
              transition={{ delay: 0.2 + rank * 0.05, duration: 0.5 }}
              style={{ background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HorizontalBar({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 flex items-center gap-1.5 flex-shrink-0">
        {icon && <span style={{ color }}>{icon}</span>}
        <span className="text-[11px] text-white/55 font-medium">{label}</span>
      </div>
      <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
        />
      </div>
      <span className="text-[11px] font-bold text-white/70 w-8 text-right">{value}%</span>
    </div>
  )
}

function HeatmapCell({ value }: { value: number }) {
  const getCellColor = (v: number) => {
    if (v >= 85) return 'bg-emerald-500/70 border-emerald-500/30'
    if (v >= 65) return 'bg-emerald-500/45 border-emerald-500/20'
    if (v >= 45) return 'bg-amber-500/40 border-amber-500/20'
    if (v >= 25) return 'bg-amber-500/25 border-amber-500/10'
    return 'bg-white/[0.04] border-white/[0.04]'
  }
  return (
    <div
      className={`w-full aspect-square rounded-md border ${getCellColor(value)} flex items-center justify-center cursor-default transition-all duration-200 hover:scale-110`}
      title={`${value}% engagement`}
    >
      <span className="text-[7px] font-bold text-white/40">{value}</span>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export function CampaignAnalyticsPage() {
  const { goBack } = useAppStore()
  const [activePeriod, setActivePeriod] = useState<Period>('7d')
  const [costPerMessage, setCostPerMessage] = useState(0.05)
  const [revenuePerConversion, setRevenuePerConversion] = useState(45)
  const [conversionRate, setConversionRate] = useState(12)
  const [scheduledReports, setScheduledReports] = useState(false)
  const [reportEmail, setReportEmail] = useState('admin@eaje.com')
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [roiVisible, setRoiVisible] = useState(false)

  // Trigger ROI animation on mount
  useEffect(() => {
    const t = setTimeout(() => setRoiVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Current period data
  const currentData = useMemo(() => dailyMessages[activePeriod], [activePeriod])

  // Aggregate metrics for the selected period
  const metrics = useMemo(() => {
    const totalSent = currentData.reduce((s, d) => s + d.sent, 0)
    const totalDelivered = currentData.reduce((s, d) => s + d.delivered, 0)
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
    const replyRate = 24.6 // mock
    const campaignCount = activePeriod === '7d' ? 8 : activePeriod === '30d' ? 23 : activePeriod === '90d' ? 47 : 156
    return { totalSent, totalDelivered, deliveryRate, replyRate, campaignCount }
  }, [currentData, activePeriod])

  // ROI Calculations
  const roiCalculations = useMemo(() => {
    const totalCost = metrics.totalSent * costPerMessage
    const conversions = Math.round(metrics.totalSent * (conversionRate / 100))
    const totalRevenue = conversions * revenuePerConversion
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0
    const profit = totalRevenue - totalCost
    // Monthly projection (assuming 7d data, scale to 30d)
    const monthlyMultiplier = activePeriod === '7d' ? (30 / 7) : activePeriod === '30d' ? 1 : activePeriod === '90d' ? (1 / 3) : (1 / 12)
    const monthlySent = Math.round(metrics.totalSent * monthlyMultiplier)
    const monthlyCost = monthlySent * costPerMessage
    const monthlyConversions = Math.round(monthlySent * (conversionRate / 100))
    const monthlyRevenue = monthlyConversions * revenuePerConversion
    const monthlyProfit = monthlyRevenue - monthlyCost

    return { totalCost, conversions, totalRevenue, roi, profit, monthlyCost, monthlyRevenue, monthlyProfit, monthlyConversions, monthlySent }
  }, [metrics, costPerMessage, revenuePerConversion, conversionRate, activePeriod])

  const animatedRoi = useAnimatedCounter(roiVisible ? Math.round(roiCalculations.roi) : 0, 1500)

  return (
    <div className="px-4 py-4 pb-28 max-w-lg mx-auto space-y-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button onClick={goBack} className="w-9 h-9 rounded-xl glass-card flex items-center justify-center border-white/5 hover:border-white/15 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-white/95">Campaign Analytics</h1>
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-cyan-500 text-white badge-pulse">NEW</span>
          </div>
          <p className="text-[11px] text-white/40">Deep insights & ROI tracking</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.12)' }}>
          <BarChart3 className="w-4 h-4 text-emerald-400" />
        </div>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2"
      >
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePeriod(p)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
              activePeriod === p
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                : 'glass-card text-white/40 border-white/[0.03] hover:text-white/60 hover:border-white/10'
            }`}
          >
            {p}
          </button>
        ))}
      </motion.div>

      {/* ============ 1. Performance Overview ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider">Performance</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Campaigns"
            value={metrics.campaignCount}
            icon={<Target className="w-4 h-4" />}
            trend="up"
            trendValue="+18%"
            color="#10b981"
            accentBorder="border-t-0"
          />
          <MetricCard
            label="Messages Sent"
            value={metrics.totalSent}
            icon={<Send className="w-4 h-4" />}
            trend="up"
            trendValue="+24%"
            color="#06b6d4"
            accentBorder="border-t-0"
          />
          <MetricCard
            label="Delivery Rate"
            value={Math.round(metrics.deliveryRate)}
            suffix="%"
            icon={<CheckCircle2 className="w-4 h-4" />}
            trend="up"
            trendValue="+3.2%"
            color="#10b981"
            accentBorder="border-t-0"
          />
          <MetricCard
            label="Reply Rate"
            value={Math.round(metrics.replyRate * 10) / 10}
            suffix="%"
            icon={<Reply className="w-4 h-4" />}
            trend="down"
            trendValue="-1.4%"
            color="#8b5cf6"
            accentBorder="border-t-0"
          />
        </div>
      </motion.div>

      {/* ============ 2. Campaign Performance Chart ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <BarChart data={currentData} period={activePeriod} />
      </motion.div>

      {/* ============ 3. Top Performing Campaigns ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Top Campaigns</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
        <div className="space-y-2.5">
          {topCampaigns.map((campaign, i) => (
            <CampaignRank key={campaign.id} campaign={campaign} rank={i + 1} />
          ))}
        </div>
      </motion.div>

      {/* ============ 4. Audience Insights ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-400/90 uppercase tracking-wider">Audience Insights</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>

        {/* Age Groups */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-emerald-400/60" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Age Groups</span>
          </div>
          <div className="space-y-2.5">
            {ageGroups.map((group) => (
              <HorizontalBar key={group.label} label={group.label} value={group.value} color={group.color} />
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-cyan-400/60" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Top Countries</span>
          </div>
          <div className="space-y-2.5">
            {topCountries.map((country) => (
              <HorizontalBar key={country.label} label={country.label} value={country.value} color={country.color} />
            ))}
          </div>
        </div>

        {/* Device Types */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-3.5 h-3.5 text-purple-400/60" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Device Types</span>
          </div>
          <div className="space-y-2.5">
            {deviceTypes.map((device) => (
              <HorizontalBar key={device.label} label={device.label} value={device.value} color={device.color} icon={device.icon} />
            ))}
          </div>
        </div>

        {/* Engagement Heatmap */}
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-3.5 h-3.5 text-amber-400/60" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">Engagement Heatmap</span>
          </div>
          <p className="text-[9px] text-white/30 mb-2">Message engagement by day and time period</p>
          {/* Header row */}
          <div className="grid gap-1.5" style={{ gridTemplateColumns: '40px repeat(4, 1fr)' }}>
            <div /> {/* empty corner */}
            {heatmapPeriods.map((p) => (
              <div key={p} className="text-[8px] text-white/30 font-medium text-center">{p.slice(0, 3)}</div>
            ))}
            {/* Data rows */}
            {heatmapData.map((row, i) => (
              <>
                <div key={`label-${heatmapDays[i]}`} className="text-[9px] text-white/40 font-medium flex items-center">{heatmapDays[i]}</div>
                {row.map((value, j) => (
                  <HeatmapCell key={`${heatmapDays[i]}-${j}`} value={value} />
                ))}
              </>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-[8px] text-white/30">
              <span className="w-2 h-2 rounded-sm bg-white/[0.04] border border-white/[0.04]" /> Low
            </span>
            <span className="flex items-center gap-1 text-[8px] text-white/30">
              <span className="w-2 h-2 rounded-sm bg-amber-500/25 border border-amber-500/10" /> Med
            </span>
            <span className="flex items-center gap-1 text-[8px] text-white/30">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/45 border border-emerald-500/20" /> High
            </span>
            <span className="flex items-center gap-1 text-[8px] text-white/30">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/70 border border-emerald-500/30" /> Peak
            </span>
          </div>
        </div>
      </motion.div>

      {/* ============ 5. ROI Calculator ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider">ROI Calculator</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/10 relative overflow-hidden" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.05)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />

          {/* ROI Big Number */}
          <div className="text-center mb-5 relative z-10">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Return on Investment</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-5xl font-extrabold text-emerald-400" style={{ textShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
                {animatedRoi.toLocaleString()}
              </span>
              <span className="text-2xl font-bold text-emerald-400/60">%</span>
            </div>
            <p className={`text-[10px] mt-1 font-semibold ${roiCalculations.profit >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
              {roiCalculations.profit >= 0 ? '+' : ''}${Math.round(roiCalculations.profit).toLocaleString()} net profit
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4 relative z-10">
            {/* Cost per message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-white/50 font-medium">Cost per message</label>
                <span className="text-[12px] font-bold text-white/80">${costPerMessage.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={0.001}
                max={0.5}
                step={0.001}
                value={costPerMessage}
                onChange={(e) => setCostPerMessage(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer accent-emerald-500"
                style={{ accentColor: '#10b981' }}
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-0.5">
                <span>$0.001</span><span>$0.50</span>
              </div>
            </div>

            {/* Revenue per conversion */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-white/50 font-medium">Revenue per conversion</label>
                <span className="text-[12px] font-bold text-white/80">${revenuePerConversion}</span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={revenuePerConversion}
                onChange={(e) => setRevenuePerConversion(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer"
                style={{ accentColor: '#06b6d4' }}
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-0.5">
                <span>$1</span><span>$500</span>
              </div>
            </div>

            {/* Conversion rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-white/50 font-medium">Conversion rate</label>
                <span className="text-[12px] font-bold text-white/80">{conversionRate}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={50}
                step={0.5}
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer"
                style={{ accentColor: '#8b5cf6' }}
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-0.5">
                <span>0.5%</span><span>50%</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 mt-5 relative z-10">
            <div className="text-center py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[9px] text-white/30 font-medium">Total Cost</p>
              <p className="text-[13px] font-bold text-white/80">${Math.round(roiCalculations.totalCost).toLocaleString()}</p>
            </div>
            <div className="text-center py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[9px] text-white/30 font-medium">Conversions</p>
              <p className="text-[13px] font-bold text-cyan-400">{roiCalculations.conversions.toLocaleString()}</p>
            </div>
            <div className="text-center py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[9px] text-white/30 font-medium">Revenue</p>
              <p className="text-[13px] font-bold text-emerald-400">${Math.round(roiCalculations.totalRevenue).toLocaleString()}</p>
            </div>
          </div>

          {/* Monthly Projection */}
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/[0.06] to-cyan-500/[0.04] border border-emerald-500/10 relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="w-3 h-3 text-emerald-400/60" />
              <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider">Monthly Projection</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-white/30">Est. Messages</p>
                <p className="text-[12px] font-bold text-white/75">{roiCalculations.monthlySent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/30">Est. Cost</p>
                <p className="text-[12px] font-bold text-white/75">${Math.round(roiCalculations.monthlyCost).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/30">Est. Revenue</p>
                <p className="text-[12px] font-bold text-cyan-400">${Math.round(roiCalculations.monthlyRevenue).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] text-white/30">Est. Profit</p>
                <p className={`text-[12px] font-bold ${roiCalculations.monthlyProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {roiCalculations.monthlyProfit >= 0 ? '+' : ''}${Math.round(roiCalculations.monthlyProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============ 6. Export & Reports ============ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
            <Download className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] font-bold text-purple-400/90 uppercase tracking-wider">Export & Reports</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>

        {/* Quick Export Buttons */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-3">
          <p className="text-[11px] font-bold text-white/50 mb-3">Quick Export</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'PDF', icon: <FileText className="w-4 h-4" />, color: '#ef4444', bg: 'from-red-500/10 to-red-500/5', border: 'border-red-500/15' },
              { label: 'CSV', icon: <FileSpreadsheet className="w-4 h-4" />, color: '#10b981', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/15' },
              { label: 'Excel', icon: <FileDown className="w-4 h-4" />, color: '#06b6d4', bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/15' },
            ].map((format) => (
              <button
                key={format.label}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-gradient-to-br ${format.bg} border ${format.border} hover:scale-[1.03] active:scale-[0.97] transition-all duration-200`}
                style={{ boxShadow: `0 0 12px ${format.color}08` }}
              >
                <span style={{ color: format.color }}>{format.icon}</span>
                <span className="text-[10px] font-bold text-white/60">{format.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400/60" />
              <span className="text-[11px] font-bold text-white/60">Scheduled Reports</span>
            </div>
            <button
              onClick={() => setScheduledReports(!scheduledReports)}
              className="flex items-center"
            >
              {scheduledReports ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.3))' }} />
              ) : (
                <ToggleLeft className="w-8 h-8 text-white/25" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {scheduledReports && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Email input */}
                <div>
                  <label className="text-[10px] text-white/40 font-medium mb-1 block">Report Email</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Mail className="w-3.5 h-3.5 text-white/25" />
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/20"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Frequency selector */}
                <div>
                  <label className="text-[10px] text-white/40 font-medium mb-1.5 block">Frequency</label>
                  <div className="flex gap-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setReportFrequency(freq)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                          reportFrequency === freq
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-white/[0.02] text-white/35 border border-white/[0.04] hover:text-white/50'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Report includes */}
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <p className="text-[11px] font-bold text-white/50 mb-2">Report Includes</p>
          <div className="space-y-2">
            {[
              { label: 'Campaign performance summary', icon: <BarChart3 className="w-3 h-3 text-emerald-400/60" /> },
              { label: 'Audience demographics breakdown', icon: <Users className="w-3 h-3 text-cyan-400/60" /> },
              { label: 'ROI & conversion analysis', icon: <DollarSign className="w-3 h-3 text-amber-400/60" /> },
              { label: 'Engagement heatmap data', icon: <Eye className="w-3 h-3 text-purple-400/60" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.icon}
                <span className="text-[11px] text-white/45">{item.label}</span>
                <ChevronRight className="w-3 h-3 text-white/10 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  )
}

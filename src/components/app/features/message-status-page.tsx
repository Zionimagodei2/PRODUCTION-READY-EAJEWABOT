'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Activity, CheckCircle2, Clock, Eye, XCircle,
  Send, RefreshCw, ChevronDown, ChevronUp, Radio
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────

interface StatusStat {
  label: string
  value: number
  color: string
  icon: React.ReactNode
  percentage: number
  pulseDot?: boolean
}

interface FunnelStage {
  label: string
  count: number
  percentage: number
  color: string
  dropoff?: number
}

interface MessageItem {
  id: string
  recipient: string
  phone: string
  message: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  errorReason?: string
}

interface DonutSegment {
  label: string
  count: number
  percentage: number
  color: string
}

// ─── Mock Data ───────────────────────────────────────

const totalMessages = 22719

const statusStats: StatusStat[] = [
  { label: 'In Transit', value: 847, color: '#3b82f6', icon: <Clock className="w-4 h-4" />, percentage: 3.7, pulseDot: true },
  { label: 'Delivered', value: 12482, color: '#22c55e', icon: <CheckCircle2 className="w-4 h-4" />, percentage: 54.9 },
  { label: 'Read', value: 9234, color: '#8b5cf6', icon: <Eye className="w-4 h-4" />, percentage: 40.6 },
  { label: 'Failed', value: 156, color: '#ef4444', icon: <XCircle className="w-4 h-4" />, percentage: 0.7 },
]

const funnelStages: FunnelStage[] = [
  { label: 'Sent', count: 22719, percentage: 100, color: '#3b82f6' },
  { label: 'Delivered', count: 12482, percentage: 54.9, color: '#22c55e', dropoff: 45.1 },
  { label: 'Read', count: 9234, percentage: 40.6, color: '#8b5cf6', dropoff: 26.0 },
  { label: 'Replied', count: 3420, percentage: 15.1, color: '#06b6d4', dropoff: 63.0 },
  { label: 'Failed', count: 156, percentage: 0.7, color: '#ef4444', dropoff: 99.3 },
]

const recentMessages: MessageItem[] = [
  { id: '1', recipient: 'Sarah Chen', phone: '+1 555-0142', message: 'Hey Sarah! Your order #4521 has been shipped and will arrive by Friday.', status: 'read', timestamp: '12s ago' },
  { id: '2', recipient: 'Mike Johnson', phone: '+1 555-0198', message: 'Reminder: Your appointment is tomorrow at 3 PM. Reply YES to confirm.', status: 'delivered', timestamp: '45s ago' },
  { id: '3', recipient: 'Emma Wilson', phone: '+44 7700-900123', message: 'Hi Emma! Welcome to our loyalty program. Enjoy 20% off your next purchase!', status: 'sent', timestamp: '1m ago' },
  { id: '4', recipient: 'Alex Rodriguez', phone: '+1 555-0334', message: 'Your verification code is 84729. Do not share this code with anyone.', status: 'failed', timestamp: '2m ago', errorReason: 'Invalid number format — recipient has opted out of business messages' },
  { id: '5', recipient: 'Lisa Park', phone: '+82 10-1234-5678', message: 'Flash sale! 50% off all items this weekend only. Shop now!', status: 'read', timestamp: '3m ago' },
  { id: '6', recipient: 'David Kim', phone: '+1 555-0887', message: 'Your subscription renews on March 15. Manage your plan in settings.', status: 'delivered', timestamp: '5m ago' },
  { id: '7', recipient: 'Rachel Green', phone: '+1 555-0221', message: 'Thanks for your feedback! We\'ve credited 500 points to your account.', status: 'read', timestamp: '7m ago' },
  { id: '8', recipient: 'Tom Baker', phone: '+61 4-1234-5678', message: 'Your delivery is out for delivery! Track it live in the app.', status: 'delivered', timestamp: '8m ago' },
  { id: '9', recipient: 'Nina Patel', phone: '+91 98765-43210', message: 'Happy Birthday Nina! Enjoy a free dessert on us today.', status: 'failed', timestamp: '10m ago', errorReason: 'Number unreachable — device is offline for 72+ hours' },
  { id: '10', recipient: 'James Lee', phone: '+1 555-0456', message: 'New feature alert! You can now schedule messages up to 30 days ahead.', status: 'sent', timestamp: '12m ago' },
  { id: '11', recipient: 'Olivia Brown', phone: '+1 555-0789', message: 'Your weekly summary: 23 messages sent, 19 delivered, 14 read.', status: 'read', timestamp: '15m ago' },
  { id: '12', recipient: 'Carlos Martinez', phone: '+52 55-1234-5678', message: 'Promo code CARLOS25 for 25% off your next order. Expires Friday!', status: 'delivered', timestamp: '18m ago' },
  { id: '13', recipient: 'Amy Zhang', phone: '+86 138-0013-8000', message: 'Your support ticket #8472 has been resolved. Rate your experience!', status: 'read', timestamp: '22m ago' },
  { id: '14', recipient: 'Robert Taylor', phone: '+1 555-0567', message: 'Payment of $49.99 received. Receipt sent to your email.', status: 'delivered', timestamp: '25m ago' },
  { id: '15', recipient: 'Sophie Martin', phone: '+33 6-12-34-56-78', message: 'Your reservation at Chez Laurent is confirmed for Saturday 8 PM.', status: 'sent', timestamp: '30m ago' },
]

const donutSegments: DonutSegment[] = [
  { label: 'Delivered', count: 12482, percentage: 54.9, color: '#22c55e' },
  { label: 'Read', count: 9234, percentage: 40.6, color: '#8b5cf6' },
  { label: 'Failed', count: 156, percentage: 0.7, color: '#ef4444' },
  { label: 'Pending', count: 847, percentage: 3.7, color: '#f59e0b' },
]

// ─── Helper Functions ────────────────────────────────

function getStatusIcon(status: MessageItem['status']) {
  switch (status) {
    case 'sent': return <Send className="w-3.5 h-3.5" />
    case 'delivered': return <CheckCircle2 className="w-3.5 h-3.5" />
    case 'read': return <Eye className="w-3.5 h-3.5" />
    case 'failed': return <XCircle className="w-3.5 h-3.5" />
  }
}

function getStatusColor(status: MessageItem['status']) {
  switch (status) {
    case 'sent': return '#3b82f6'
    case 'delivered': return '#22c55e'
    case 'read': return '#8b5cf6'
    case 'failed': return '#ef4444'
  }
}

// ─── Donut Chart Component ───────────────────────────

function DonutChart() {
  const size = 160
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Pre-compute segment offsets to avoid reassigning variables during render
  const segmentOffsets: number[] = []
  let runningOffset = 0
  for (const segment of donutSegments) {
    segmentOffsets.push(runningOffset)
    runningOffset += (segment.percentage / 100) * circumference
  }

  const segments = donutSegments.map((segment, i) => {
    const segmentLength = (segment.percentage / 100) * circumference
    const gap = 3
    const actualLength = Math.max(0, segmentLength - gap)
    const startOffset = segmentOffsets[i] + gap / 2
    return {
      ...segment,
      strokeDasharray: `${actualLength} ${circumference - actualLength}`,
      strokeDashoffset: -startOffset,
    }
  })

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              stroke={seg.color}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
              style={{
                filter: `drop-shadow(0 0 4px ${seg.color}40)`,
              }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="text-xl font-extrabold text-white/95"
          >
            {totalMessages.toLocaleString()}
          </motion.p>
          <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Total</p>
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
        {donutSegments.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 + i * 0.06 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}40` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/70 font-medium">{seg.label}</p>
              <p className="text-[9px] text-white/30">
                {seg.count.toLocaleString()} · {seg.percentage}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Message Feed Item ───────────────────────────────

function MessageFeedItem({ message, index }: { message: MessageItem; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = getStatusColor(message.status)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.04, duration: 0.3 }}
      className="relative"
    >
      <motion.button
        onClick={() => message.status === 'failed' && setExpanded(!expanded)}
        whileTap={{ scale: 0.98 }}
        className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all duration-200 ${message.status === 'failed' ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ borderLeft: `3px solid ${statusColor}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[12px] text-white/95 font-semibold truncate">{message.recipient}</p>
            <span className="text-[9px] text-white/25 flex-shrink-0">{message.phone}</span>
          </div>
          <p className="text-[11px] text-white/50 truncate leading-relaxed">{message.message}</p>
          {message.status === 'failed' && message.errorReason && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-[10px] text-red-400/80 mt-1.5 leading-relaxed bg-red-500/[0.06] rounded-lg px-2.5 py-1.5 border border-red-500/10">
                {message.errorReason}
              </p>
            </motion.div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className="flex items-center gap-1"
            style={{ color: statusColor }}
          >
            {getStatusIcon(message.status)}
            <span className="text-[9px] font-semibold capitalize">{message.status}</span>
          </div>
          <span className="text-[9px] text-white/25">{message.timestamp}</span>
          {message.status === 'failed' && (
            expanded ? (
              <ChevronUp className="w-3 h-3 text-white/20" />
            ) : (
              <ChevronDown className="w-3 h-3 text-white/20" />
            )
          )}
        </div>
      </motion.button>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────

export function MessageStatusPage() {
  const { goBack } = useAppStore()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(30)

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setLastUpdated((prev) => {
        if (prev >= 60) {
          // Simulate refresh
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Reset timer when toggled on
  useEffect(() => {
    if (autoRefresh) {
      queueMicrotask(() => setLastUpdated(0))
    }
  }, [autoRefresh])

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
            <Activity
              className="w-5 h-5 text-amber-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }}
            />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Message Status</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Track message delivery in real-time</p>
        </div>
        {/* Live Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Live</span>
        </motion.div>
      </div>

      {/* Summary Stats - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statusStats.map((stat, i) => (
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
                className="w-8 h-8 rounded-xl flex items-center justify-center relative"
                style={{
                  backgroundColor: `${stat.color}12`,
                  border: `1px solid ${stat.color}20`,
                  boxShadow: `0 0 12px ${stat.color}10`,
                }}
              >
                <div style={{ color: stat.color }}>{stat.icon}</div>
                {stat.pulseDot && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-breathe"
                    style={{ backgroundColor: stat.color, color: stat.color }}
                  />
                )}
              </div>
              <span className="text-[10px] font-bold" style={{ color: stat.color }}>
                {stat.percentage}%
              </span>
            </div>
            <p className="text-xl font-extrabold text-white/95">{stat.value.toLocaleString()}</p>
            <p className="text-[10px] text-white/50 font-semibold mt-0.5">{stat.label}</p>
            {/* Mini progress bar */}
            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stat.color}60, ${stat.color})`,
                  boxShadow: `0 0 4px ${stat.color}30`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stat.percentage * 1.5, 100)}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="gradient-divider" />

      {/* Delivery Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-amber-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Delivery Funnel</span>
        </div>
        <div className="space-y-3">
          {funnelStages.map((stage, i) => (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stage.color, boxShadow: `0 0 6px ${stage.color}40` }}
                  />
                  <span className="text-[12px] text-white/70 font-semibold">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold" style={{ color: stage.color }}>
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-white/30">({stage.percentage}%)</span>
                </div>
              </div>
              <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${stage.color}40, ${stage.color})`,
                    boxShadow: `0 0 8px ${stage.color}25`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(stage.percentage, 2)}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              {/* Drop-off indicator */}
              {stage.dropoff !== undefined && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-1 mt-1 ml-4"
                >
                  <span className="text-[8px] text-white/20">↓</span>
                  <span className="text-[8px] text-red-400/50 font-medium">{stage.dropoff}% drop-off</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="gradient-divider" />

      {/* Status Distribution Donut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-amber-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Status Distribution</span>
        </div>
        <DonutChart />
      </motion.div>

      <div className="gradient-divider" />

      {/* Recent Message Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Message Feed</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04] max-h-96 overflow-y-auto no-scrollbar">
          {recentMessages.map((msg, i) => (
            <MessageFeedItem key={msg.id} message={msg} index={i} />
          ))}
        </div>
      </motion.div>

      <div className="gradient-divider" />

      {/* Auto-Refresh Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <RefreshCw
                className={`w-4 h-4 text-amber-400 ${autoRefresh ? 'animate-spin' : ''}`}
                style={{ animationDuration: '3s' }}
              />
            </div>
            <div>
              <p className="text-[12px] text-white/95 font-semibold">Auto-Refresh</p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Last updated: {lastUpdated < 60 ? `${lastUpdated}s ago` : `${Math.floor(lastUpdated / 60)}m ago`}
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setAutoRefresh(!autoRefresh)}
            whileTap={{ scale: 0.95 }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              autoRefresh ? 'bg-amber-500/30 border border-amber-500/40' : 'bg-white/[0.06] border border-white/[0.08]'
            }`}
            style={autoRefresh ? { boxShadow: '0 0 12px rgba(245,158,11,0.2)' } : {}}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full"
              animate={{
                left: autoRefresh ? '26px' : '2px',
                backgroundColor: autoRefresh ? '#f59e0b' : 'rgba(255,255,255,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={autoRefresh ? { boxShadow: '0 0 8px rgba(245,158,11,0.5)' } : {}}
            />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

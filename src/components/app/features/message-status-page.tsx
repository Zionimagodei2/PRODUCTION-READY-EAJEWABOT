'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from '@/lib/framer-shim'
import {
  ArrowLeft, Activity, CheckCircle2, Clock, Eye, XCircle,
  Send, RotateCw, Radio, Loader2, Inbox
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────

interface Campaign {
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
}

// ─── Helper Functions ────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'sent': return <Send className="w-3.5 h-3.5" />
    case 'delivered': return <CheckCircle2 className="w-3.5 h-3.5" />
    case 'read': return <Eye className="w-3.5 h-3.5" />
    case 'replied': return <Radio className="w-3.5 h-3.5" />
    case 'failed': return <XCircle className="w-3.5 h-3.5" />
    default: return <Clock className="w-3.5 h-3.5" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'sent': return '#3b82f6'
    case 'delivered': return '#22c55e'
    case 'read': return '#8b5cf6'
    case 'replied': return '#06b6d4'
    case 'failed': return '#ef4444'
    default: return '#64748b'
  }
}

// ─── Donut Chart Component ───────────────────────────

function DonutChart({ segments }: { segments: { label: string; count: number; percentage: number; color: string }[] }) {
  const size = 160
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const total = segments.reduce((sum, s) => sum + s.count, 0)

  const segmentOffsets: number[] = []
  let runningOffset = 0
  for (const segment of segments) {
    segmentOffsets.push(runningOffset)
    runningOffset += (segment.percentage / 100) * circumference
  }

  const chartSegments = segments.map((segment, i) => {
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

  if (total === 0) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-extrabold text-white/20">0</p>
            <p className="text-[9px] text-white/20 font-semibold uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
          />
          {chartSegments.map((seg, i) => (
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="text-xl font-extrabold text-white/95"
          >
            {total.toLocaleString()}
          </motion.p>
          <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Total</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
        {segments.map((seg, i) => (
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

// ─── Campaign Feed Item ──────────────────────────────

function CampaignFeedItem({ campaign, index }: { campaign: Campaign; index: number }) {
  const getStatusFromCampaign = (c: Campaign): string => {
    if (c.status === 'failed') return 'failed'
    if (c.replies > 0) return 'replied'
    if (c.delivered >= c.sent && c.sent > 0) return 'delivered'
    if (c.sent > 0) return 'sent'
    return 'scheduled'
  }

  const status = getStatusFromCampaign(campaign)
  const statusColor = getStatusColor(status)
  const deliveryRate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0
  const replyRate = c.delivered > 0 ? Math.round((c.replies / c.delivered) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.04, duration: 0.3 }}
      className="relative"
    >
      <div
        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all duration-200"
        style={{ borderLeft: `3px solid ${statusColor}` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[12px] text-white/95 font-semibold truncate">{campaign.name}</p>
            <span className="text-[9px] text-white/25 flex-shrink-0">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-[11px] text-white/50 truncate leading-relaxed">{campaign.message || 'No message content'}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[9px] text-blue-400/70">{campaign.sent} sent</span>
            <span className="text-[9px] text-green-400/70">{campaign.delivered} delivered</span>
            <span className="text-[9px] text-purple-400/70">{campaign.replies} replies</span>
            {deliveryRate > 0 && (
              <span className="text-[9px] text-cyan-400/70">{deliveryRate}% delivery</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className="flex items-center gap-1"
            style={{ color: statusColor }}
          >
            {getStatusIcon(status)}
            <span className="text-[9px] font-semibold capitalize">{status}</span>
          </div>
          {replyRate > 0 && (
            <span className="text-[9px] text-white/25">{replyRate}% reply</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────

export function MessageStatusPage() {
  const { goBack } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(0)

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch {
      // Silently fail - keep existing data
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      fetchCampaigns()
    })
  }, [fetchCampaigns])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setLastUpdated((prev) => {
        if (prev >= 60) {
          fetchCampaigns()
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchCampaigns])

  // Reset timer when toggled on
  useEffect(() => {
    if (autoRefresh) {
      queueMicrotask(() => setLastUpdated(0))
    }
  }, [autoRefresh])

  // Compute stats from real campaign data
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
  const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
  const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0)
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.sent - c.delivered > 0 ? c.sent - c.delivered : 0), 0)
  const inTransit = Math.max(0, totalSent - totalDelivered - totalFailed)

  const statusStats = [
    { label: 'In Transit', value: inTransit, color: '#3b82f6', icon: <Clock className="w-4 h-4" />, percentage: totalSent > 0 ? Math.round((inTransit / totalSent) * 100) : 0, pulseDot: inTransit > 0 },
    { label: 'Delivered', value: totalDelivered, color: '#22c55e', icon: <CheckCircle2 className="w-4 h-4" />, percentage: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0 },
    { label: 'Replied', value: totalReplies, color: '#8b5cf6', icon: <Eye className="w-4 h-4" />, percentage: totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 100) : 0 },
    { label: 'Failed', value: totalFailed, color: '#ef4444', icon: <XCircle className="w-4 h-4" />, percentage: totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0 },
  ]

  const funnelStages = [
    { label: 'Sent', count: totalSent, percentage: 100, color: '#3b82f6' },
    { label: 'Delivered', count: totalDelivered, percentage: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0, color: '#22c55e', dropoff: totalSent > 0 ? Math.round(((totalSent - totalDelivered) / totalSent) * 100) : 0 },
    { label: 'Replied', count: totalReplies, percentage: totalDelivered > 0 ? Math.round((totalReplies / totalDelivered) * 100) : 0, color: '#8b5cf6', dropoff: totalDelivered > 0 ? Math.round(((totalDelivered - totalReplies) / totalDelivered) * 100) : 0 },
  ]

  const donutSegments = [
    { label: 'Delivered', count: totalDelivered, percentage: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0, color: '#22c55e' },
    { label: 'Replied', count: totalReplies, percentage: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0, color: '#8b5cf6' },
    { label: 'Failed', count: totalFailed, percentage: totalSent > 0 ? Math.round((totalFailed / totalSent) * 100) : 0, color: '#ef4444' },
    { label: 'Pending', count: inTransit, percentage: totalSent > 0 ? Math.round((inTransit / totalSent) * 100) : 0, color: '#f59e0b' },
  ].filter(seg => seg.count > 0 || totalSent === 0)

  // Add a placeholder segment if nothing exists
  if (donutSegments.length === 0) {
    donutSegments.push({ label: 'No Data', count: 0, percentage: 100, color: '#334155' })
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

      {/* Loading State */}
      {isLoading ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <Loader2 className="w-8 h-8 text-amber-400/50 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-white/40 font-medium">Loading campaign data...</p>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {campaigns.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl py-16 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                <Inbox className="w-7 h-7 text-amber-400/50" />
              </div>
              <p className="text-sm text-white/50 font-semibold mb-1">No campaigns yet</p>
              <p className="text-xs text-white/30 max-w-[240px] mx-auto">
                Message delivery stats will appear here once you create and send campaigns.
              </p>
            </motion.div>
          ) : (
            <>
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
                      {'dropoff' in stage && stage.dropoff !== undefined && (
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
                <DonutChart segments={donutSegments} />
              </motion.div>

              <div className="gradient-divider" />

              {/* Campaign Message Feed */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Campaigns</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
                </div>
                <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04] max-h-96 overflow-y-auto no-scrollbar">
                  {campaigns.map((campaign, i) => (
                    <CampaignFeedItem key={campaign.id} campaign={campaign} index={i} />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </>
      )}

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
              <RotateCw
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

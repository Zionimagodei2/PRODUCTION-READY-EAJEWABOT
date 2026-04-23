'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Eye, Clock, ArrowUpRight, ArrowDownRight, ArrowLeft, Hash, Zap, Flame, Target, Activity } from 'lucide-react'

const mockData = {
  messagesSent: 1284,
  delivered: 1147,
  read: 892,
  replied: 342,
  deliveryRate: 89.3,
  readRate: 77.8,
  replyRate: 30.5,
  dailyStats: [
    { day: 'Mon', sent: 180, delivered: 162 },
    { day: 'Tue', sent: 220, delivered: 198 },
    { day: 'Wed', sent: 195, delivered: 175 },
    { day: 'Thu', sent: 240, delivered: 216 },
    { day: 'Fri', sent: 210, delivered: 189 },
    { day: 'Sat', sent: 120, delivered: 108 },
    { day: 'Sun', sent: 119, delivered: 99 },
  ],
  hourlyPeaks: [
    { hour: '6am', value: 15 }, { hour: '8am', value: 45 }, { hour: '10am', value: 78 },
    { hour: '12pm', value: 92 }, { hour: '2pm', value: 85 }, { hour: '4pm', value: 68 },
    { hour: '6pm', value: 55 }, { hour: '8pm', value: 35 }, { hour: '10pm', value: 18 },
  ]
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
  const maxSent = Math.max(...mockData.dailyStats.map(d => d.sent))

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

      {/* KPI Cards - Enhanced with mini sparklines */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <MessageSquare className="w-4 h-4" />, label: 'Messages Sent', value: mockData.messagesSent.toLocaleString(), trend: '+12%', trendUp: true, color: '#3b82f6', spark: [40, 70, 55, 85, 65, 90] },
          { icon: <Eye className="w-4 h-4" />, label: 'Delivered', value: mockData.delivered.toLocaleString(), trend: '+5%', trendUp: true, color: '#22c55e', spark: [55, 60, 75, 70, 80, 85] },
          { icon: <Users className="w-4 h-4" />, label: 'Read', value: mockData.read.toLocaleString(), trend: '+8%', trendUp: true, color: '#8b5cf6', spark: [35, 50, 45, 60, 55, 70] },
          { icon: <Clock className="w-4 h-4" />, label: 'Replied', value: mockData.replied.toLocaleString(), trend: '-2%', trendUp: false, color: '#f59e0b', spark: [60, 50, 55, 40, 45, 35] },
        ].map((stat, i) => (
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
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
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
        ))}
      </div>

      {/* Rate Cards - Enhanced with ring progress */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Delivery', value: mockData.deliveryRate, color: '#22c55e' },
          { label: 'Read', value: mockData.readRate, color: '#3b82f6' },
          { label: 'Reply', value: mockData.replyRate, color: '#f59e0b' },
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
            { label: 'Sent', value: 1284, pct: 100, color: '#3b82f6' },
            { label: 'Delivered', value: 1147, pct: 89.3, color: '#22c55e' },
            { label: 'Read', value: 892, pct: 69.5, color: '#8b5cf6' },
            { label: 'Replied', value: 342, pct: 26.6, color: '#f59e0b' },
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
        <div className="flex items-end gap-1.5 h-32">
          {mockData.dailyStats.map((day, i) => (
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
        <div className="flex items-end gap-1 h-16">
          {mockData.hourlyPeaks.map((hour, i) => (
            <motion.div
              key={hour.hour}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.04 }}
            >
              <div className="w-full relative group cursor-pointer" style={{ height: '48px' }}>
                <motion.div
                  className="w-full rounded-t-sm absolute bottom-0"
                  style={{
                    height: `${hour.value}%`,
                    background: hour.value > 80
                      ? 'linear-gradient(to top, rgba(239,68,68,0.3), rgba(239,68,68,0.7))'
                      : hour.value > 50
                        ? 'linear-gradient(to top, rgba(245,158,11,0.3), rgba(245,158,11,0.6))'
                        : 'linear-gradient(to top, rgba(34,197,94,0.2), rgba(34,197,94,0.4))',
                    boxShadow: hour.value > 80 ? '0 0 8px rgba(239,68,68,0.15)' : 'none',
                  }}
                  whileHover={{ filter: 'brightness(1.3)' }}
                />
                {/* Tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-white/10 text-[7px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {hour.value}% activity
                </div>
              </div>
              <span className="text-[7px] text-white/20 font-medium">{hour.hour}</span>
            </motion.div>
          ))}
        </div>
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
        <div className="space-y-3">
          {[
            { name: 'Product Launch', rate: 94.2, trend: 'up', sent: 452, color: '#22c55e' },
            { name: 'Weekly Newsletter', rate: 87.5, trend: 'up', sent: 312, color: '#3b82f6' },
            { name: 'Flash Sale', rate: 72.1, trend: 'down', sent: 189, color: '#ef4444' },
          ].map((campaign, i) => (
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
            { label: 'Best Day', value: 'Thursday', sub: '240 messages', icon: <Flame className="w-3 h-3" />, color: '#22c55e' },
            { label: 'Peak Hour', value: '12:00 PM', sub: 'Highest activity', icon: <Clock className="w-3 h-3" />, color: '#ef4444' },
            { label: 'Avg Msg/Day', value: '183', sub: 'This week', icon: <MessageSquare className="w-3 h-3" />, color: '#3b82f6' },
            { label: 'Growth', value: '+12%', sub: 'vs last week', icon: <TrendingUp className="w-3 h-3" />, color: '#8b5cf6' },
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

'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Eye, Clock, ArrowUpRight, ArrowDownRight, ArrowLeft, Hash } from 'lucide-react'

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
  ]
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <MessageSquare className="w-4 h-4" />, label: 'Messages Sent', value: mockData.messagesSent.toLocaleString(), trend: '+12%', trendUp: true, color: '#3b82f6' },
          { icon: <Eye className="w-4 h-4" />, label: 'Delivered', value: mockData.delivered.toLocaleString(), trend: '+5%', trendUp: true, color: '#22c55e' },
          { icon: <Users className="w-4 h-4" />, label: 'Read', value: mockData.read.toLocaleString(), trend: '+8%', trendUp: true, color: '#8b5cf6' },
          { icon: <Clock className="w-4 h-4" />, label: 'Replied', value: mockData.replied.toLocaleString(), trend: '-2%', trendUp: false, color: '#f59e0b' },
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
          </motion.div>
        ))}
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Delivery Rate', value: mockData.deliveryRate, color: '#22c55e' },
          { label: 'Read Rate', value: mockData.readRate, color: '#3b82f6' },
          { label: 'Reply Rate', value: mockData.replyRate, color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass-card rounded-2xl p-3 text-center card-hover-lift"
            style={{ borderTop: `2px solid ${stat.color}` }}
          >
            <p className="text-lg font-extrabold" style={{ color: stat.color }}>{stat.value}%</p>
            <p className="text-[9px] text-white/40 font-semibold mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Daily Activity</span>
        </div>
        <div className="flex items-end gap-2 h-32">
          {mockData.dailyStats.map((day, i) => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                <div className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.sent / maxSent) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                    className="w-full rounded-t-md"
                    style={{
                      background: `linear-gradient(to top, rgba(236,72,153,0.3), rgba(236,72,153,0.7))`,
                      boxShadow: '0 0 8px rgba(236,72,153,0.15)',
                    }}
                    whileHover={{ filter: 'brightness(1.3)' }}
                  />
                </div>
              </div>
              <span className="text-[9px] text-white/30 font-medium">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(236,72,153,0.7)' }} /> Sent
          </span>
        </div>
      </motion.div>

      {/* Top Performing Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-pink-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Top Campaigns</span>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        <div className="space-y-3">
          {[
            { name: 'Product Launch', rate: 94.2, trend: 'up' },
            { name: 'Weekly Newsletter', rate: 87.5, trend: 'up' },
            { name: 'Flash Sale', rate: 72.1, trend: 'down' },
          ].map((campaign) => (
            <div key={campaign.name} className="flex items-center justify-between py-1.5">
              <span className="text-[12px] text-white/70 font-medium">{campaign.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${campaign.rate}%`,
                      background: campaign.trend === 'up'
                        ? 'linear-gradient(90deg, rgba(34,197,94,0.5), rgba(34,197,94,0.9))'
                        : 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(239,68,68,0.9))'
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-white/85 w-10 text-right">{campaign.rate}%</span>
                {campaign.trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

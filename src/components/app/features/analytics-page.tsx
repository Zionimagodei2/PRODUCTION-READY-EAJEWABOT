'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Users, MessageSquare, Eye, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const maxSent = Math.max(...mockData.dailyStats.map(d => d.sent))

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-pink border border-pink-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-pink-500/10">
            <BarChart3 className="w-5 h-5 text-neon-pink" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90">Analytics</h2>
            <p className="text-[10px] text-white/40">Track performance & metrics</p>
          </div>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              period === p ? 'bg-neon-pink/15 text-neon-pink border-neon-pink/25' : 'bg-white/5 text-white/40 border-white/5'
            }`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-4 h-4 text-neon-blue" />
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />12%</span>
          </div>
          <p className="text-xl font-bold text-white/90">{mockData.messagesSent.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Messages Sent</p>
        </div>
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-4 h-4 text-neon-green" />
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />5%</span>
          </div>
          <p className="text-xl font-bold text-white/90">{mockData.delivered.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Delivered</p>
        </div>
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4 text-neon-purple" />
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />8%</span>
          </div>
          <p className="text-xl font-bold text-white/90">{mockData.read.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Read</p>
        </div>
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-4 h-4 text-neon-orange" />
            <span className="text-[10px] text-red-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />2%</span>
          </div>
          <p className="text-xl font-bold text-white/90">{mockData.replied.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Replied</p>
        </div>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Delivery Rate', value: mockData.deliveryRate, color: 'text-neon-green' },
          { label: 'Read Rate', value: mockData.readRate, color: 'text-neon-blue' },
          { label: 'Reply Rate', value: mockData.replyRate, color: 'text-neon-orange' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}%</p>
            <p className="text-[9px] text-white/30 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart - Simple Bar Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/50 mb-4">Daily Activity</h3>
        <div className="flex items-end gap-2 h-32">
          {mockData.dailyStats.map((day) => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                <div className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.sent / maxSent) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full rounded-t-sm bg-gradient-to-t from-neon-blue/40 to-neon-blue/80"
                  />
                </div>
              </div>
              <span className="text-[9px] text-white/25">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-[9px] text-white/30">
            <div className="w-2 h-2 rounded-sm bg-neon-blue/70" /> Sent
          </span>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/50 mb-3">Top Campaigns</h3>
        <div className="space-y-2.5">
          {[
            { name: 'Product Launch', rate: 94.2, trend: 'up' },
            { name: 'Weekly Newsletter', rate: 87.5, trend: 'up' },
            { name: 'Flash Sale', rate: 72.1, trend: 'down' },
          ].map((campaign) => (
            <div key={campaign.name} className="flex items-center justify-between">
              <span className="text-xs text-white/70">{campaign.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white/90">{campaign.rate}%</span>
                {campaign.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

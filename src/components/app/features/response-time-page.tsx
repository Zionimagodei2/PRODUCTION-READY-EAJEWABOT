'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Timer, TrendingDown, TrendingUp, Zap,
  Lightbulb, Target, User, ChevronRight
} from 'lucide-react'

interface KpiStat {
  label: string
  value: string
  trend: 'up' | 'down'
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

interface TeamMember {
  id: string
  name: string
  initials: string
  avgTime: string
  responseCount: number
  progress: number
  color: string
}

const kpiStats: KpiStat[] = [
  { label: 'Avg Response Time', value: '4.2 min', trend: 'down', trendValue: '↓18%', color: '#8b5cf6', icon: <Timer className="w-4 h-4" /> },
  { label: 'Fastest Response', value: '12 sec', trend: 'up', trendValue: '↑5%', color: '#22c55e', icon: <Zap className="w-4 h-4" /> },
  { label: 'Slowest Response', value: '23 min', trend: 'down', trendValue: '↓8%', color: '#ef4444', icon: <TrendingUp className="w-4 h-4" /> },
]

const weekData: DayResponse[] = [
  { day: 'Mon', minutes: 3.2 },
  { day: 'Tue', minutes: 1.8 },
  { day: 'Wed', minutes: 5.6 },
  { day: 'Thu', minutes: 4.1 },
  { day: 'Fri', minutes: 2.4 },
  { day: 'Sat', minutes: 7.2 },
  { day: 'Sun', minutes: 3.8 },
]

const distribution: DistributionBucket[] = [
  { label: '<1 min', percentage: 35, color: '#22c55e' },
  { label: '1-3 min', percentage: 28, color: '#84cc16' },
  { label: '3-5 min', percentage: 20, color: '#f59e0b' },
  { label: '5-10 min', percentage: 12, color: '#f97316' },
  { label: '>10 min', percentage: 5, color: '#ef4444' },
]

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah Chen', initials: 'SC', avgTime: '2.1 min', responseCount: 342, progress: 85, color: '#8b5cf6' },
  { id: '2', name: 'Mike Ross', initials: 'MR', avgTime: '3.8 min', responseCount: 256, progress: 65, color: '#3b82f6' },
  { id: '3', name: 'Emma Liu', initials: 'EL', avgTime: '5.4 min', responseCount: 189, progress: 45, color: '#f59e0b' },
  { id: '4', name: 'Alex Kim', initials: 'AK', avgTime: '7.1 min', responseCount: 124, progress: 30, color: '#ef4444' },
]

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

export function ResponseTimePage() {
  const { goBack } = useAppStore()
  const [targetMinutes, setTargetMinutes] = useState(5)

  const currentAvg = 4.2
  const goalProgress = Math.min(100, (targetMinutes / currentAvg) * 100)
  const isGoalMet = currentAvg <= targetMinutes

  // Ring progress calculation
  const ringSize = 80
  const ringStroke = 6
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringDashoffset = ringCircumference - (Math.min(goalProgress, 100) / 100) * ringCircumference

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
              stat.trend === 'down' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {stat.trend === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
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
        <div className="flex items-end gap-2 h-28">
          {weekData.map((day, i) => {
            const maxMinutes = 8
            const heightPercent = Math.min(100, (day.minutes / maxMinutes) * 100)
            const barColor = getBarColor(day.minutes)
            return (
              <motion.div
                key={day.day}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <span className="text-[8px] font-mono text-white/30">{day.minutes}m</span>
                <div className="w-full relative group">
                  <motion.div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${heightPercent}%`,
                      background: `linear-gradient(to top, ${barColor}30, ${barColor}90)`,
                      boxShadow: `0 0 8px ${barColor}20`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    whileHover={{ filter: 'brightness(1.3)' }}
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
        <div className="space-y-3">
          {distribution.map((bucket, i) => (
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
      </motion.div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Team Performance</span>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {teamMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.06 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                style={{
                  backgroundColor: `${member.color}15`,
                  border: `1px solid ${member.color}25`,
                  color: member.color,
                }}
              >
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/75 font-medium">{member.name}</p>
                  <p className="text-[11px] font-bold" style={{ color: member.color }}>{member.avgTime}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${member.color}60, ${member.color})`,
                        boxShadow: `0 0 4px ${member.color}30`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${member.progress}%` }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[9px] text-white/25 font-medium flex-shrink-0">{member.responseCount} replies</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/10 flex-shrink-0" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Response Goals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
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
                stroke={isGoalMet ? '#22c55e' : '#8b5cf6'}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{
                  filter: `drop-shadow(0 0 6px ${isGoalMet ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.4)'})`,
                  transition: 'stroke-dashoffset 0.5s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-white/90">{currentAvg}</span>
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
              <span className={`text-[11px] font-bold ${isGoalMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isGoalMet ? '✓ Goal Met' : '⚡ Improving'}
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
        transition={{ delay: 0.75 }}
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
              transition={{ delay: 0.8 + i * 0.06 }}
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

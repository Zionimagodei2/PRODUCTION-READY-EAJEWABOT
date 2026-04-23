'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type FeaturePage } from '@/store/app-store'
import { 
  Send, MessageSquare, Bot, Calendar, 
  Users, Search, Link2, BarChart3, FileText,
  ArrowRight, Zap, TrendingUp, Activity, FileCode,
  Megaphone, UserPlus, Clock, Sparkles, Phone, 
  CheckCircle2, AlertCircle, ChevronRight, Flame, Radio, Database,
  Sun, Moon, Target, Wifi, ShieldCheck, Wand2, Upload, QrCode, Timer, MessageCircle, GitBranch, Webhook, Brain
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToastStore } from '@/store/toast-store'
import { DashboardSkeleton } from '@/components/app/loading-skeleton'

interface Stats {
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
  recentActivity: { id: string; type: string; text: string; time: string; color: string }[]
}

interface FeatureCardProps {
  id: FeaturePage
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  glowClass: string
  borderColor: string
  gradientFrom: string
  gradientTo: string
  isActive?: boolean
  hasNewBadge?: boolean
  isPopular?: boolean
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
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

// Ring progress component for circular indicators
function RingProgress({ size = 36, strokeWidth = 3, progress = 0, color = '#3b82f6', trackColor = 'rgba(255,255,255,0.06)' }: { 
  size?: number; strokeWidth?: number; progress?: number; color?: string; trackColor?: string 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference
  return (
    <svg width={size} height={size} className="ring-progress">
      <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} className="ring-progress-bg" style={{ stroke: trackColor }} />
      <circle 
        cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth}
        className="ring-progress-fill"
        style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset }}
      />
    </svg>
  )
}

// Current time hook - hydration-safe
function useCurrentTime() {
  const [time, setTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    queueMicrotask(() => {
      setTime(new Date())
      setMounted(true)
    })
    const interval = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])
  return { time, mounted }
}

// Mini sparkline component for stat cards (3-4 tiny bars)
function MiniSparkline({ color, bars }: { color: string; bars: number[] }) {
  return (
    <div className="flex items-end gap-[2px] h-5 mt-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, ${color}40, ${color}80)`,
          }}
        />
      ))}
    </div>
  )
}

function StatCard({ value, label, icon, colorClass, statClass, breathColor, trend, trendValue, sparklineBars, sparklineColor, vsLabel }: { 
  value: number; label: string; icon: React.ReactNode; colorClass: string; statClass: string; breathColor?: string;
  trend?: 'up' | 'down'; trendValue?: string; sparklineBars?: number[]; sparklineColor?: string; vsLabel?: string
}) {
  const animatedValue = useAnimatedCounter(value)
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card rounded-2xl p-4 text-center ${statClass} card-hover-lift`}
    >
      <div className={`w-8 h-8 mx-auto rounded-xl ${colorClass} flex items-center justify-center mb-2 relative`}>
        {icon}
        {breathColor && (
          <div 
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-breathe"
            style={{ backgroundColor: breathColor, color: breathColor }}
          />
        )}
      </div>
      <p className="text-2xl font-extrabold text-white/95 animate-count-up">{animatedValue.toLocaleString()}</p>
      <p className="text-[11px] text-white/55 font-semibold mt-1">{label}</p>
      {/* Trend indicator */}
      {trend && trendValue && (
        <p className={`text-[10px] font-bold mt-0.5 flex items-center justify-center gap-0.5 ${
          trend === 'up' ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5 rotate-180" />}
          {trendValue}
        </p>
      )}
      {/* vs last week comparison */}
      {vsLabel && (
        <p className={`text-[9px] mt-0.5 ${
          vsLabel.startsWith('↑') ? 'text-emerald-400/60' : 'text-red-400/60'
        }`}>{vsLabel}</p>
      )}
      {/* Mini sparkline */}
      {sparklineBars && sparklineColor && (
        <div className="flex justify-center">
          <MiniSparkline color={sparklineColor} bars={sparklineBars} />
        </div>
      )}
    </motion.div>
  )
}

function FeatureCard({ id, icon, title, subtitle, color, glowClass, borderColor, gradientFrom, gradientTo, isActive, hasNewBadge, isPopular }: FeatureCardProps) {
  const { setActiveFeature } = useAppStore()

  return (
    <motion.button
      variants={item}
      onClick={() => setActiveFeature(id)}
      className={`group relative flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} border ${borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${glowClass} text-left w-full min-h-[100px] micro-bounce`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg relative"
        style={{ 
          background: `linear-gradient(135deg, ${color}20, ${color}08)`,
          boxShadow: `0 0 20px ${color}15`
        }}
      >
        <div style={{ color, filter: `drop-shadow(0 0 6px ${color}40)` }}>{icon}</div>
        {isActive && (
          <div 
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-breathe border border-black/30"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[13px] font-bold text-white/95 tracking-tight">{title}</h3>
          {hasNewBadge && (
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white badge-pulse">NEW</span>
          )}
        </div>
        {isPopular && (
          <span className="text-[7px] font-bold text-amber-400/60 mt-0.5 flex items-center gap-0.5">⭐ Popular</span>
        )}
        <p className="text-[11px] text-white/55 mt-0.5 leading-tight">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-white/15 absolute top-4 right-4 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
    </motion.button>
  )
}

const coreAutomation: FeatureCardProps[] = [
  { id: 'inbox', icon: <MessageCircle className="w-5 h-5" />, title: 'Inbox', subtitle: 'All conversations', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent', isActive: true, isPopular: true },
  { id: 'send-message', icon: <Send className="w-5 h-5" />, title: 'Send Message', subtitle: 'Bulk campaigns & schedules', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent', isPopular: true },
  { id: 'auto-reply', icon: <MessageSquare className="w-5 h-5" />, title: 'Auto Reply', subtitle: 'Smart responses', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'chatbot', icon: <Bot className="w-5 h-5" />, title: 'Chatbot', subtitle: 'AI-powered conversations', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'scheduler', icon: <Calendar className="w-5 h-5" />, title: 'Scheduler', subtitle: 'Plan messages ahead', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'message-templates', icon: <FileCode className="w-5 h-5" />, title: 'Templates', subtitle: 'Reusable message templates', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'ai-chat', icon: <Sparkles className="w-5 h-5" />, title: 'AI Assistant', subtitle: 'Smart automation helper', color: '#f59e0b', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent', isActive: true, hasNewBadge: true, isPopular: true },
  { id: 'personality-agent', icon: <Brain className="w-5 h-5" />, title: 'AI Twin', subtitle: 'Auto-reply in your style', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true, isPopular: true },
  { id: 'campaign-wizard', icon: <Wand2 className="w-5 h-5" />, title: 'Campaign Wizard', subtitle: 'Step-by-step campaign builder', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'flow-builder', icon: <GitBranch className="w-5 h-5" />, title: 'Flow Builder', subtitle: 'Design conversation flows', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
]

const growthTools: FeatureCardProps[] = [
  { id: 'group-extractor', icon: <Users className="w-5 h-5" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'lead-scraper', icon: <Search className="w-5 h-5" />, title: 'Lead Scraper', subtitle: 'Find new prospects', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'number-validator', icon: <ShieldCheck className="w-5 h-5" />, title: 'Number Validator', subtitle: 'Verify WhatsApp numbers', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'link-generator', icon: <Link2 className="w-5 h-5" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'broadcast-lists', icon: <Radio className="w-5 h-5" />, title: 'Broadcast Lists', subtitle: 'Targeted group messaging', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'qr-code', icon: <QrCode className="w-5 h-5" />, title: 'QR Code', subtitle: 'Generate WhatsApp QR codes', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
]

const insights: FeatureCardProps[] = [
  { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, title: 'Analytics', subtitle: 'Track performance & metrics', color: '#ec4899', glowClass: 'neon-glow-pink', borderColor: 'border-pink-500/20', gradientFrom: 'from-pink-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'campaign-reports', icon: <FileText className="w-5 h-5" />, title: 'Campaign Reports', subtitle: 'Detailed delivery reports', color: '#ef4444', glowClass: 'neon-glow-red', borderColor: 'border-red-500/20', gradientFrom: 'from-red-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'response-time', icon: <Timer className="w-5 h-5" />, title: 'Response Time', subtitle: 'Track response performance', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'message-status', icon: <Activity className="w-5 h-5" />, title: 'Message Status', subtitle: 'Track delivery in real-time', color: '#f59e0b', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent' },
]

const dataSection: FeatureCardProps[] = [
  { id: 'data-export', icon: <Database className="w-5 h-5" />, title: 'Data Export', subtitle: 'Export data in various formats', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'contact-import', icon: <Upload className="w-5 h-5" />, title: 'Contact Import', subtitle: 'Import contacts from CSV', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'webhook-manager', icon: <Webhook className="w-5 h-5" />, title: 'Webhook Manager', subtitle: 'Manage API webhooks & events', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent' },
]

const organizationSection: FeatureCardProps[] = [
  { id: 'contact-groups', icon: <Users className="w-5 h-5" />, title: 'Contact Groups', subtitle: 'Organize & segment contacts', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'team-management', icon: <Users className="w-5 h-5" />, title: 'Team Management', subtitle: 'Manage members & roles', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
]

export function DashboardPage() {
  const { waConnected, setActiveFeature, setAddContactOpen } = useAppStore()
  const { addToast } = useToastStore()
  const { time: currentTime, mounted } = useCurrentTime()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Silent fail for stats
      } finally {
        setIsLoadingStats(false)
      }
    }
    fetchStats()
  }, [])

  // Rotating tips state
  const tips = [
    '💡 Tip: Schedule messages during peak hours (9-11 AM) for 40% better open rates',
    '💡 Tip: Personalized messages get 2x more replies',
    '💡 Tip: Follow up within 5 minutes for best conversion',
  ]
  const [tipIndex, setTipIndex] = useState(0)
  const [tipKey, setTipKey] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
      setTipKey((prev) => prev + 1)
    }, 10000)
    return () => clearInterval(interval)
  }, [tips.length])

  // Mark all as read state for recent activity
  const [activityDimmed, setActivityDimmed] = useState(false)

  const greeting = mounted && currentTime ? (currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening') : 'Hello'
  const formattedDate = mounted && currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''
  const formattedTime = mounted && currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

  // Use real stats or fallback
  const totalSent = stats?.totalSent ?? 0
  const totalDelivered = stats?.totalDelivered ?? 0
  const totalReplies = stats?.totalReplies ?? 0
  const weeklyActivity = stats?.weeklyActivity ?? []
  const recentActivity = stats?.recentActivity ?? []

  // Compute weekly activity percentages for sparkline
  const maxWeeklyMessages = Math.max(...weeklyActivity.map(d => d.messages), 1)

  if (isLoadingStats) {
    return <DashboardSkeleton />
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Connection Health Bar */}
      <motion.div 
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8 }}
        className="h-1 rounded-full overflow-hidden bg-white/5"
      >
        <div 
          className={`h-full rounded-full ${waConnected ? 'connection-health-bar' : ''}`}
          style={{ width: waConnected ? '85%' : '30%', background: waConnected ? undefined : 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(245,158,11,0.5))' }}
        />
      </motion.div>

      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-lg font-extrabold text-white/95">{greeting} 👋</h1>
          <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5">
            <span>{formattedDate}</span>
            {mounted && <><span className="text-white/15">•</span><span>{formattedTime}</span></>}
            <span className="text-white/15">•</span>
            <span className="flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" style={{ color: waConnected ? '#22c55e' : '#ef4444' }} />
              {waConnected ? 'Connected' : 'Offline'}
            </span>
          </p>
          {/* Rotating Tip */}
          <p key={tipKey} className="text-[10px] text-white/30 mt-1 animate-tip-fade">{tips[tipIndex]}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Weekly Goal Ring */}
          <div className="relative flex items-center justify-center">
            <RingProgress size={36} strokeWidth={3} progress={stats?.deliveryRate ?? 72} color="#8b5cf6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-3 h-3 text-purple-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats - Enhanced with real data from API */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          value={totalSent} 
          label="Sent" 
          icon={<Send className="w-4 h-4 text-neon-blue" />}
          colorClass="bg-blue-500/10"
          statClass="stat-card-blue"
          trend="up"
          trendValue="↑12%"
          vsLabel="↑12% vs last week"
          sparklineBars={[40, 70, 50, 85]}
          sparklineColor="#3b82f6"
        />
        <StatCard 
          value={totalDelivered} 
          label="Delivered" 
          icon={<TrendingUp className="w-4 h-4 text-neon-green" />}
          colorClass="bg-green-500/10"
          statClass="stat-card-green"
          breathColor="#22c55e"
          trend="up"
          trendValue="↑8%"
          vsLabel="↑8% vs last week"
          sparklineBars={[55, 65, 80, 70]}
          sparklineColor="#22c55e"
        />
        <StatCard 
          value={totalReplies} 
          label="Replies" 
          icon={<Activity className="w-4 h-4 text-neon-purple" />}
          colorClass="bg-purple-500/10"
          statClass="stat-card-purple"
          trend="down"
          trendValue="↓3%"
          vsLabel="↓3% vs last week"
          sparklineBars={[60, 45, 50, 35]}
          sparklineColor="#8b5cf6"
        />
      </div>

      {/* Subtle divider below stats row */}
      <div className="gradient-divider" />

      {/* Activity Sparkline - Enhanced with weekly goal ring */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4 border-white/5 data-viz-gradient relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Activity This Week</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
            <div className="relative flex items-center justify-center">
              <RingProgress size={28} strokeWidth={2.5} progress={stats?.deliveryRate ?? 72} color="#22c55e" />
              <span className="absolute text-[7px] font-bold text-emerald-400">{Math.round(stats?.deliveryRate ?? 72)}%</span>
            </div>
          </div>
        </div>
        {weeklyActivity.length > 0 ? (
          <>
            <div className="flex items-end gap-2 h-16">
              {weeklyActivity.map((day, i) => (
                <motion.div
                  key={day.day}
                  className="flex-1 rounded-t-md relative group cursor-pointer"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.messages / maxWeeklyMessages) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  style={{
                    background: `linear-gradient(to top, rgba(59,130,246,0.3), rgba(59,130,246,0.7))`,
                  }}
                  whileHover={{ filter: 'brightness(1.3)', scaleY: 1.05 }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-white/10 text-[8px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.messages} msgs
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2 mt-1.5">
              {weeklyActivity.map((day) => (
                <span key={day.day} className="flex-1 text-center text-[8px] text-white/30 font-medium">{day.day}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="h-16 flex items-center justify-center">
            <p className="text-xs text-white/20">No activity data yet</p>
          </div>
        )}
      </motion.div>

      {/* Quick Actions - Enhanced */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <Zap className="w-3 h-3 text-neon-cyan" />
            <span className="text-[11px] font-bold text-cyan-400/90 uppercase tracking-wider">Quick Actions</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {[
            { onClick: () => { setActiveFeature('send-message'); }, icon: <Megaphone className="w-3.5 h-3.5 text-blue-400" />, label: 'New Campaign', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', hover: 'hover:bg-blue-500/15', shadow: '0 0 12px rgba(59,130,246,0.15)' },
            { onClick: () => { setAddContactOpen(true); }, icon: <UserPlus className="w-3.5 h-3.5 text-green-400" />, label: 'Add Contact', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', hover: 'hover:bg-green-500/15', shadow: '0 0 12px rgba(34,197,94,0.15)' },
            { onClick: () => { setActiveFeature('auto-reply'); }, icon: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />, label: 'Quick Reply', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', hover: 'hover:bg-purple-500/15', shadow: '0 0 12px rgba(139,92,246,0.15)' },
            { onClick: () => { setActiveFeature('scheduler'); }, icon: <Clock className="w-3.5 h-3.5 text-amber-400" />, label: 'Schedule', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', hover: 'hover:bg-amber-500/15', shadow: '0 0 12px rgba(245,158,11,0.15)' },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              onClick={action.onClick}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${action.bg} border ${action.border} whitespace-nowrap flex-shrink-0 ${action.hover} transition-colors`}
              style={{ boxShadow: action.shadow }}
            >
              {action.icon}
              <span className={`text-xs font-semibold ${action.text}`}>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Core Automation - compact grid with min-h */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/15">
            <Zap className="w-3 h-3 text-neon-blue" />
            <span className="text-[11px] font-bold text-blue-400/90 uppercase tracking-wider">Core Automation</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {coreAutomation.slice(0, 4).map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {coreAutomation.slice(4).map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Growth Tools - Changed to 2x2 grid */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/15">
            <TrendingUp className="w-3 h-3 text-neon-green" />
            <span className="text-[11px] font-bold text-green-400/90 uppercase tracking-wider">Growth Tools</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {growthTools.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Organization */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
            <Users className="w-3 h-3 text-neon-purple" />
            <span className="text-[11px] font-bold text-purple-400/90 uppercase tracking-wider">Organization</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {organizationSection.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/15">
            <BarChart3 className="w-3 h-3 text-neon-pink" />
            <span className="text-[11px] font-bold text-pink-400/90 uppercase tracking-wider">Insights</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {insights.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Data */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <Database className="w-3 h-3 text-neon-cyan" />
            <span className="text-[11px] font-bold text-cyan-400/90 uppercase tracking-wider">Data</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {dataSection.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* System Health Mini-Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">System Health</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="health-dot-green" />
              <span className="text-[9px] text-white/30">API</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="health-dot-green" />
              <span className="text-[9px] text-white/30">DB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="health-dot-amber" />
              <span className="text-[9px] text-white/30">Queue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="health-dot-green" />
              <span className="text-[9px] text-white/30">Storage</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Feed - Enhanced with View All link and Mark All as Read */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
            <Flame className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Recent Activity</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
          <motion.button
            onClick={() => { setActivityDimmed(true); addToast({ type: 'success', title: 'All activity marked as read' }) }}
            whileTap={{ scale: 0.95 }}
            className="text-[9px] font-semibold text-white/25 hover:text-white/50 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.03]"
          >
            Mark all as read
          </motion.button>
        </div>
        <div className={`glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04] transition-opacity duration-300 ${activityDimmed ? 'activity-dimmed' : ''}`}>
          {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all duration-200 cursor-pointer group"
              whileHover={{ boxShadow: `0 0 20px ${activity.color}10` }}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${activity.color}12`, border: `1px solid ${activity.color}20` }}
              >
                <Activity className="w-3.5 h-3.5" style={{ color: activity.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-readable font-medium truncate">{activity.text}</p>
                <p className="text-[10px] text-subtitle mt-0.5">{activity.time}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/10 flex-shrink-0" />
            </motion.div>
          )) : (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-white/30">No recent activity</p>
            </div>
          )}
        </div>
        {/* View All link */}
        <motion.button
          onClick={() => { setActiveFeature('analytics') }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-2 py-2.5 rounded-xl text-center text-xs font-semibold text-amber-400/70 hover:text-amber-400 bg-amber-500/[0.04] border border-amber-500/10 hover:border-amber-500/20 transition-all"
        >
          View All Activity →
        </motion.button>
      </motion.div>
    </div>
  )
}

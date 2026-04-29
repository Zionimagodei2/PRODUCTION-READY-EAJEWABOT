'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type FeaturePage } from '@/store/app-store'
import { 
  Send, MessageSquare, Bot, Calendar, 
  Users, Search, Link2, BarChart3, FileText,
  ArrowRight, Zap, TrendingUp, Activity, FileCode,
  Megaphone, UserPlus, Clock, Sparkles, Phone, 
  CheckCircle2, AlertCircle, ChevronRight, Flame, Radio, Database,
  Sun, Moon, Target, Wifi, ShieldCheck, Shield, Wand2, Upload, QrCode, Timer, MessageCircle, GitBranch, Webhook, Brain,
  Lightbulb, RefreshCw, Eye, Server, HardDrive, CircleDot
} from 'lucide-react'
import { motion } from '@/lib/framer-shim'
import { useToastStore } from '@/store/toast-store'
import { DashboardSkeleton } from '@/components/app/loading-skeleton'

interface TrendData {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
}

interface HealthData {
  status: string
  uptime: number
  timestamp: string
  services: {
    database: string
    whatsapp: string
    api: string
  }
}

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
  prevWeekActivity: { day: string; messages: number }[]
  weeklyTrend: TrendData
  recentActivity: { id: string; type: string; text: string; time: string; color: string }[]
  sentTrend: TrendData
  deliveredTrend: TrendData
  repliesTrend: TrendData
  campaignsThisWeek: number
  campaignsLastWeek: number
  quickInsight: string
  whatsNew: { title: string; description: string; badge: string }[]
  isReturningUser: boolean
  inactiveContacts: number
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

// Staggered section entrance
const sectionVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
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
  { id: 'ai-smart-reply', icon: <Sparkles className="w-5 h-5" />, title: 'AI Smart Reply', subtitle: 'Intelligent reply suggestions', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent', isActive: true, hasNewBadge: true },
  { id: 'campaign-wizard', icon: <Wand2 className="w-5 h-5" />, title: 'Campaign Wizard', subtitle: 'Step-by-step campaign builder', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'flow-builder', icon: <GitBranch className="w-5 h-5" />, title: 'Flow Builder', subtitle: 'Design conversation flows', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'bulk-scheduler', icon: <Calendar className="w-5 h-5" />, title: 'Bulk Scheduler', subtitle: 'Schedule bulk campaigns', color: '#6366f1', glowClass: 'neon-glow-purple', borderColor: 'border-indigo-500/20', gradientFrom: 'from-indigo-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true, isPopular: true },
]

const growthTools: FeatureCardProps[] = [
  { id: 'group-extractor', icon: <Users className="w-5 h-5" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'lead-scraper', icon: <Search className="w-5 h-5" />, title: 'Lead Scraper', subtitle: 'Find new prospects', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'number-validator', icon: <ShieldCheck className="w-5 h-5" />, title: 'Number Validator', subtitle: 'Verify WhatsApp numbers', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
  { id: 'link-generator', icon: <Link2 className="w-5 h-5" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'broadcast-lists', icon: <Radio className="w-5 h-5" />, title: 'Broadcast Lists', subtitle: 'Targeted group messaging', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'qr-code', icon: <QrCode className="w-5 h-5" />, title: 'QR Code', subtitle: 'Generate WhatsApp QR codes', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'anti-ban', icon: <Shield className="w-5 h-5" />, title: 'Anti-Ban Shield', subtitle: 'Protect from WhatsApp bans', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
]

const insightsSection: FeatureCardProps[] = [
  { id: 'campaign-analytics', icon: <BarChart3 className="w-5 h-5" />, title: 'Campaign Analytics', subtitle: 'Deep insights & ROI tracking', color: '#10b981', glowClass: 'neon-glow-green', borderColor: 'border-emerald-500/20', gradientFrom: 'from-emerald-500/[0.06]', gradientTo: 'to-transparent', hasNewBadge: true },
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

// Health dot component
function HealthDot({ status }: { status: string }) {
  if (status === 'ok') return <div className="health-dot-green" />
  if (status === 'offline') return <div className="health-dot-red" />
  return <div className="health-dot-amber" />
}

export function DashboardPage() {
  const { waConnected, setActiveFeature, setAddContactOpen } = useAppStore()
  const { addToast } = useToastStore()
  const { time: currentTime, mounted } = useCurrentTime()
  const [stats, setStats] = useState<Stats | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Fetch stats from API with auto-refresh every 30s
  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true)
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        setLastRefreshed(new Date())
      }
    } catch {
      // Silent fail for stats
    } finally {
      setIsLoadingStats(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch health data
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setHealthData(data)
      }
    } catch {
      // Silent fail for health
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      fetchStats()
      fetchHealth()
    })
  }, [fetchStats, fetchHealth])

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(true)
      fetchHealth()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchStats, fetchHealth])

  // Quick Stats toast on first dashboard load per session
  useEffect(() => {
    if (isLoadingStats || !stats) return
    const sessionKey = 'eaje-quick-stats-shown'
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) return
    const sent = stats.totalSent ?? 0
    const rate = stats.deliveryRate ?? 0
    const active = stats.activeCampaigns ?? 0
    if (sent > 0 || rate > 0 || active > 0) {
      addToast({ 
        type: 'info', 
        title: '📊 Quick Stats', 
        message: `${sent.toLocaleString()} messages sent today • ${rate}% delivery rate${active > 0 ? ` • ${active} active campaigns` : ''}`,
        duration: 5000,
      })
      if (typeof window !== 'undefined') sessionStorage.setItem(sessionKey, '1')
    }
  }, [isLoadingStats, stats, addToast])

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

  // Personalized greeting - "Welcome back" for returning users
  const isReturningUser = stats?.isReturningUser ?? false
  const greeting = mounted && currentTime 
    ? (isReturningUser 
        ? 'Welcome Back' 
        : (currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening'))
    : 'Hello'
  const formattedDate = mounted && currentTime ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''
  const formattedTime = mounted && currentTime ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

  // Use real stats or fallback
  const totalSent = stats?.totalSent ?? 0
  const totalDelivered = stats?.totalDelivered ?? 0
  const totalReplies = stats?.totalReplies ?? 0
  const weeklyActivity = stats?.weeklyActivity ?? []
  const recentActivity = stats?.recentActivity ?? []
  const sentTrend = stats?.sentTrend
  const deliveredTrend = stats?.deliveredTrend
  const repliesTrend = stats?.repliesTrend
  const weeklyTrend = stats?.weeklyTrend
  const quickInsight = stats?.quickInsight ?? ''
  const whatsNew = stats?.whatsNew ?? []

  // Compute mini sparkline bars from real weekly activity data (last 4 days)
  const miniSparklineData = weeklyActivity.slice(-4).map(d => d.messages)
  const maxMini = Math.max(...miniSparklineData, 1)
  const miniSparklinePcts = miniSparklineData.map(v => Math.round((v / maxMini) * 100))

  // Compute weekly activity percentages for sparkline
  const maxWeeklyMessages = Math.max(...weeklyActivity.map(d => d.messages), 1)

  // Helper to format trend display
  const formatTrend = (trend?: TrendData): { trend?: 'up' | 'down'; trendValue?: string; vsLabel?: string } => {
    if (!trend || trend.direction === 'neutral') return {}
    const arrow = trend.direction === 'up' ? '↑' : '↓'
    const label = `${arrow}${trend.percentage}%`
    return {
      trend: trend.direction,
      trendValue: label,
      vsLabel: `${label} vs last week`,
    }
  }

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

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
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-lg font-extrabold text-white/95">{greeting} 👋</h1>
          <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{formattedDate}</span>
            {mounted && <><span className="text-white/15">•</span><span>{formattedTime}</span></>}
            <span className="text-white/15">•</span>
            <span className="flex items-center gap-1">
              {/* Live indicator with pulsing green dot */}
              {waConnected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
              {!waConnected && <Wifi className="w-2.5 h-2.5" style={{ color: '#ef4444' }} />}
              <span className={waConnected ? 'text-emerald-400/80 font-semibold' : 'text-red-400/80'}>
                {waConnected ? 'Live' : 'Offline'}
              </span>
            </span>
            {/* Auto-refresh indicator */}
            {lastRefreshed && (
              <>
                <span className="text-white/15">•</span>
                <span className="flex items-center gap-0.5 text-white/25">
                  <RefreshCw className={`w-2 h-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-[9px]">30s</span>
                </span>
              </>
            )}
          </p>
          {/* Rotating Tip */}
          <p key={tipKey} className="text-[10px] text-white/30 mt-1 animate-tip-fade">{tips[tipIndex]}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Weekly Goal Ring */}
          <div className="relative flex items-center justify-center">
            <RingProgress size={36} strokeWidth={3} progress={stats?.deliveryRate ?? 0} color="#8b5cf6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-3 h-3 text-purple-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* What's New Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 22 }}
        className="glass-card rounded-2xl p-4 border border-fuchsia-500/15 relative overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(217,70,239,0.06)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/[0.04] to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          </div>
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">What&apos;s New</span>
          <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white badge-pulse">FRESH</span>
        </div>
        <div className="grid grid-cols-2 gap-2 relative z-10">
          {whatsNew.map((feature) => (
            <div 
              key={feature.title}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-fuchsia-500/20 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white/75 truncate">{feature.title}</p>
                <p className="text-[9px] text-white/35 truncate">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Insight Card */}
      {quickInsight && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 22 }}
          className="glass-card rounded-2xl p-4 border border-amber-500/15 relative overflow-hidden"
          style={{ boxShadow: '0 0 30px rgba(245,158,11,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider">Quick Insight</span>
              <p className="text-[13px] font-semibold text-white/80 mt-0.5 leading-snug">{quickInsight}</p>
              <div className="flex items-center gap-3 mt-2">
                {stats && stats.deliveryRate > 0 && (
                  <span className="text-[10px] text-white/35 flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-emerald-400/60" />
                    {stats.deliveryRate}% delivery
                  </span>
                )}
                {stats && stats.replyRate > 0 && (
                  <span className="text-[10px] text-white/35 flex items-center gap-1">
                    <MessageCircle className="w-2.5 h-2.5 text-purple-400/60" />
                    {stats.replyRate}% reply
                  </span>
                )}
                {stats && stats.inactiveContacts > 0 && (
                  <span className="text-[10px] text-white/35 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 text-amber-400/60" />
                    {stats.inactiveContacts} idle
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats - Enhanced with real data from API */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div className="grid grid-cols-3 gap-3">
          <StatCard 
            value={totalSent} 
            label="Sent" 
            icon={<Send className="w-4 h-4 text-neon-blue" />}
            colorClass="bg-blue-500/10"
            statClass="stat-card-blue"
            {...formatTrend(sentTrend)}
            sparklineBars={miniSparklinePcts.length >= 4 ? miniSparklinePcts : undefined}
            sparklineColor="#3b82f6"
          />
          <StatCard 
            value={totalDelivered} 
            label="Delivered" 
            icon={<TrendingUp className="w-4 h-4 text-neon-green" />}
            colorClass="bg-green-500/10"
            statClass="stat-card-green"
            breathColor="#22c55e"
            {...formatTrend(deliveredTrend)}
            sparklineBars={miniSparklinePcts.length >= 4 ? miniSparklinePcts : undefined}
            sparklineColor="#22c55e"
          />
          <StatCard 
            value={totalReplies} 
            label="Replies" 
            icon={<Activity className="w-4 h-4 text-neon-purple" />}
            colorClass="bg-purple-500/10"
            statClass="stat-card-purple"
            {...formatTrend(repliesTrend)}
            sparklineBars={miniSparklinePcts.length >= 4 ? miniSparklinePcts : undefined}
            sparklineColor="#8b5cf6"
          />
        </div>
      </motion.div>

      {/* Subtle divider below stats row */}
      <div className="gradient-divider" />

      {/* Activity Sparkline - Enhanced with weekly goal ring */}
      <motion.div 
        variants={sectionVariant}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-4 border-white/5 data-viz-gradient relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Activity This Week</h3>
          <div className="flex items-center gap-2">
            {weeklyTrend && weeklyTrend.direction !== 'neutral' && (
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                weeklyTrend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                <TrendingUp className={`w-3 h-3 ${weeklyTrend.direction === 'down' ? 'rotate-180' : ''}`} />
                {weeklyTrend.direction === 'up' ? '+' : '-'}{weeklyTrend.percentage}%
              </span>
            )}
            <div className="relative flex items-center justify-center">
              <RingProgress size={28} strokeWidth={2.5} progress={stats?.deliveryRate ?? 0} color="#22c55e" />
              <span className="absolute text-[7px] font-bold text-emerald-400">{Math.round(stats?.deliveryRate ?? 0)}%</span>
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
        variants={sectionVariant}
        initial="hidden"
        animate="show"
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
          {insightsSection.map((card) => (
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

      {/* System Health Widget - Enhanced with actual API health checks */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-4 border border-white/[0.04]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">System Health</span>
            {healthData && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                healthData.status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {healthData.status === 'ok' ? 'HEALTHY' : 'DEGRADED'}
              </span>
            )}
          </div>
          {healthData && (
            <span className="text-[9px] text-white/20 flex items-center gap-1">
              <Clock className="w-2 h-2" />
              Uptime: {formatUptime(healthData.uptime)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'API', icon: <Server className="w-2.5 h-2.5" />, status: healthData?.services.api ?? 'unknown' },
            { label: 'Database', icon: <HardDrive className="w-2.5 h-2.5" />, status: healthData?.services.database ?? 'unknown' },
            { label: 'WhatsApp', icon: <Phone className="w-2.5 h-2.5" />, status: healthData?.services.whatsapp ?? 'unknown' },
            { label: 'Queue', icon: <CircleDot className="w-2.5 h-2.5" />, status: 'ok' },
          ].map((service) => (
            <div 
              key={service.label}
              className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl bg-white/[0.02] border border-white/[0.03]"
            >
              <div className="flex items-center gap-1">
                <HealthDot status={service.status} />
                <span className="text-white/25">{service.icon}</span>
              </div>
              <span className="text-[8px] text-white/35 font-medium">{service.label}</span>
              <span className={`text-[7px] font-bold ${
                service.status === 'ok' ? 'text-emerald-400/70' : 
                service.status === 'offline' ? 'text-white/20' : 
                service.status === 'error' ? 'text-red-400/70' : 'text-amber-400/70'
              }`}>
                {service.status === 'ok' ? 'Online' : 
                 service.status === 'offline' ? 'Offline' : 
                 service.status === 'error' ? 'Error' : 'Unknown'}
              </span>
            </div>
          ))}
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

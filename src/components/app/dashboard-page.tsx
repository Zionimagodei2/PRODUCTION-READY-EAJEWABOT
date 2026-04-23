'use client'

import { useAppStore, type FeaturePage } from '@/store/app-store'
import { 
  Send, MessageSquare, Bot, Calendar, 
  Users, Search, Link2, BarChart3, FileText,
  ArrowRight, Zap, TrendingUp, Activity, FileCode
} from 'lucide-react'
import { motion } from 'framer-motion'

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

function FeatureCard({ id, icon, title, subtitle, color, glowClass, borderColor, gradientFrom, gradientTo }: FeatureCardProps) {
  const { setActiveFeature } = useAppStore()

  return (
    <motion.button
      variants={item}
      onClick={() => setActiveFeature(id)}
      className={`group relative flex flex-col items-start gap-2.5 p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} border ${borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${glowClass} text-left w-full`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${color}20, ${color}08)`,
          boxShadow: `0 0 20px ${color}15`
        }}
      >
        <div style={{ color, filter: `drop-shadow(0 0 6px ${color}40)` }}>{icon}</div>
      </div>
      <div className="flex-1">
        <h3 className="text-[13px] font-bold text-white/95 tracking-tight">{title}</h3>
        <p className="text-[11px] text-white/55 mt-0.5 leading-tight">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-white/15 absolute top-4 right-4 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all duration-200" />
    </motion.button>
  )
}

const coreAutomation: FeatureCardProps[] = [
  { id: 'send-message', icon: <Send className="w-5 h-5" />, title: 'Send Message', subtitle: 'Bulk campaigns & schedules', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'auto-reply', icon: <MessageSquare className="w-5 h-5" />, title: 'Auto Reply', subtitle: 'Smart responses', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/20', gradientFrom: 'from-blue-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'chatbot', icon: <Bot className="w-5 h-5" />, title: 'Chatbot', subtitle: 'AI-powered conversations', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'scheduler', icon: <Calendar className="w-5 h-5" />, title: 'Scheduler', subtitle: 'Plan messages ahead', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/20', gradientFrom: 'from-purple-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'message-templates', icon: <FileCode className="w-5 h-5" />, title: 'Templates', subtitle: 'Reusable message templates', color: '#06b6d4', glowClass: 'neon-glow-cyan', borderColor: 'border-cyan-500/20', gradientFrom: 'from-cyan-500/[0.06]', gradientTo: 'to-transparent' },
]

const growthTools: FeatureCardProps[] = [
  { id: 'group-extractor', icon: <Users className="w-5 h-5" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'lead-scraper', icon: <Search className="w-5 h-5" />, title: 'Lead Scraper', subtitle: 'Find new prospects', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/20', gradientFrom: 'from-green-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'link-generator', icon: <Link2 className="w-5 h-5" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/20', gradientFrom: 'from-orange-500/[0.06]', gradientTo: 'to-transparent' },
]

const insights: FeatureCardProps[] = [
  { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, title: 'Analytics', subtitle: 'Track performance & metrics', color: '#ec4899', glowClass: 'neon-glow-pink', borderColor: 'border-pink-500/20', gradientFrom: 'from-pink-500/[0.06]', gradientTo: 'to-transparent' },
  { id: 'campaign-reports', icon: <FileText className="w-5 h-5" />, title: 'Campaign Reports', subtitle: 'Detailed delivery reports', color: '#ef4444', glowClass: 'neon-glow-red', borderColor: 'border-red-500/20', gradientFrom: 'from-red-500/[0.06]', gradientTo: 'to-transparent' },
]

export function DashboardPage() {
  const { waConnected } = useAppStore()

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Quick Stats - Enhanced */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass-card rounded-2xl p-3.5 text-center border-blue-500/10 hover:border-blue-500/20 transition-colors">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <Send className="w-3.5 h-3.5 text-neon-blue" />
          </div>
          <p className="text-xl font-extrabold text-white/95">1,284</p>
          <p className="text-[10px] text-white/50 font-medium mt-0.5">Sent</p>
        </div>
        <div className="glass-card rounded-2xl p-3.5 text-center border-green-500/10 hover:border-green-500/20 transition-colors">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
          </div>
          <p className="text-xl font-extrabold text-white/95">847</p>
          <p className="text-[10px] text-white/50 font-medium mt-0.5">Delivered</p>
        </div>
        <div className="glass-card rounded-2xl p-3.5 text-center border-purple-500/10 hover:border-purple-500/20 transition-colors">
          <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-1.5">
            <Activity className="w-3.5 h-3.5 text-neon-purple" />
          </div>
          <p className="text-xl font-extrabold text-white/95">342</p>
          <p className="text-[10px] text-white/50 font-medium mt-0.5">Replies</p>
        </div>
      </motion.div>

      {/* Activity Sparkline */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4 border-white/5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Activity This Week</h3>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> +12%
          </span>
        </div>
        <div className="flex items-end gap-1 h-12">
          {[40, 65, 50, 80, 70, 35, 55].map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-500/40 to-blue-400/70"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
            />
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <span key={i} className="flex-1 text-center text-[8px] text-white/25 font-medium">{day}</span>
          ))}
        </div>
      </motion.div>

      {/* Core Automation */}
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
        <div className="grid grid-cols-1 gap-3 mt-3">
          {coreAutomation.slice(4).map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Growth Tools */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/15">
            <TrendingUp className="w-3 h-3 text-neon-green" />
            <span className="text-[11px] font-bold text-green-400/90 uppercase tracking-wider">Growth Tools</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {growthTools.map((card) => (
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
    </div>
  )
}

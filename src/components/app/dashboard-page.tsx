'use client'

import { useAppStore, type FeaturePage } from '@/store/app-store'
import { 
  Send, MessageSquare, Bot, Calendar, 
  Users, Search, Link2, BarChart3, FileText,
  ArrowRight
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
  delay?: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

function FeatureCard({ id, icon, title, subtitle, color, glowClass, borderColor, delay = 0 }: FeatureCardProps) {
  const { setActiveFeature } = useAppStore()

  return (
    <motion.button
      variants={item}
      onClick={() => setActiveFeature(id)}
      className={`group relative flex flex-col items-start gap-2 p-4 rounded-xl bg-white/[0.03] border ${borderColor} hover:bg-white/[0.06] transition-all duration-300 ${glowClass} text-left w-full`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-white/20 absolute top-4 right-4 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  )
}

const coreAutomation: FeatureCardProps[] = [
  { id: 'send-message', icon: <Send className="w-5 h-5" />, title: 'Send Message', subtitle: 'Bulk campaigns & schedules', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/15' },
  { id: 'auto-reply', icon: <MessageSquare className="w-5 h-5" />, title: 'Auto Reply', subtitle: 'Smart responses', color: '#3b82f6', glowClass: 'neon-glow-blue', borderColor: 'border-blue-500/15' },
  { id: 'chatbot', icon: <Bot className="w-5 h-5" />, title: 'Chatbot', subtitle: 'AI-powered conversations', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/15' },
  { id: 'scheduler', icon: <Calendar className="w-5 h-5" />, title: 'Scheduler', subtitle: 'Plan messages', color: '#8b5cf6', glowClass: 'neon-glow-purple', borderColor: 'border-purple-500/15' },
]

const growthTools: FeatureCardProps[] = [
  { id: 'group-extractor', icon: <Users className="w-5 h-5" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/15' },
  { id: 'lead-scraper', icon: <Search className="w-5 h-5" />, title: 'Lead Scraper', subtitle: 'Find new prospects', color: '#22c55e', glowClass: 'neon-glow-green', borderColor: 'border-green-500/15' },
  { id: 'link-generator', icon: <Link2 className="w-5 h-5" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', color: '#f97316', glowClass: 'neon-glow-orange', borderColor: 'border-orange-500/15' },
]

const insights: FeatureCardProps[] = [
  { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, title: 'Analytics', subtitle: 'Track performance & metrics', color: '#ec4899', glowClass: 'neon-glow-pink', borderColor: 'border-pink-500/15' },
  { id: 'campaign-reports', icon: <FileText className="w-5 h-5" />, title: 'Campaign Reports', subtitle: 'Detailed delivery reports', color: '#ef4444', glowClass: 'neon-glow-red', borderColor: 'border-red-500/15' },
]

export function DashboardPage() {
  const { waConnected } = useAppStore()

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-neon-blue">1,284</p>
          <p className="text-[10px] text-white/40 mt-0.5">Messages Sent</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-neon-green">847</p>
          <p className="text-[10px] text-white/40 mt-0.5">Delivered</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-neon-purple">342</p>
          <p className="text-[10px] text-white/40 mt-0.5">Replies</p>
        </div>
      </motion.div>

      {/* Core Automation */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" />
          Core Automation
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {coreAutomation.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Growth Tools */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
          Growth Tools
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {growthTools.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-pink" />
          Insights
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {insights.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

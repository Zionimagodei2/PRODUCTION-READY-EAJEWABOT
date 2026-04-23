'use client'

import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Pause, Play, Copy, Trash2, Download,
  Send, CheckCircle2, Eye, MessageSquare, XCircle,
  Mail, Users, Globe
} from 'lucide-react'

interface CampaignDetail {
  id: string
  name: string
  status: 'active' | 'scheduled' | 'completed' | 'paused' | 'failed'
  sent: number
  delivered: number
  read: number
  replied: number
  failed: number
  total: number
  date: string
  message: string
  recipientBreakdown: { label: string; count: number; color: string }[]
}

const campaignDetails: Record<string, CampaignDetail> = {
  '1': {
    id: '1', name: 'Product Launch Promo', status: 'active',
    sent: 452, delivered: 410, read: 320, replied: 38, failed: 12, total: 1000,
    date: '2024-01-15',
    message: '🎉 Exciting news! Our new product is now available. Get 20% off with code LAUNCH20. Shop now at eaje.com',
    recipientBreakdown: [
      { label: 'Existing Customers', count: 300, color: '#3b82f6' },
      { label: 'Leads', count: 400, color: '#8b5cf6' },
      { label: 'New Prospects', count: 200, color: '#22c55e' },
      { label: 'VIP Clients', count: 100, color: '#f59e0b' },
    ],
  },
  '2': {
    id: '2', name: 'Weekly Newsletter', status: 'scheduled',
    sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, total: 500,
    date: '2024-01-16',
    message: '📰 This Week at EAJE: New features, tips & tricks, and community highlights. Read more inside!',
    recipientBreakdown: [
      { label: 'Subscribers', count: 350, color: '#3b82f6' },
      { label: 'Trial Users', count: 100, color: '#8b5cf6' },
      { label: 'Partners', count: 50, color: '#22c55e' },
    ],
  },
  '3': {
    id: '3', name: 'Holiday Greetings', status: 'completed',
    sent: 800, delivered: 756, read: 620, replied: 92, failed: 8, total: 800,
    date: '2024-01-10',
    message: '🎄 Happy Holidays from EAJE! Wishing you joy and success. Enjoy our holiday special - 30% off all plans!',
    recipientBreakdown: [
      { label: 'All Contacts', count: 800, color: '#ec4899' },
    ],
  },
  '4': {
    id: '4', name: 'Flash Sale Alert', status: 'paused',
    sent: 230, delivered: 210, read: 150, replied: 15, failed: 5, total: 600,
    date: '2024-01-14',
    message: '⚡ Flash Sale! 50% off for the next 2 hours only. Use code FLASH50. Don\'t miss out!',
    recipientBreakdown: [
      { label: 'Active Buyers', count: 200, color: '#f59e0b' },
      { label: 'Cart Abandoners', count: 250, color: '#ef4444' },
      { label: 'Recent Visitors', count: 150, color: '#06b6d4' },
    ],
  },
  '5': {
    id: '5', name: 'Customer Follow-up', status: 'failed',
    sent: 50, delivered: 45, read: 30, replied: 3, failed: 42, total: 200,
    date: '2024-01-13',
    message: 'Hi {name}! We noticed you haven\'t visited in a while. Here\'s a special offer just for you.',
    recipientBreakdown: [
      { label: 'Inactive 30d', count: 120, color: '#ef4444' },
      { label: 'Inactive 60d', count: 80, color: '#f97316' },
    ],
  },
}

const statusConfig = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Paused' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
}

const statItems = [
  { key: 'sent' as const, label: 'Sent', icon: Send, color: '#3b82f6' },
  { key: 'delivered' as const, label: 'Delivered', icon: CheckCircle2, color: '#22c55e' },
  { key: 'read' as const, label: 'Read', icon: Eye, color: '#8b5cf6' },
  { key: 'replied' as const, label: 'Replied', icon: MessageSquare, color: '#ec4899' },
  { key: 'failed' as const, label: 'Failed', icon: XCircle, color: '#ef4444' },
]

export function CampaignDetailPage() {
  const { selectedCampaignId, setActiveFeature } = useAppStore()

  const campaign = selectedCampaignId ? campaignDetails[selectedCampaignId] : null

  if (!campaign) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto text-center">
        <p className="text-white/40 text-sm">Campaign not found</p>
        <button
          onClick={() => setActiveFeature(null)}
          className="mt-4 text-neon-blue text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    )
  }

  const config = statusConfig[campaign.status]
  const overallProgress = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0
  const maxRecipientCount = Math.max(...campaign.recipientBreakdown.map(r => r.count))

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setActiveFeature(null)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-white/95 truncate">{campaign.name}</h1>
          <p className="text-[10px] text-white/40">{campaign.date}</p>
        </div>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
          {config.label}
        </span>
      </div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-extrabold text-white/90">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/40">
          <span>{campaign.sent} sent</span>
          <span>{campaign.total - campaign.sent} remaining</span>
        </div>
      </motion.div>

      {/* Delivery Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Delivery Stats</h3>
        <div className="space-y-3">
          {statItems.map((stat) => {
            const value = campaign[stat.key]
            const percent = campaign.sent > 0 ? (value / campaign.sent) * 100 : 0
            return (
              <div key={stat.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                    <span className="text-xs text-white/60">{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/80">{value.toLocaleString()}</span>
                    <span className="text-[10px] text-white/30">{Math.round(percent)}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: stat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Message Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Message Preview</h3>
        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 max-w-[85%]">
          <p className="text-sm text-white/80 leading-relaxed">{campaign.message}</p>
          <p className="text-[9px] text-white/20 mt-2 text-right">10:42 AM</p>
        </div>
      </motion.div>

      {/* Recipient Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Recipient Breakdown</h3>
        <div className="space-y-3">
          {campaign.recipientBreakdown.map((group) => {
            const percent = maxRecipientCount > 0 ? (group.count / maxRecipientCount) * 100 : 0
            return (
              <div key={group.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                    <span className="text-xs text-white/60">{group.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white/80">{group.count.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: group.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2.5"
      >
        {campaign.status === 'active' && (
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-sm hover:bg-amber-500/15 transition-colors">
            <Pause className="w-4 h-4" /> Pause Campaign
          </button>
        )}
        {campaign.status === 'paused' && (
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm hover:bg-emerald-500/15 transition-colors">
            <Play className="w-4 h-4" /> Resume Campaign
          </button>
        )}
        <div className="flex gap-2.5">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-white/50 border border-white/10 font-semibold text-sm hover:bg-white/10 transition-colors">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-sm hover:bg-red-500/15 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-sm hover:bg-blue-500/15 transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </motion.div>
    </div>
  )
}

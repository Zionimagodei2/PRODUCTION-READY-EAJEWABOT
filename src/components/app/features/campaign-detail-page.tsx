'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from '@/lib/framer-shim'
import {
  ArrowLeft, Pause, Play, Copy, Trash2, Download,
  Send, CheckCircle2, Eye, MessageSquare, XCircle,
} from 'lucide-react'
import { useToastStore } from '@/store/toast-store'

interface CampaignDetail {
  id: string
  name: string
  status: string
  sent: number
  delivered: number
  replies: number
  total: number
  message: string
  date: string
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Paused' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
}

const statItems = [
  { key: 'sent', label: 'Sent', icon: Send, color: '#3b82f6' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: '#22c55e' },
  { key: 'replies', label: 'Replies', icon: MessageSquare, color: '#ec4899' },
]

export function CampaignDetailPage() {
  const { selectedCampaignId, setActiveFeature } = useAppStore()
  const { addToast } = useToastStore()
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!selectedCampaignId) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch('/api/campaigns')
        if (res.ok) {
          const campaigns = await res.json()
          const found = campaigns.find((c: CampaignDetail) => c.id === selectedCampaignId)
          setCampaign(found || null)
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchCampaign()
  }, [selectedCampaignId])

  // Pause/Resume campaign
  const handleStatusChange = async (newStatus: string) => {
    if (!campaign) return
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: newStatus }),
      })
      if (res.ok) {
        setCampaign({ ...campaign, status: newStatus })
        addToast({ type: 'success', title: `Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}` })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to update campaign' })
    }
  }

  // Delete campaign
  const handleDelete = async () => {
    if (!campaign) return
    try {
      const res = await fetch(`/api/campaigns?id=${campaign.id}`, { method: 'DELETE' })
      if (res.ok) {
        addToast({ type: 'success', title: 'Campaign deleted' })
        setActiveFeature(null)
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to delete campaign' })
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto text-center">
        <div className="skeleton-shimmer h-6 w-48 mx-auto rounded mb-3" />
        <div className="skeleton-shimmer h-4 w-32 mx-auto rounded" />
      </div>
    )
  }

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

  const config = statusConfig[campaign.status] || statusConfig.scheduled
  const overallProgress = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0
  const failed = campaign.sent > 0 ? campaign.sent - campaign.delivered : 0

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
          <p className="text-[10px] text-white/40">{formatDate(campaign.date)}</p>
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
            const value = campaign[stat.key as keyof CampaignDetail] as number
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
          {/* Failed stat */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                <span className="text-xs text-white/60">Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/80">{failed.toLocaleString()}</span>
                <span className="text-[10px] text-white/30">{campaign.sent > 0 ? Math.round((failed / campaign.sent) * 100) : 0}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#ef4444' }}
                initial={{ width: 0 }}
                animate={{ width: `${campaign.sent > 0 ? (failed / campaign.sent) * 100 : 0}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Message Preview */}
      {campaign.message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 space-y-3"
        >
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Message Preview</h3>
          <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 max-w-[85%]">
            <p className="text-sm text-white/80 leading-relaxed">{campaign.message}</p>
            <p className="text-[9px] text-white/20 mt-2 text-right">{formatDate(campaign.date)}</p>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2.5"
      >
        {campaign.status === 'active' && (
          <button 
            onClick={() => handleStatusChange('paused')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-sm hover:bg-amber-500/15 transition-colors"
          >
            <Pause className="w-4 h-4" /> Pause Campaign
          </button>
        )}
        {campaign.status === 'paused' && (
          <button 
            onClick={() => handleStatusChange('active')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm hover:bg-emerald-500/15 transition-colors"
          >
            <Play className="w-4 h-4" /> Resume Campaign
          </button>
        )}
        <div className="flex gap-2.5">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 text-white/50 border border-white/10 font-semibold text-sm hover:bg-white/10 transition-colors">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          <button 
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-sm hover:bg-red-500/15 transition-colors"
          >
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

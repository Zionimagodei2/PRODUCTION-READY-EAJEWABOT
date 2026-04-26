'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, CheckCircle2, Send, Pause, Play, Trash2, Copy, Search, ArrowDownUp, Megaphone, RotateCcw, Tag, Users, ShoppingBag, Gift, Zap, CalendarClock, Droplets, Layers, ChevronRight, ChevronLeft, RefreshCw, Timer, Eye, MessageCircle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { ListSkeleton } from '@/components/app/loading-skeleton'
import { useToastStore } from '@/store/toast-store'

interface Campaign {
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

// Campaign types with badge styling
type CampaignType = 'bulk' | 'sequential' | 'drip' | 'scheduled'
const campaignTypeConfig: Record<CampaignType, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  bulk: { color: 'text-blue-400', bg: 'bg-blue-500/12', border: 'border-blue-500/20', label: 'Bulk', icon: Layers },
  sequential: { color: 'text-amber-400', bg: 'bg-amber-500/12', border: 'border-amber-500/20', label: 'Sequential', icon: Zap },
  drip: { color: 'text-cyan-400', bg: 'bg-cyan-500/12', border: 'border-cyan-500/20', label: 'Drip', icon: Droplets },
  scheduled: { color: 'text-purple-400', bg: 'bg-purple-500/12', border: 'border-purple-500/20', label: 'Scheduled', icon: CalendarClock },
}

// Determine campaign type from name (heuristic)
function getCampaignType(name: string): CampaignType {
  const lower = name.toLowerCase()
  if (lower.includes('drip') || lower.includes('nurture')) return 'drip'
  if (lower.includes('seq') || lower.includes('follow')) return 'sequential'
  if (lower.includes('sched') || lower.includes('reminder')) return 'scheduled'
  return 'bulk'
}

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Paused' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
}

type SortBy = 'date' | 'name' | 'status'

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * target)
      setCount(start)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return count
}

// Donut chart component for campaign status distribution
function CampaignDonutChart({ campaigns }: { campaigns: Campaign[] }) {
  const statusCounts = {
    active: campaigns.filter(c => c.status === 'active').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
  }
  const total = campaigns.length
  const colors = { active: '#22c55e', scheduled: '#3b82f6', completed: '#8b5cf6', paused: '#f59e0b', failed: '#ef4444' }

  const size = 56
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="ring-progress">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="rgba(255,255,255,0.06)" />
        {Object.entries(statusCounts).map(([status, count]) => {
          if (count === 0) return null
          const percentage = count / total
          const dashLength = percentage * circumference
          const gap = circumference - dashLength
          const element = (
            <circle
              key={status}
              cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
              fill="none"
              stroke={colors[status as keyof typeof colors]}
              strokeDasharray={`${dashLength} ${gap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          )
          currentOffset += dashLength
          return element
        })}
      </svg>
      <span className="absolute text-[9px] font-bold text-white/70">{total}</span>
    </div>
  )
}

// Campaign category icon
function CampaignCategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()
  if (lower.includes('launch') || lower.includes('promo') || lower.includes('sale')) return <Megaphone className="w-3 h-3" />
  if (lower.includes('newsletter') || lower.includes('digest')) return <Send className="w-3 h-3" />
  if (lower.includes('greeting') || lower.includes('holiday')) return <Gift className="w-3 h-3" />
  if (lower.includes('follow')) return <Users className="w-3 h-3" />
  if (lower.includes('shop') || lower.includes('product')) return <ShoppingBag className="w-3 h-3" />
  return <Tag className="w-3 h-3" />
}

// Helper to get config color hex
function getConfigHex(status: string): string {
  const colorMap: Record<string, string> = {
    active: '#22c55e',
    scheduled: '#3b82f6',
    completed: '#8b5cf6',
    paused: '#f59e0b',
    failed: '#ef4444',
  }
  return colorMap[status] || '#3b82f6'
}

// Segmented progress bar component: Sent → Delivered → Read → Replied
function SegmentedProgressBar({ sent, delivered, replies, total }: { sent: number; delivered: number; replies: number; total: number }) {
  if (total === 0) return null

  const sentPct = (sent / total) * 100
  const deliveredPct = (delivered / total) * 100
  const repliesPct = (replies / total) * 100
  // "Read" is simulated as between delivered and replies
  const readPct = Math.min(deliveredPct * 0.85, deliveredPct - repliesPct * 0.3)

  return (
    <div className="space-y-1.5">
      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sentPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full bg-blue-500/80 rounded-l-full"
          title={`Sent: ${sent}`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(deliveredPct - sentPct, 0)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full bg-emerald-500/80"
          title={`Delivered: ${delivered}`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(readPct, 0)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="h-full bg-purple-500/80"
          title={`Read: ~${Math.round(readPct * total / 100)}`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${repliesPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 }}
          className="h-full bg-amber-500/80 rounded-r-full"
          title={`Replied: ${replies}`}
        />
      </div>
      <div className="flex items-center gap-3 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> <span className="text-white/30">{sent} sent</span></span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> <span className="text-white/30">{delivered} delivered</span></span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> <span className="text-white/30">~{Math.round(readPct * total / 100)} read</span></span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> <span className="text-white/30">{replies} replied</span></span>
      </div>
    </div>
  )
}

// Quick Create Wizard steps
type WizardStep = 'type' | 'message' | 'audience' | 'schedule'

export function CampaignsPage() {
  const { setActiveFeature, setSelectedCampaignId } = useAppStore()
  const { addToast } = useToastStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Quick create wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>('type')
  const [wizardData, setWizardData] = useState({
    type: '' as CampaignType | '',
    name: '',
    message: '',
    audience: 'all-contacts',
    scheduleDate: '',
    scheduleTime: '',
  })

  // Fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to load campaigns' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleCampaignClick = (id: string) => {
    setSelectedCampaignId(id)
    setActiveFeature('campaign-detail')
  }

  const filteredAndSorted = campaigns
    .filter(c => {
      const matchesFilter = filter === 'all' || c.status === filter
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'status': return a.status.localeCompare(b.status)
        case 'date': default: return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  // Derived stats
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length
  const totalMessagesSent = campaigns.reduce((a, c) => a + c.sent, 0)

  const animTotal = useAnimatedCounter(totalCampaigns)
  const animActive = useAnimatedCounter(activeCampaigns)
  const animCompleted = useAnimatedCounter(completedCampaigns)
  const animScheduled = useAnimatedCounter(scheduledCampaigns)
  const animSent = useAnimatedCounter(totalMessagesSent)

  const handleCreate = async () => {
    if (!wizardData.name.trim()) return
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wizardData.name.trim(),
          total: 100,
          status: wizardData.scheduleDate ? 'scheduled' : 'active',
          message: wizardData.message,
        }),
      })
      if (res.ok) {
        const newCampaign = await res.json()
        setCampaigns([newCampaign, ...campaigns])
        addToast({ type: 'success', title: 'Campaign created' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to create campaign' })
    }
    // Reset wizard
    setWizardData({ type: '', name: '', message: '', audience: 'all-contacts', scheduleDate: '', scheduleTime: '' })
    setWizardStep('type')
    setShowWizard(false)
  }

  // Pause/Resume campaign
  const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
        addToast({ type: 'success', title: `Campaign ${newStatus === 'paused' ? 'paused' : 'resumed'}` })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to update campaign' })
    }
  }

  // Retry failed campaign
  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      })
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c))
        addToast({ type: 'success', title: 'Campaign retry started' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to retry campaign' })
    }
  }

  // Delete campaign
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id))
        addToast({ type: 'success', title: 'Campaign deleted' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to delete campaign' })
    }
    setDeletingId(null)
  }

  const handleResetFilters = () => {
    setFilter('all')
    setSearchQuery('')
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().split('T')[0]
    } catch {
      return dateStr
    }
  }

  // Format last activity
  const formatLastActivity = (dateStr: string): string => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffHours / 24)
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  // Estimated delivery time
  const getEstimatedDelivery = (campaign: Campaign): string => {
    if (campaign.status === 'completed') return 'Completed'
    if (campaign.status === 'scheduled') return `Starts ${formatDate(campaign.date)}`
    if (campaign.status === 'paused') return 'Paused'
    if (campaign.status === 'failed') return 'Failed'
    const remaining = campaign.total - campaign.sent
    if (remaining <= 0) return 'Finishing...'
    const rate = campaign.sent > 0 ? 5 : 10 // messages per minute
    const mins = Math.ceil(remaining / rate)
    if (mins < 60) return `~${mins}m remaining`
    return `~${Math.ceil(mins / 60)}h remaining`
  }

  // Wizard step config
  const wizardSteps: { key: WizardStep; label: string }[] = [
    { key: 'type', label: 'Type' },
    { key: 'message', label: 'Message' },
    { key: 'audience', label: 'Audience' },
    { key: 'schedule', label: 'Schedule' },
  ]
  const currentStepIndex = wizardSteps.findIndex(s => s.key === wizardStep)

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Campaign Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-inset rounded-2xl p-4"
        style={{ boxShadow: '0 0 20px rgba(59,130,246,0.08), 0 0 40px rgba(139,92,246,0.04)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
            <Megaphone className="w-3.5 h-3.5 text-neon-blue" />
          </div>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Campaign Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex-1">
              <p className="text-lg font-extrabold text-neon-blue">{animTotal}</p>
              <p className="text-[10px] text-white/40 font-medium">Total Campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <CampaignDonutChart campaigns={campaigns} />
            <div className="flex-1">
              <p className="text-lg font-extrabold text-neon-green">{animActive}</p>
              <p className="text-[10px] text-white/40 font-medium">Active</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
            <p className="text-sm font-extrabold text-purple-400">{animCompleted}</p>
            <p className="text-[9px] text-white/35 font-medium">Completed</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
            <p className="text-sm font-extrabold text-blue-400">{animScheduled}</p>
            <p className="text-[9px] text-white/35 font-medium">Scheduled</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
            <p className="text-sm font-extrabold text-cyan-400">{animSent.toLocaleString()}</p>
            <p className="text-[9px] text-white/35 font-medium">Msgs Sent</p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full bg-white/5 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50 transition-all duration-200"
        />
      </div>

      {/* Filter Tabs + Sort */}
      <div className="flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {['all', 'active', 'scheduled', 'completed', 'paused', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-white/40" />
          </button>
          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-32 rounded-xl bg-[#14141f] border border-white/10 shadow-xl overflow-hidden z-20"
              >
                {([['date', 'Date'], ['name', 'Name'], ['status', 'Status']] as [SortBy, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSortBy(value); setShowSortDropdown(false) }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors ${
                      sortBy === value ? 'text-neon-blue bg-blue-500/10' : 'text-white/50 hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Create Wizard */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl overflow-hidden border border-neon-blue/20 neon-glow-blue"
          >
            {/* Step progress indicator */}
            <div className="flex items-center px-4 pt-4 pb-2">
              {wizardSteps.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      i <= currentStepIndex
                        ? 'bg-neon-blue/25 text-neon-blue border border-neon-blue/40'
                        : 'bg-white/5 text-white/20 border border-white/10'
                    }`}>
                      {i < currentStepIndex ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-[9px] font-medium ${i <= currentStepIndex ? 'text-white/60' : 'text-white/20'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < wizardSteps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-1 rounded-full transition-all ${
                      i < currentStepIndex ? 'bg-neon-blue/40' : 'bg-white/5'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 pt-2 space-y-3">
              {/* Step 1: Select Type */}
              {wizardStep === 'type' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-white/80">Select Campaign Type</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(campaignTypeConfig) as [CampaignType, typeof campaignTypeConfig[CampaignType]][]).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setWizardData(prev => ({ ...prev, type: key }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            wizardData.type === key
                              ? `${config.bg} ${config.border} ${config.color}`
                              : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <p className="text-xs font-semibold">{config.label}</p>
                          <p className="text-[9px] text-white/30 mt-0.5">
                            {key === 'bulk' && 'Send to all at once'}
                            {key === 'sequential' && 'Timed sequence'}
                            {key === 'drip' && 'Gradual nurturing'}
                            {key === 'scheduled' && 'Set date & time'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                  <input
                    value={wizardData.name}
                    onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Campaign name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
                  />
                </motion.div>
              )}

              {/* Step 2: Add Message */}
              {wizardStep === 'message' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-white/80">Compose Message</h3>
                  <textarea
                    value={wizardData.message}
                    onChange={(e) => setWizardData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your campaign message... Use {name}, {company} for personalization"
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50 resize-none"
                  />
                  <div className="flex gap-1.5">
                    <button className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/30 border border-white/[0.06] hover:bg-white/10 transition-colors">
                      {'{name}'}
                    </button>
                    <button className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/30 border border-white/[0.06] hover:bg-white/10 transition-colors">
                      {'{company}'}
                    </button>
                    <button className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/30 border border-white/[0.06] hover:bg-white/10 transition-colors">
                      {'{date}'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Audience */}
              {wizardStep === 'audience' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-white/80">Select Audience</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'all-contacts', label: 'All Contacts', count: '1284 contacts' },
                      { value: 'active-only', label: 'Active Only', count: '856 contacts' },
                      { value: 'vip', label: 'VIP Customers', count: '24 contacts' },
                      { value: 'new-leads', label: 'New Leads', count: '56 contacts' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWizardData(prev => ({ ...prev, audience: option.value }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          wizardData.audience === option.value
                            ? 'bg-neon-blue/10 border-neon-blue/30 text-white/80'
                            : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                        }`}
                      >
                        <Users className="w-4 h-4 text-white/30" />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-semibold">{option.label}</p>
                          <p className="text-[10px] text-white/30">{option.count}</p>
                        </div>
                        {wizardData.audience === option.value && (
                          <div className="w-4 h-4 rounded-full bg-neon-blue flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Schedule */}
              {wizardStep === 'schedule' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-sm font-semibold text-white/80">Schedule Campaign</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWizardData(prev => ({ ...prev, scheduleDate: '', scheduleTime: '' }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        !wizardData.scheduleDate
                          ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Zap className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs font-semibold">Send Now</p>
                      <p className="text-[9px] text-white/30">Immediate delivery</p>
                    </button>
                    <button
                      onClick={() => setWizardData(prev => ({ ...prev, scheduleDate: new Date().toISOString().split('T')[0] }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        wizardData.scheduleDate
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                      }`}
                    >
                      <CalendarClock className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs font-semibold">Schedule</p>
                      <p className="text-[9px] text-white/30">Set date & time</p>
                    </button>
                  </div>
                  {wizardData.scheduleDate && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={wizardData.scheduleDate}
                        onChange={(e) => setWizardData(prev => ({ ...prev, scheduleDate: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
                      />
                      <input
                        type="time"
                        value={wizardData.scheduleTime}
                        onChange={(e) => setWizardData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-blue/50"
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-2 pt-1">
                {currentStepIndex > 0 && (
                  <button
                    onClick={() => setWizardStep(wizardSteps[currentStepIndex - 1].key)}
                    className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                )}
                <div className="flex-1" />
                {currentStepIndex < wizardSteps.length - 1 ? (
                  <button
                    onClick={() => setWizardStep(wizardSteps[currentStepIndex + 1].key)}
                    disabled={wizardStep === 'type' && (!wizardData.type || !wizardData.name.trim())}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      (wizardStep === 'type' && (!wizardData.type || !wizardData.name.trim()))
                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                        : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30'
                    }`}
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-neon-blue/25 to-neon-purple/25 text-white border border-neon-blue/30 rounded-lg text-sm font-medium hover:from-neon-blue/35 hover:to-neon-purple/35 transition-all"
                  >
                    <Send className="w-3 h-3" /> {wizardData.scheduleDate ? 'Schedule' : 'Launch'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowWizard(false)
                    setWizardStep('type')
                    setWizardData({ type: '', name: '', message: '', audience: 'all-contacts', scheduleDate: '', scheduleTime: '' })
                  }}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign List */}
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : filteredAndSorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-sm font-bold text-white/50 mb-1">No campaigns found</h3>
          <p className="text-xs text-subtitle mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-blue/15 text-neon-blue border border-neon-blue/25 text-xs font-semibold hover:bg-neon-blue/25 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {filteredAndSorted.map((campaign, i) => {
            const config = statusConfig[campaign.status] || statusConfig.scheduled
            const configHex = getConfigHex(campaign.status)
            const campaignType = getCampaignType(campaign.name)
            const typeConfig = campaignTypeConfig[campaignType]
            const TypeIcon = typeConfig.icon

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCampaignClick(campaign.id)}
                className="glass-card rounded-xl p-4 space-y-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 hover:border-white/15 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Campaign type icon */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${configHex}15`, border: `1px solid ${configHex}25` }}
                    >
                      <div className={config.color}><CampaignCategoryIcon name={campaign.name} /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90 truncate">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-white/30">{formatDate(campaign.date)}</p>
                        <span className="text-[9px] text-white/15">•</span>
                        <p className="text-[10px] text-white/25 flex items-center gap-0.5">
                          <Timer className="w-2.5 h-2.5" /> {getEstimatedDelivery(campaign)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Campaign type badge */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} border flex items-center gap-0.5`}>
                      <TypeIcon className="w-2.5 h-2.5" /> {typeConfig.label}
                    </span>
                    {/* Status badge */}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Segmented progress bar */}
                <SegmentedProgressBar
                  sent={campaign.sent}
                  delivered={campaign.delivered}
                  replies={campaign.replies}
                  total={campaign.total}
                />

                {/* Stats row with delivery % */}
                <div className="flex gap-4 text-[10px]">
                  {campaign.sent > 0 && (
                    <span className="text-white/30">
                      <CheckCircle2 className="w-3 h-3 inline mr-1 text-neon-green" />
                      {Math.round((campaign.delivered / campaign.sent) * 100)}% delivered
                    </span>
                  )}
                  <span className="text-white/30 flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {campaign.sent > 0 ? Math.round(campaign.delivered * 0.85) : 0} read
                  </span>
                  <span className="text-white/30 flex items-center gap-0.5">
                    <MessageCircle className="w-3 h-3" /> {campaign.replies} replies
                  </span>
                </div>

                {/* Last activity timestamp */}
                <div className="flex items-center gap-1 text-[9px] text-white/20">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Last activity: {formatLastActivity(campaign.updatedAt)}</span>
                </div>

                {/* Action buttons directly on card */}
                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {campaign.status === 'active' && (
                    <button
                      onClick={(e) => handleStatusChange(campaign.id, 'paused', e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] hover:bg-amber-500/20 transition-colors"
                    >
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={(e) => handleStatusChange(campaign.id, 'active', e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] hover:bg-emerald-500/20 transition-colors"
                    >
                      <Play className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {campaign.status === 'failed' && (
                    <button
                      onClick={(e) => handleRetry(campaign.id, e)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] hover:bg-blue-500/20 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  )}
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-white/40 border border-white/10 text-[10px] hover:bg-white/10 transition-colors">
                    <Copy className="w-3 h-3" /> Duplicate
                  </button>
                  <button
                    onClick={(e) => handleDelete(campaign.id, e)}
                    disabled={deletingId === campaign.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] hover:bg-red-500/20 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {!showWizard && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowWizard(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg neon-glow-blue z-30 hover:scale-105 transition-transform animate-fab-pulse"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

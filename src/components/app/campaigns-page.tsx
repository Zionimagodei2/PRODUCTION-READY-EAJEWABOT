'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, CheckCircle2, XCircle, Send, MoreVertical, Pause, Play, Trash2, Copy, Search, ArrowDownUp, Megaphone, RotateCcw, Tag, Users, ShoppingBag, Gift } from 'lucide-react'
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

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Paused' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
}

type SortBy = 'date' | 'name' | 'status'

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
        <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="rgba(255,255,255,0.06)" />
        {Object.entries(statusCounts).map(([status, count]) => {
          if (count === 0) return null
          const percentage = count / total
          const dashLength = percentage * circumference
          const gap = circumference - dashLength
          const element = (
            <circle
              key={status}
              cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth}
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

export function CampaignsPage() {
  const { setActiveFeature, setSelectedCampaignId } = useAppStore()
  const { addToast } = useToastStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTotal, setNewTotal] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          total: parseInt(newTotal) || 100,
          status: 'scheduled',
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
    setNewName('')
    setNewTotal('')
    setShowCreate(false)
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

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Stats Row - Enhanced with donut chart and accent borders */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3.5 stat-card-blue">
          <p className="text-[11px] text-white/55 font-semibold">Active Campaigns</p>
          <p className="text-2xl font-extrabold text-neon-blue mt-1 animate-number-pop">{campaigns.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="glass-card rounded-xl p-3.5 stat-card-green flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-white/55 font-semibold">Total Sent</p>
            <p className="text-2xl font-extrabold text-neon-green mt-1 animate-number-pop">{campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString()}</p>
          </div>
          <CampaignDonutChart campaigns={campaigns} />
        </div>
      </div>

      {/* Campaign Summary - real data from DB */}
      <div className="glass-card rounded-xl p-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-white/40 font-semibold">Total Campaigns</p>
          <p className="text-[11px] text-white/70 font-bold mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} ({campaigns.filter(c => c.status === 'active').length} active)
          </p>
        </div>
        <CampaignDonutChart campaigns={campaigns} />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search campaigns..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50 transition-colors"
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

      {/* Create Campaign */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-4 space-y-3 border border-neon-blue/20 neon-glow-blue overflow-hidden"
          >
            <h3 className="text-sm font-semibold text-white/80">New Campaign</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Campaign name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
            />
            <input
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
              placeholder="Total recipients"
              type="number"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg px-3 py-2 text-sm font-medium hover:bg-neon-blue/30 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign List - with skeleton loading */}
      {isLoading ? (
        <ListSkeleton count={3} />
      ) : filteredAndSorted.length === 0 ? (
        /* Empty state when filters return no results */
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
            const progress = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0
            const configHex = getConfigHex(campaign.status)
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
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${configHex}15`, border: `1px solid ${configHex}25` }}
                    >
                      <div className={config.color}><CampaignCategoryIcon name={campaign.name} /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white/90 truncate">{campaign.name}</h3>
                      <p className="text-[10px] text-white/30 mt-0.5">{formatDate(campaign.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {campaign.sent > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                        {Math.round((campaign.delivered / campaign.sent) * 100)}% delivered
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
                      {config.label}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar - taller h-2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>{campaign.sent} / {campaign.total} sent</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${campaign.status === 'active' ? 'progress-shimmer' : ''}`}
                      style={{ width: `${progress}%`, background: campaign.status === 'active' 
                        ? 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)' 
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6)' 
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-[10px]">
                  <span className="text-white/30">
                    <CheckCircle2 className="w-3 h-3 inline mr-1 text-neon-green" />
                    {campaign.delivered} delivered
                  </span>
                  <span className="text-white/30">
                    <Send className="w-3 h-3 inline mr-1 text-neon-purple" />
                    {campaign.replies} replies
                  </span>
                </div>

                {/* Actions */}
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
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg neon-glow-blue z-30 hover:scale-105 transition-transform animate-fab-pulse"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

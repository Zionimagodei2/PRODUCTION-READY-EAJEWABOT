'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, CheckCircle2, XCircle, Send, MoreVertical, Pause, Play, Trash2, Copy } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: 'active' | 'scheduled' | 'completed' | 'paused' | 'failed'
  sent: number
  delivered: number
  replies: number
  total: number
  date: string
}

const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Product Launch Promo', status: 'active', sent: 452, delivered: 410, replies: 38, total: 1000, date: '2024-01-15' },
  { id: '2', name: 'Weekly Newsletter', status: 'scheduled', sent: 0, delivered: 0, replies: 0, total: 500, date: '2024-01-16' },
  { id: '3', name: 'Holiday Greetings', status: 'completed', sent: 800, delivered: 756, replies: 92, total: 800, date: '2024-01-10' },
  { id: '4', name: 'Flash Sale Alert', status: 'paused', sent: 230, delivered: 210, replies: 15, total: 600, date: '2024-01-14' },
  { id: '5', name: 'Customer Follow-up', status: 'failed', sent: 50, delivered: 45, replies: 3, total: 200, date: '2024-01-13' },
]

const statusConfig = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Active' },
  scheduled: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Scheduled' },
  completed: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Completed' },
  paused: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Paused' },
  failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
}

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTotal, setNewTotal] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const filteredCampaigns = filter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.status === filter)

  const handleCreate = () => {
    if (!newName.trim()) return
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: newName.trim(),
      status: 'scheduled',
      sent: 0,
      delivered: 0,
      replies: 0,
      total: parseInt(newTotal) || 100,
      date: new Date().toISOString().split('T')[0],
    }
    setCampaigns([newCampaign, ...campaigns])
    setNewName('')
    setNewTotal('')
    setShowCreate(false)
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-white/40">Active Campaigns</p>
          <p className="text-2xl font-bold text-neon-blue mt-1">{campaigns.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-white/40">Total Sent</p>
          <p className="text-2xl font-bold text-neon-green mt-1">{campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

      {/* Campaign List */}
      <div className="space-y-2.5">
        {filteredCampaigns.map((campaign, i) => {
          const config = statusConfig[campaign.status]
          const progress = campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white/90 truncate">{campaign.name}</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">{campaign.date}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
                  {config.label}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-white/30">
                  <span>{campaign.sent} / {campaign.total} sent</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-500"
                    style={{ width: `${progress}%` }}
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
              <div className="flex gap-2 pt-1">
                {campaign.status === 'active' && (
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] hover:bg-amber-500/20 transition-colors">
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] hover:bg-emerald-500/20 transition-colors">
                    <Play className="w-3 h-3" /> Resume
                  </button>
                )}
                <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-white/40 border border-white/10 text-[10px] hover:bg-white/10 transition-colors">
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] hover:bg-red-500/20 transition-colors ml-auto">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg neon-glow-blue z-30 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

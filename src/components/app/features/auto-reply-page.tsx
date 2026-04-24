'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Plus, Trash2, Clock, CheckCircle2, ArrowLeft, Zap, Hash, ToggleLeft } from 'lucide-react'
import { useToastStore } from '@/store/toast-store'

interface AutoReplyRule {
  id: string
  trigger: string
  response: string
  active: boolean
  matchType: string
  createdAt: string
}

export function AutoReplyPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [rules, setRules] = useState<AutoReplyRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTrigger, setNewTrigger] = useState('')
  const [newResponse, setNewResponse] = useState('')
  const [newMatchType, setNewMatchType] = useState<string>('contains')

  // Fetch rules from API
  const fetchRules = async () => {
    try {
      const res = await fetch('/api/auto-reply')
      if (res.ok) {
        const data = await res.json()
        setRules(data)
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to load rules' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const addRule = async () => {
    if (!newTrigger.trim() || !newResponse.trim()) return
    try {
      const res = await fetch('/api/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: newTrigger.trim(),
          response: newResponse.trim(),
          matchType: newMatchType,
          active: true,
        }),
      })
      if (res.ok) {
        const newRule = await res.json()
        setRules([newRule, ...rules])
        addToast({ type: 'success', title: 'Rule added' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to add rule' })
    }
    setNewTrigger('')
    setNewResponse('')
    setShowAdd(false)
  }

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return
    try {
      const res = await fetch('/api/auto-reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !rule.active }),
      })
      if (res.ok) {
        setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
        addToast({ type: 'success', title: `Rule ${!rule.active ? 'activated' : 'deactivated'}` })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to toggle rule' })
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/auto-reply?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRules(rules.filter(r => r.id !== id))
        addToast({ type: 'success', title: 'Rule deleted' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to delete rule' })
    }
  }

  const matchTypeLabel = (type: string) => {
    switch(type) {
      case 'contains': return 'Contains'
      case 'exact': return 'Exact'
      case 'starts_with': return 'Starts with'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="skeleton-shimmer h-6 w-32 mx-auto rounded mb-3" />
          <div className="skeleton-shimmer h-4 w-48 mx-auto rounded" />
        </div>
      </div>
    )
  }

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
            <MessageSquare className="w-5 h-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Auto Reply</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Set up smart automated responses</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-3 text-center card-hover-lift" 
          style={{ borderLeft: '2px solid #3b82f6' }}
        >
          <p className="text-lg font-extrabold text-blue-400">{rules.filter(r => r.active).length}</p>
          <p className="text-[10px] text-white/45 font-semibold">Active Rules</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-3 text-center card-hover-lift" 
          style={{ borderLeft: '2px solid #8b5cf6' }}
        >
          <p className="text-lg font-extrabold text-purple-400">{rules.length}</p>
          <p className="text-[10px] text-white/45 font-semibold">Total Rules</p>
        </motion.div>
      </div>

      {/* Add Rule Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-4 border border-blue-500/20 overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400/70" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">New Rule</span>
            </div>
            <div>
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Match Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['contains', 'exact', 'starts_with'] as const).map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => setNewMatchType(type)}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2.5 rounded-xl text-[10px] font-semibold border transition-all duration-200 ${
                      newMatchType === type
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {matchTypeLabel(type)}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Trigger Keyword</label>
              <input
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder="e.g. hello, price, hours"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Auto Reply Message</label>
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Type the automatic response..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2">
              <motion.button 
                onClick={addRule} 
                whileTap={{ scale: 0.97 }}
                className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl py-2.5 text-sm font-bold hover:bg-blue-500/25 transition-colors"
                style={{ boxShadow: '0 0 15px rgba(59,130,246,0.1)' }}
              >
                Add Rule
              </motion.button>
              <motion.button 
                onClick={() => setShowAdd(false)} 
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <ToggleLeft className="w-4 h-4 text-blue-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Your Rules</span>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
        </div>
        {rules.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-white/10 mb-3" />
            <p className="text-sm text-white/40 font-medium">No auto-reply rules yet</p>
            <p className="text-xs text-white/20 mt-1">Create a rule to automatically respond to messages</p>
          </div>
        ) : null}
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-2xl p-4 space-y-2.5 transition-all card-hover-lift ${!rule.active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/15 font-bold uppercase tracking-wider">
                  {matchTypeLabel(rule.matchType)}
                </span>
                <span className="text-sm font-bold text-white/85 font-mono">&quot;{rule.trigger}&quot;</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => toggleRule(rule.id)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${rule.active ? 'bg-blue-500' : 'bg-white/10'}`}
                  style={rule.active ? { boxShadow: '0 0 12px rgba(59,130,246,0.3)' } : undefined}
                >
                  <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                    style={{ transform: rule.active ? 'translateX(20px)' : 'translateX(2px)', width: '18px', height: '18px' }}
                  />
                </motion.button>
                <motion.button 
                  onClick={() => deleteRule(rule.id)} 
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400" />
                </motion.button>
              </div>
            </div>
            <p className="text-[11px] text-white/45 leading-relaxed">{rule.response}</p>
          </motion.div>
        ))}
      </div>

      {/* FAB */}
      {!showAdd && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowAdd(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg z-30 animate-fab-pulse"
          style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.15)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

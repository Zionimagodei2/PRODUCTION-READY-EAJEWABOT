'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Trash2, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AutoReplyRule {
  id: string
  trigger: string
  response: string
  active: boolean
  matchType: 'contains' | 'exact' | 'starts_with'
}

export function AutoReplyPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([
    { id: '1', trigger: 'hello', response: 'Hi there! Thanks for reaching out. We\'ll get back to you shortly.', active: true, matchType: 'contains' },
    { id: '2', trigger: 'price', response: 'Our pricing starts at $29/mo. Would you like a custom quote?', active: true, matchType: 'contains' },
    { id: '3', trigger: 'hours', response: 'We\'re available Mon-Fri, 9AM-6PM EST.', active: false, matchType: 'exact' },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [newTrigger, setNewTrigger] = useState('')
  const [newResponse, setNewResponse] = useState('')
  const [newMatchType, setNewMatchType] = useState<'contains' | 'exact' | 'starts_with'>('contains')

  const addRule = () => {
    if (!newTrigger.trim() || !newResponse.trim()) return
    setRules([...rules, {
      id: Date.now().toString(),
      trigger: newTrigger.trim(),
      response: newResponse.trim(),
      active: true,
      matchType: newMatchType,
    }])
    setNewTrigger('')
    setNewResponse('')
    setShowAdd(false)
  }

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id))
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-blue border border-blue-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
            <MessageSquare className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90">Auto Reply</h2>
            <p className="text-[10px] text-white/40">Set up smart automated responses</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-blue">{rules.filter(r => r.active).length}</p>
          <p className="text-[10px] text-white/40">Active Rules</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-purple">{rules.length}</p>
          <p className="text-[10px] text-white/40">Total Rules</p>
        </div>
      </div>

      {/* Add Rule Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card rounded-xl p-4 space-y-3 border border-neon-blue/20 neon-glow-blue overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-white/80">New Rule</h3>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Match Type</label>
            <div className="flex gap-2">
              {(['contains', 'exact', 'starts_with'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNewMatchType(type)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                    newMatchType === type
                      ? 'bg-neon-blue/15 text-neon-blue border-neon-blue/25'
                      : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {type === 'contains' ? 'Contains' : type === 'exact' ? 'Exact' : 'Starts with'}
                </button>
              ))}
            </div>
          </div>
          <input
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            placeholder="Trigger keyword or phrase"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40"
          />
          <textarea
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Auto reply message..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={addRule} className="flex-1 bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg py-2 text-sm font-medium hover:bg-neon-blue/30 transition-colors">Add Rule</button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Rules List */}
      <div className="space-y-2.5">
        {rules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-4 space-y-2 transition-all ${!rule.active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/15 font-mono">
                  {rule.matchType}
                </span>
                <span className="text-sm font-semibold text-white/80 font-mono">&quot;{rule.trigger}&quot;</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative ${rule.active ? 'bg-neon-blue' : 'bg-white/10'}`}
                >
                  <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all"
                    style={{ transform: rule.active ? 'translateX(14px)' : 'translateX(2px)' }}
                  />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400/50 hover:text-red-400" />
                </button>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">{rule.response}</p>
          </motion.div>
        ))}
      </div>

      {/* FAB */}
      {!showAdd && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg neon-glow-blue z-30 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

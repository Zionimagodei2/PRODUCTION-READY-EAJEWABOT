'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Plus, Trash2, GripVertical, MessageSquare, ArrowRight, ArrowLeft, Save, Zap, GitBranch } from 'lucide-react'

interface FlowNode {
  id: string
  type: 'message' | 'condition' | 'action'
  content: string
  next?: string
}

interface ChatbotFlow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  active: boolean
  triggers: number
}

export function ChatbotPage() {
  const { goBack } = useAppStore()
  const [flows, setFlows] = useState<ChatbotFlow[]>([
    {
      id: '1',
      name: 'Welcome Flow',
      description: 'Greet new customers and collect their needs',
      active: true,
      triggers: 234,
      nodes: [
        { id: 'n1', type: 'message', content: 'Welcome to our store! How can we help you today?' },
        { id: 'n2', type: 'condition', content: 'User responds with keyword' },
        { id: 'n3', type: 'action', content: 'Route to appropriate department' },
      ]
    },
    {
      id: '2',
      name: 'FAQ Bot',
      description: 'Auto-answer frequently asked questions',
      active: true,
      triggers: 89,
      nodes: [
        { id: 'n1', type: 'message', content: 'Hi! I can help with pricing, hours, or shipping info.' },
        { id: 'n2', type: 'condition', content: 'Detect intent from response' },
        { id: 'n3', type: 'message', content: 'Send relevant FAQ answer' },
      ]
    },
    {
      id: '3',
      name: 'Order Status',
      description: 'Check and report order status automatically',
      active: false,
      triggers: 0,
      nodes: [
        { id: 'n1', type: 'message', content: 'Please share your order number.' },
        { id: 'n2', type: 'action', content: 'Look up order in database' },
      ]
    },
  ])

  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const toggleFlow = (id: string) => {
    setFlows(flows.map(f => f.id === id ? { ...f, active: !f.active } : f))
  }

  const deleteFlow = (id: string) => {
    setFlows(flows.filter(f => f.id !== id))
    if (selectedFlow === id) setSelectedFlow(null)
  }

  const createFlow = () => {
    if (!newName.trim()) return
    setFlows([...flows, {
      id: Date.now().toString(),
      name: newName.trim(),
      description: newDesc.trim() || 'New chatbot flow',
      active: false,
      triggers: 0,
      nodes: [
        { id: '1', type: 'message', content: 'Hello! How can I assist you?' },
      ]
    }])
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  const selected = flows.find(f => f.id === selectedFlow)
  const nodeColors = {
    message: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    condition: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    action: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: <Bot className="w-3.5 h-3.5" /> },
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
            <Bot className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Chatbot Builder</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">AI-powered conversation flows</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { value: flows.length, label: 'Flows', color: '#8b5cf6', icon: <GitBranch className="w-4 h-4" /> },
          { value: flows.filter(f => f.active).length, label: 'Active', color: '#22c55e', icon: <Zap className="w-4 h-4" /> },
          { value: flows.reduce((a, f) => a + f.triggers, 0), label: 'Triggers', color: '#3b82f6', icon: <MessageSquare className="w-4 h-4" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-3 text-center card-hover-lift"
            style={{ borderLeft: `2px solid ${stat.color}` }}
          >
            <div
              className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1.5"
              style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-lg font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[9px] text-white/40 font-semibold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Create Flow */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-4 border border-purple-500/20 overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400/70" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">New Flow</span>
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Flow name"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
            <div className="flex gap-2">
              <motion.button 
                onClick={createFlow} 
                whileTap={{ scale: 0.97 }}
                className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl py-2.5 text-sm font-bold hover:bg-purple-500/25 transition-colors"
                style={{ boxShadow: '0 0 15px rgba(139,92,246,0.1)' }}
              >
                Create Flow
              </motion.button>
              <motion.button 
                onClick={() => setShowCreate(false)} 
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flow List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Your Flows</span>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>
        <div className="space-y-2.5">
          {flows.map((flow, i) => (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl overflow-hidden transition-all card-hover-lift ${selectedFlow === flow.id ? 'border border-purple-500/30' : ''}`}
              style={selectedFlow === flow.id ? { boxShadow: '0 0 20px rgba(139,92,246,0.1)' } : undefined}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setSelectedFlow(selectedFlow === flow.id ? null : flow.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/15">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white/90">{flow.name}</h3>
                      <p className="text-[10px] text-white/35">{flow.nodes.length} nodes • {flow.triggers} triggers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); toggleFlow(flow.id) }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-5.5 rounded-full transition-colors relative ${flow.active ? 'bg-purple-500' : 'bg-white/10'}`}
                      style={flow.active ? { boxShadow: '0 0 12px rgba(139,92,246,0.3)' } : undefined}
                    >
                      <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                        style={{ transform: flow.active ? 'translateX(20px)' : 'translateX(2px)', width: '18px', height: '18px' }}
                      />
                    </motion.button>
                  </div>
                </div>
                <p className="text-[11px] text-white/40">{flow.description}</p>
              </div>

              {/* Expanded flow detail */}
              <AnimatePresence>
                {selectedFlow === flow.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/[0.04] p-4 space-y-2"
                  >
                    {flow.nodes.map((node, ni) => {
                      const colors = nodeColors[node.type]
                      return (
                        <motion.div 
                          key={node.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ni * 0.05 }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:brightness-110`}
                        >
                          <GripVertical className="w-3 h-3 text-white/15 cursor-grab" />
                          <div className={colors.text}>{colors.icon}</div>
                          <span className="text-[11px] text-white/65 flex-1">{node.content}</span>
                        </motion.div>
                      )
                    })}
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id) }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 text-[10px] text-red-400/60 hover:text-red-400 transition-colors mt-3 ml-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Flow
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg z-30 animate-fab-pulse"
          style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.15)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

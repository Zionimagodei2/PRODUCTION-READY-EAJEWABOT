'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Plus, Trash2, GripVertical, MessageSquare, ArrowRight, Save } from 'lucide-react'

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
    message: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-neon-blue', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    condition: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    action: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-neon-green', icon: <Bot className="w-3.5 h-3.5" /> },
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-purple border border-purple-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10">
            <Bot className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90">Chatbot Builder</h2>
            <p className="text-[10px] text-white/40">AI-powered conversation flows</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-purple">{flows.length}</p>
          <p className="text-[10px] text-white/40">Flows</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-green">{flows.filter(f => f.active).length}</p>
          <p className="text-[10px] text-white/40">Active</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-blue">{flows.reduce((a, f) => a + f.triggers, 0)}</p>
          <p className="text-[10px] text-white/40">Triggers</p>
        </div>
      </div>

      {/* Create Flow */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card rounded-xl p-4 space-y-3 border border-neon-purple/20 neon-glow-purple overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-white/80">New Flow</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Flow name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-purple/40"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-purple/40"
          />
          <div className="flex gap-2">
            <button onClick={createFlow} className="flex-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-lg py-2 text-sm font-medium hover:bg-neon-purple/30 transition-colors">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Flow List */}
      <div className="space-y-2.5">
        {flows.map((flow, i) => (
          <motion.div
            key={flow.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl overflow-hidden transition-all ${selectedFlow === flow.id ? 'border border-neon-purple/30 neon-glow-purple' : ''}`}
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setSelectedFlow(selectedFlow === flow.id ? null : flow.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-neon-purple" />
                  <h3 className="text-sm font-semibold text-white/90">{flow.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">{flow.triggers} triggers</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFlow(flow.id) }}
                    className={`w-8 h-4.5 rounded-full transition-colors relative ${flow.active ? 'bg-neon-purple' : 'bg-white/10'}`}
                  >
                    <div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all"
                      style={{ transform: flow.active ? 'translateX(14px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/40">{flow.description}</p>
              <p className="text-[10px] text-white/20 mt-1">{flow.nodes.length} nodes</p>
            </div>

            {/* Expanded flow detail */}
            {selectedFlow === flow.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-white/5 p-4 space-y-2"
              >
                {flow.nodes.map((node, ni) => {
                  const colors = nodeColors[node.type]
                  return (
                    <div key={node.id} className={`flex items-center gap-2 p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}>
                      <GripVertical className="w-3 h-3 text-white/20 cursor-grab" />
                      <div className={colors.text}>{colors.icon}</div>
                      <span className="text-xs text-white/70 flex-1">{node.content}</span>
                    </div>
                  )
                })}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFlow(flow.id) }}
                  className="flex items-center gap-1.5 text-[10px] text-red-400/60 hover:text-red-400 transition-colors mt-2"
                >
                  <Trash2 className="w-3 h-3" /> Delete Flow
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-lg neon-glow-purple z-30 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

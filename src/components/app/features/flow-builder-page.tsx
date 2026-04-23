'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, GitBranch, Play, Copy, Download, Power, PowerOff,
  Plus, Zap, MessageSquare, GitMerge, MousePointerClick, Square,
  X, Pencil, Trash2, Check, ChevronRight, Clock, Activity, Workflow
} from 'lucide-react'

// Node type definitions
type NodeType = 'trigger' | 'message' | 'condition' | 'action' | 'end'

interface FlowNode {
  id: string
  type: NodeType
  title: string
  content: string
  active?: boolean
}

interface Flow {
  id: string
  name: string
  description: string
  nodes: FlowNode[]
  active: boolean
}

const nodeTypeConfig: Record<NodeType, {
  icon: React.ElementType
  label: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
  glowColor: string
  description: string
}> = {
  trigger: {
    icon: Zap,
    label: 'Trigger',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    textClass: 'text-green-400',
    glowColor: 'rgba(34, 197, 94, 0.2)',
    description: 'Start the flow when an event occurs',
  },
  message: {
    icon: MessageSquare,
    label: 'Message',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    textClass: 'text-blue-400',
    glowColor: 'rgba(59, 130, 246, 0.2)',
    description: 'Send a message to the user',
  },
  condition: {
    icon: GitMerge,
    label: 'Condition',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    textClass: 'text-purple-400',
    glowColor: 'rgba(139, 92, 246, 0.2)',
    description: 'Branch based on a condition',
  },
  action: {
    icon: MousePointerClick,
    label: 'Action',
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
    textClass: 'text-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.2)',
    description: 'Perform an action or integration',
  },
  end: {
    icon: Square,
    label: 'End',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    textClass: 'text-red-400',
    glowColor: 'rgba(239, 68, 68, 0.2)',
    description: 'End the conversation flow',
  },
}

// Pre-built flows
const initialFlows: Flow[] = [
  {
    id: 'welcome',
    name: 'Welcome Flow',
    description: 'New user onboarding',
    active: true,
    nodes: [
      { id: 'w1', type: 'trigger', title: 'New User Joins', content: 'Triggered when a new contact sends their first message', active: true },
      { id: 'w2', type: 'message', title: 'Welcome Message', content: 'Hi {name}! 👋 Welcome to our WhatsApp channel. We\'re glad to have you!', active: true },
      { id: 'w3', type: 'condition', title: 'Has Interest?', content: 'Check if user selects a product category from the menu', active: true },
      { id: 'w4', type: 'action', title: 'Assign to Team', content: 'Route to the appropriate sales team based on selected category', active: true },
      { id: 'w5', type: 'end', title: 'Flow Complete', content: 'End onboarding flow and add to drip campaign', active: false },
    ],
  },
  {
    id: 'support',
    name: 'Support Flow',
    description: 'Customer support routing',
    active: true,
    nodes: [
      { id: 's1', type: 'trigger', title: 'Support Request', content: 'Triggered when user types "help" or sends a support keyword', active: true },
      { id: 's2', type: 'message', title: 'Support Menu', content: 'Please select:\n1️⃣ Billing\n2️⃣ Technical\n3️⃣ General Inquiry', active: true },
      { id: 's3', type: 'condition', title: 'Route Category', content: 'Check selected option and route to appropriate department', active: true },
      { id: 's4', type: 'action', title: 'Create Ticket', content: 'Create a support ticket with category and auto-assign agent', active: true },
    ],
  },
  {
    id: 'sales',
    name: 'Sales Flow',
    description: 'Sales inquiry handling',
    active: false,
    nodes: [
      { id: 'sa1', type: 'trigger', title: 'Product Inquiry', content: 'Triggered when user asks about pricing or products', active: true },
      { id: 'sa2', type: 'message', title: 'Product Catalog', content: 'Here are our popular products! 🛍️ Which one interests you?', active: true },
      { id: 'sa3', type: 'end', title: 'Handoff to Sales', content: 'Connect with live sales agent for personalized quote', active: false },
    ],
  },
]

export function FlowBuilderPage() {
  const { goBack } = useAppStore()
  const [flows, setFlows] = useState<Flow[]>(initialFlows)
  const [activeFlowId, setActiveFlowId] = useState('welcome')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showNodePicker, setShowNodePicker] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')

  const activeFlow = flows.find(f => f.id === activeFlowId)!
  const selectedNode = activeFlow?.nodes.find(n => n.id === selectedNodeId) ?? null

  const totalNodes = flows.reduce((sum, f) => sum + f.nodes.length, 0)
  const activeFlows = flows.filter(f => f.active).length
  const avgResponseTime = '1.2s'

  // Add node to current flow
  const addNode = (type: NodeType) => {
    const config = nodeTypeConfig[type]
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${config.label}`,
      content: '',
      active: false,
    }
    setFlows(flows.map(f =>
      f.id === activeFlowId
        ? { ...f, nodes: [...f.nodes, newNode] }
        : f
    ))
    setShowNodePicker(false)
    setSelectedNodeId(newNode.id)
  }

  // Delete node
  const deleteNode = (nodeId: string) => {
    setFlows(flows.map(f =>
      f.id === activeFlowId
        ? { ...f, nodes: f.nodes.filter(n => n.id !== nodeId) }
        : f
    ))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
      setEditingNodeId(null)
    }
  }

  // Toggle flow active
  const toggleFlowActive = () => {
    setFlows(flows.map(f =>
      f.id === activeFlowId ? { ...f, active: !f.active } : f
    ))
  }

  // Duplicate flow
  const duplicateFlow = () => {
    const original = activeFlow
    const newFlow: Flow = {
      ...original,
      id: `flow-${Date.now()}`,
      name: `${original.name} (Copy)`,
      active: false,
      nodes: original.nodes.map(n => ({ ...n, id: `node-${Date.now()}-${n.id}` })),
    }
    setFlows([...flows, newFlow])
    setActiveFlowId(newFlow.id)
  }

  // Export flow
  const exportFlow = () => {
    const blob = new Blob([JSON.stringify(activeFlow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeFlow.name.replace(/\s+/g, '_').toLowerCase()}_flow.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Start editing node
  const startEditing = (node: FlowNode) => {
    setEditingNodeId(node.id)
    setEditTitle(node.title)
    setEditContent(node.content)
  }

  // Save edit
  const saveEdit = () => {
    if (!editingNodeId) return
    setFlows(flows.map(f =>
      f.id === activeFlowId
        ? {
            ...f,
            nodes: f.nodes.map(n =>
              n.id === editingNodeId
                ? { ...n, title: editTitle, content: editContent }
                : n
            ),
          }
        : f
    ))
    setEditingNodeId(null)
  }

  // Toggle node active
  const toggleNodeActive = (nodeId: string) => {
    setFlows(flows.map(f =>
      f.id === activeFlowId
        ? { ...f, nodes: f.nodes.map(n => n.id === nodeId ? { ...n, active: !n.active } : n) }
        : f
    ))
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
            <GitBranch
              className="w-5 h-5 text-cyan-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }}
            />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Flow Builder</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Design conversation flows</p>
        </div>
        <div className={`px-2 py-1 rounded-lg text-[9px] font-bold ${activeFlow.active ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
          {activeFlow.active ? 'ACTIVE' : 'DRAFT'}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center stat-card-cyan">
          <div className="w-7 h-7 mx-auto rounded-lg bg-cyan-500/10 flex items-center justify-center mb-1.5">
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-cyan-400">{activeFlows}</p>
          <p className="text-[10px] text-white/40">Active Flows</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-blue">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-400">{totalNodes}</p>
          <p className="text-[10px] text-white/40">Total Nodes</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-green">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
            <Clock className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-lg font-bold text-green-400">{avgResponseTime}</p>
          <p className="text-[10px] text-white/40">Avg Response</p>
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="gradient-divider" />

      {/* Flow Selector Tabs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <GitBranch className="w-3 h-3 text-neon-cyan" />
            <span className="text-[11px] font-bold text-cyan-400/90 uppercase tracking-wider">Flows</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>
        <div className="flex gap-2">
          {flows.map((flow) => (
            <motion.button
              key={flow.id}
              onClick={() => { setActiveFlowId(flow.id); setSelectedNodeId(null); setEditingNodeId(null) }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 px-3 py-2.5 rounded-xl text-center transition-all border ${
                activeFlowId === flow.id
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 neon-glow-cyan'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
              }`}
            >
              <p className="text-[11px] font-bold truncate">{flow.name}</p>
              <p className="text-[9px] text-white/30 mt-0.5">{flow.nodes.length} nodes</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Visual Flow Builder */}
      <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white/90">{activeFlow.name}</h3>
            <p className="text-[10px] text-white/40">{activeFlow.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${activeFlow.active ? 'bg-green-400 animate-pulse-dot' : 'bg-white/20'}`} />
            <span className="text-[9px] text-white/30">{activeFlow.nodes.length} steps</span>
          </div>
        </div>

        {/* Node Chain */}
        <div className="relative pl-4">
          {activeFlow.nodes.map((node, index) => {
            const config = nodeTypeConfig[node.type]
            const Icon = config.icon
            const isSelected = selectedNodeId === node.id
            const isLast = index === activeFlow.nodes.length - 1

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
              >
                {/* Connection Line */}
                {!isLast && (
                  <div
                    className="absolute left-0 w-0.5"
                    style={{
                      top: `${index * 88 + 44}px`,
                      height: '44px',
                      background: `linear-gradient(to bottom, ${config.color}60, ${nodeTypeConfig[activeFlow.nodes[index + 1]?.type]?.color || config.color}60)`,
                    }}
                  />
                )}

                {/* Node dot on the line */}
                <div
                  className="absolute left-[-3px] w-2.5 h-2.5 rounded-full border-2 z-10"
                  style={{
                    top: `${index * 88 + 18}px`,
                    backgroundColor: node.active ? config.color : 'rgba(255,255,255,0.1)',
                    borderColor: node.active ? config.color : 'rgba(255,255,255,0.15)',
                    boxShadow: node.active ? `0 0 8px ${config.glowColor}` : 'none',
                  }}
                />

                {/* Node Card */}
                <motion.button
                  onClick={() => {
                    setSelectedNodeId(isSelected ? null : node.id)
                    setEditingNodeId(null)
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full mb-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-cyan-500/30 border-white/10'
                      : 'border-white/[0.06] hover:border-white/10'
                  } ${config.bgClass}`}
                  style={{
                    boxShadow: isSelected
                      ? `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`
                      : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg ${config.bgClass} flex items-center justify-center flex-shrink-0`}
                      style={{ border: `1px solid ${config.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12px] font-bold text-white/90 truncate">{node.title}</p>
                        <span
                          className={`text-[7px] px-1.5 py-0.5 rounded-md font-bold ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      {node.content && (
                        <p className="text-[10px] text-white/35 mt-0.5 truncate">{node.content.split('\n')[0]}</p>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                  </div>
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {/* Empty state */}
        {activeFlow.nodes.length === 0 && (
          <div className="text-center py-8">
            <GitBranch className="w-10 h-10 mx-auto text-white/10 mb-2" />
            <p className="text-sm text-white/25">No nodes in this flow</p>
            <p className="text-[11px] text-white/15 mt-1">Tap the + button to add a node</p>
          </div>
        )}
      </div>

      {/* Selected Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl overflow-hidden border-cyan-500/20 neon-glow-cyan"
          >
            {(() => {
              const config = nodeTypeConfig[selectedNode.type]
              const Icon = config.icon
              const isEditing = editingNodeId === selectedNode.id

              return (
                <>
                  {/* Node Header */}
                  <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl ${config.bgClass} flex items-center justify-center`}
                          style={{ border: `1px solid ${config.color}30` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div>
                          {isEditing ? (
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white font-bold focus:outline-none focus:border-cyan-500/30 w-full"
                            />
                          ) : (
                            <h3 className="text-sm font-bold text-white/95">{selectedNode.title}</h3>
                          )}
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
                          >
                            {config.label} Node
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Toggle Active */}
                        <motion.button
                          onClick={() => toggleNodeActive(selectedNode.id)}
                          whileTap={{ scale: 0.9 }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            selectedNode.active
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/15'
                              : 'bg-white/5 text-white/25 hover:bg-white/10'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </motion.button>
                        {/* Close */}
                        <motion.button
                          onClick={() => { setSelectedNodeId(null); setEditingNodeId(null) }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Node Content */}
                  <div className="p-4 space-y-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 block">Content</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/30 transition-colors resize-none"
                          placeholder="Enter node content..."
                        />
                        <div className="flex gap-2">
                          <motion.button
                            onClick={saveEdit}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </motion.button>
                          <motion.button
                            onClick={() => setEditingNodeId(null)}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedNode.content ? (
                          <p className="text-[12px] text-white/60 leading-relaxed whitespace-pre-line">
                            {selectedNode.content}
                          </p>
                        ) : (
                          <p className="text-[11px] text-white/25 italic">No content configured</p>
                        )}

                        {/* Node Status */}
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${selectedNode.active ? 'bg-green-400' : 'bg-white/20'}`} />
                          <span className="text-[10px] text-white/35">
                            {selectedNode.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <motion.button
                            onClick={() => startEditing(selectedNode)}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/15 hover:bg-cyan-500/15 transition-colors"
                          >
                            <Pencil className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-bold text-cyan-400">Edit</span>
                          </motion.button>
                          <motion.button
                            onClick={() => deleteNode(selectedNode.id)}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/15 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] font-bold text-red-400">Delete</span>
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flow Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/15">
            <Zap className="w-3 h-3 text-orange-400" />
            <span className="text-[11px] font-bold text-orange-400/90 uppercase tracking-wider">Actions</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-green-500/10 border border-green-500/15 hover:bg-green-500/15 transition-colors"
          >
            <Play className="w-4 h-4 text-green-400" />
            <span className="text-[8px] font-bold text-green-400">Test</span>
          </motion.button>
          <motion.button
            onClick={toggleFlowActive}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
              activeFlow.active
                ? 'bg-amber-500/10 border-amber-500/15 hover:bg-amber-500/15'
                : 'bg-cyan-500/10 border-cyan-500/15 hover:bg-cyan-500/15'
            }`}
          >
            {activeFlow.active ? (
              <PowerOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Power className="w-4 h-4 text-cyan-400" />
            )}
            <span className={`text-[8px] font-bold ${activeFlow.active ? 'text-amber-400' : 'text-cyan-400'}`}>
              {activeFlow.active ? 'Deactivate' : 'Activate'}
            </span>
          </motion.button>
          <motion.button
            onClick={duplicateFlow}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/15 hover:bg-purple-500/15 transition-colors"
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span className="text-[8px] font-bold text-purple-400">Duplicate</span>
          </motion.button>
          <motion.button
            onClick={exportFlow}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/15 hover:bg-blue-500/15 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span className="text-[8px] font-bold text-blue-400">Export</span>
          </motion.button>
        </div>
      </div>

      {/* Node Type Picker Modal */}
      <AnimatePresence>
        {showNodePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowNodePicker(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass-card-inset rounded-t-3xl p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white/90">Add Node</h3>
                </div>
                <motion.button
                  onClick={() => setShowNodePicker(false)}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Node Types */}
              <div className="space-y-2">
                {(Object.keys(nodeTypeConfig) as NodeType[]).map((type, i) => {
                  const config = nodeTypeConfig[type]
                  const Icon = config.icon
                  return (
                    <motion.button
                      key={type}
                      onClick={() => addNode(type)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 transition-all hover:bg-white/[0.03]"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}
                        style={{ border: `1px solid ${config.color}25` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-[12px] font-bold text-white/90">{config.label}</p>
                        <p className="text-[10px] text-white/35">{config.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB - Add Node */}
      {!showNodePicker && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowNodePicker(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg neon-glow-cyan z-30 hover:scale-105 transition-transform animate-fab-pulse"
          style={{ boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

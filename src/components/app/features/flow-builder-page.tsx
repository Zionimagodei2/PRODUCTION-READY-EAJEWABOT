'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  ArrowLeft, GitBranch, Play, Copy, Download, Power, PowerOff,
  Plus, Zap, MessageSquare, GitMerge, MousePointerClick, Square,
  X, Pencil, Trash2, Check, ChevronRight, Clock, Activity, Workflow,
  Loader2, CircleDot, FileEdit, AlertCircle, Sparkles
} from 'lucide-react'

// Node type definitions
type NodeType = 'trigger' | 'message' | 'condition' | 'action' | 'end'
type FlowStatus = 'active' | 'inactive' | 'draft'

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
  gradientFrom: string
  gradientTo: string
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
    gradientFrom: 'rgba(34,197,94,0.15)',
    gradientTo: 'rgba(34,197,94,0.05)',
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
    gradientFrom: 'rgba(59,130,246,0.15)',
    gradientTo: 'rgba(59,130,246,0.05)',
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
    gradientFrom: 'rgba(139,92,246,0.15)',
    gradientTo: 'rgba(139,92,246,0.05)',
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
    gradientFrom: 'rgba(249,115,22,0.15)',
    gradientTo: 'rgba(249,115,22,0.05)',
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
    gradientFrom: 'rgba(239,68,68,0.15)',
    gradientTo: 'rgba(239,68,68,0.05)',
  },
}

function getFlowStatus(flow: Flow): FlowStatus {
  if (flow.active) return 'active'
  if (flow.nodes.length > 0) return 'inactive'
  return 'draft'
}

function getStatusConfig(status: FlowStatus): { label: string; color: string; bg: string; border: string; dot: string; glowClass: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400', glowClass: 'flow-status-active' }
    case 'inactive':
      return { label: 'Inactive', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400', glowClass: 'flow-status-inactive' }
    case 'draft':
      return { label: 'Draft', color: '#6b7280', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-white/30', glowClass: 'flow-status-draft' }
  }
}

export function FlowBuilderPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [flows, setFlows] = useState<Flow[]>([])
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showNodePicker, setShowNodePicker] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const activeFlow = flows.find(f => f.id === activeFlowId) ?? null
  const selectedNode = activeFlow?.nodes.find(n => n.id === selectedNodeId) ?? null

  const totalNodes = flows.reduce((sum, f) => sum + f.nodes.length, 0)
  const activeFlows = flows.filter(f => f.active).length
  const avgResponseTime = '1.2s'

  // Fetch flows from DB on mount
  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const res = await fetch('/api/flows')
        if (res.ok) {
          const data = await res.json()
          const fetchedFlows: Flow[] = (data.flows || []).map((f: { id: string; name: string; description: string; nodes: FlowNode[]; active: boolean }) => ({
            id: f.id,
            name: f.name,
            description: f.description || '',
            nodes: Array.isArray(f.nodes) ? f.nodes : [],
            active: f.active || false,
          }))
          setFlows(fetchedFlows)
          if (fetchedFlows.length > 0) {
            setActiveFlowId(fetchedFlows[0].id)
          }
        }
      } catch {
        addToast({ type: 'error', title: 'Failed to load flows', message: 'Could not fetch flow data' })
      } finally {
        setLoading(false)
      }
    }
    fetchFlows()
  }, [])

  // Create a new flow via API
  const createFlow = async () => {
    setSaving(true)
    try {
      const defaultNode: FlowNode = {
        id: `node-${Date.now()}`,
        type: 'trigger',
        title: 'New Trigger',
        content: 'Define what starts this flow',
        active: true,
      }
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Flow',
          description: '',
          nodes: [defaultNode],
          active: false,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const newFlow: Flow = {
          id: data.flow.id,
          name: data.flow.name,
          description: data.flow.description,
          nodes: data.flow.nodes,
          active: data.flow.active,
        }
        setFlows(prev => [...prev, newFlow])
        setActiveFlowId(newFlow.id)
        setSelectedNodeId(null)
        addToast({ type: 'success', title: 'Flow Created!', message: 'New flow has been created' })
      } else {
        throw new Error('Failed to create flow')
      }
    } catch {
      addToast({ type: 'error', title: 'Create Failed', message: 'Could not create flow. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Save flow changes to DB
  const saveFlowToDb = async (flow: Flow) => {
    try {
      await fetch('/api/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: flow.id,
          name: flow.name,
          description: flow.description,
          nodes: flow.nodes,
          active: flow.active,
        }),
      })
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save changes to database' })
    }
  }

  // Add node to current flow
  const addNode = (type: NodeType) => {
    if (!activeFlow) return
    const config = nodeTypeConfig[type]
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${config.label}`,
      content: '',
      active: false,
    }
    const updatedFlow = {
      ...activeFlow,
      nodes: [...activeFlow.nodes, newNode],
    }
    setFlows(flows.map(f => f.id === activeFlowId ? updatedFlow : f))
    setShowNodePicker(false)
    setSelectedNodeId(newNode.id)
    saveFlowToDb(updatedFlow)
  }

  // Delete node
  const deleteNode = (nodeId: string) => {
    if (!activeFlow) return
    const updatedFlow = {
      ...activeFlow,
      nodes: activeFlow.nodes.filter(n => n.id !== nodeId),
    }
    setFlows(flows.map(f => f.id === activeFlowId ? updatedFlow : f))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
      setEditingNodeId(null)
    }
    saveFlowToDb(updatedFlow)
  }

  // Toggle flow active
  const toggleFlowActive = () => {
    if (!activeFlow) return
    const updatedFlow = { ...activeFlow, active: !activeFlow.active }
    setFlows(flows.map(f => f.id === activeFlowId ? updatedFlow : f))
    saveFlowToDb(updatedFlow)
  }

  // Duplicate flow
  const duplicateFlow = async () => {
    if (!activeFlow) return
    setSaving(true)
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${activeFlow.name} (Copy)`,
          description: activeFlow.description,
          nodes: activeFlow.nodes.map(n => ({ ...n, id: `node-${Date.now()}-${n.id}` })),
          active: false,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const newFlow: Flow = {
          id: data.flow.id,
          name: data.flow.name,
          description: data.flow.description,
          nodes: data.flow.nodes,
          active: data.flow.active,
        }
        setFlows(prev => [...prev, newFlow])
        setActiveFlowId(newFlow.id)
        addToast({ type: 'success', title: 'Flow Duplicated!', message: `"${activeFlow.name}" has been copied` })
      } else {
        throw new Error('Failed to duplicate flow')
      }
    } catch {
      addToast({ type: 'error', title: 'Duplicate Failed', message: 'Could not duplicate flow' })
    } finally {
      setSaving(false)
    }
  }

  // Export flow
  const exportFlow = () => {
    if (!activeFlow) return
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
    if (!editingNodeId || !activeFlow) return
    const updatedFlow = {
      ...activeFlow,
      nodes: activeFlow.nodes.map(n =>
        n.id === editingNodeId
          ? { ...n, title: editTitle, content: editContent }
          : n
      ),
    }
    setFlows(flows.map(f => f.id === activeFlowId ? updatedFlow : f))
    setEditingNodeId(null)
    saveFlowToDb(updatedFlow)
  }

  // Toggle node active
  const toggleNodeActive = (nodeId: string) => {
    if (!activeFlow) return
    const updatedFlow = {
      ...activeFlow,
      nodes: activeFlow.nodes.map(n => n.id === nodeId ? { ...n, active: !n.active } : n),
    }
    setFlows(flows.map(f => f.id === activeFlowId ? updatedFlow : f))
    saveFlowToDb(updatedFlow)
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08]" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="h-3 w-48 rounded bg-white/[0.03] animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-xl p-3 text-center animate-pulse">
              <div className="w-7 h-7 mx-auto rounded-lg bg-white/[0.05] mb-1.5" />
              <div className="h-6 w-8 mx-auto rounded bg-white/[0.05] mb-1" />
              <div className="h-3 w-16 mx-auto rounded bg-white/[0.03]" />
            </div>
          ))}
        </div>
        <div className="glass-card rounded-2xl p-8 text-center animate-pulse">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-white/[0.05] mb-4" />
          <div className="h-4 w-32 mx-auto rounded bg-white/[0.05] mb-2" />
          <div className="h-3 w-48 mx-auto rounded bg-white/[0.03]" />
        </div>
      </div>
    )
  }

  // Empty state - no flows
  if (flows.length === 0) {
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
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
            <GitBranch className="w-10 h-10 text-cyan-400/50" />
          </div>
          <h3 className="text-sm font-bold text-white/70 mb-2">No Flows Yet</h3>
          <p className="text-xs text-white/35 mb-6 max-w-[240px] mx-auto">
            Create your first conversation flow to automate WhatsApp interactions.
          </p>
          <motion.button
            onClick={createFlow}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ boxShadow: '0 0 20px rgba(6,182,212,0.25)' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
            ) : (
              <><Plus className="w-4 h-4" /> Create Flow</>
            )}
          </motion.button>
        </motion.div>
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
            <GitBranch
              className="w-5 h-5 text-cyan-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }}
            />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Flow Builder</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Design conversation flows</p>
        </div>
        {activeFlow && (() => {
          const status = getFlowStatus(activeFlow)
          const statusConfig = getStatusConfig(status)
          return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.glowClass}`}
              style={{ color: statusConfig.color }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} style={status === 'active' ? { boxShadow: `0 0 4px ${statusConfig.color}` } : undefined} />
              {statusConfig.label.toUpperCase()}
            </div>
          )
        })()}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center stat-card-cyan card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-cyan-500/10 flex items-center justify-center mb-1.5">
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-cyan-400">{activeFlows}</p>
          <p className="text-[10px] text-white/40">Active Flows</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-blue card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <GitBranch className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-400">{totalNodes}</p>
          <p className="text-[10px] text-white/40">Total Nodes</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-green card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
            <Clock className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-lg font-bold text-green-400">{avgResponseTime}</p>
          <p className="text-[10px] text-white/40">Avg Response</p>
        </div>
      </div>

      {/* Gradient Divider */}
      <div className="gradient-divider" />

      {/* Flow Selector Tabs + Create Button */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <GitBranch className="w-3 h-3 text-neon-cyan" />
            <span className="text-[11px] font-bold text-cyan-400/90 uppercase tracking-wider">Flows</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
          <motion.button
            onClick={createFlow}
            disabled={saving}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold hover:bg-cyan-500/15 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" /> New
          </motion.button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {flows.map((flow) => {
            const flowStatus = getFlowStatus(flow)
            const flowStatusConfig = getStatusConfig(flowStatus)
            return (
              <motion.button
                key={flow.id}
                onClick={() => { setActiveFlowId(flow.id); setSelectedNodeId(null); setEditingNodeId(null) }}
                whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 px-3 py-2.5 rounded-xl text-center transition-all border relative ${
                  activeFlowId === flow.id
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 neon-glow-cyan'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.05]'
                }`}
              >
                <p className="text-[11px] font-bold truncate max-w-[100px]">{flow.name}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${flowStatusConfig.dot}`} />
                  <p className="text-[9px] text-white/30">{flow.nodes.length} nodes • {flowStatusConfig.label}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Visual Flow Builder */}
      {activeFlow && (
        <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white/90">{activeFlow.name}</h3>
              <p className="text-[10px] text-white/40">{activeFlow.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${activeFlow.active ? 'bg-green-400 animate-pulse-dot' : 'bg-white/20'}`} />
              <span className="text-[9px] text-white/30">{activeFlow.nodes.length} steps</span>
            </div>
          </div>

          {/* Node Chain with SVG animated connection lines */}
          <div className="relative pl-4">
            {activeFlow.nodes.map((node, index) => {
              const config = nodeTypeConfig[node.type]
              const Icon = config.icon
              const isSelected = selectedNodeId === node.id
              const isHovered = hoveredNodeId === node.id
              const isLast = index === activeFlow.nodes.length - 1

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  {/* Animated SVG Connection Line */}
                  {!isLast && (() => {
                    const nextConfig = nodeTypeConfig[activeFlow.nodes[index + 1]?.type]
                    return (
                      <svg
                        className="absolute left-0"
                        style={{ top: `${index * 92 + 50}px`, height: '42px', width: '16px', overflow: 'visible' }}
                      >
                        <line
                          x1="8" y1="0" x2="8" y2="42"
                          className="flow-connection-line"
                          strokeWidth="2"
                          stroke={`url(#lineGrad-${node.id})`}
                        />
                        <defs>
                          <linearGradient id={`lineGrad-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={config.color} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={nextConfig.color} stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )
                  })()}

                  {/* Node dot on the line */}
                  <div
                    className="absolute left-[-3px] w-2.5 h-2.5 rounded-full border-2 z-10"
                    style={{
                      top: `${index * 92 + 22}px`,
                      backgroundColor: node.active ? config.color : 'rgba(255,255,255,0.1)',
                      borderColor: node.active ? config.color : 'rgba(255,255,255,0.15)',
                      boxShadow: node.active ? `0 0 8px ${config.glowColor}` : 'none',
                      animation: node.active ? 'breathe 2.5s ease-in-out infinite' : 'none',
                      color: node.active ? config.color : undefined,
                    }}
                  />

                  {/* Node Card with hover glow */}
                  <motion.button
                    onClick={() => {
                      setSelectedNodeId(isSelected ? null : node.id)
                      setEditingNodeId(null)
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full mb-3 p-3 rounded-xl border text-left transition-all duration-200 flow-node-card ${
                      isSelected
                        ? 'ring-2 ring-cyan-500/30 border-white/10'
                        : 'border-white/[0.06] hover:border-white/10'
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`
                        : isHovered
                          ? `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`
                          : undefined,
                      boxShadow: isSelected
                        ? `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}`
                        : isHovered
                          ? `0 0 12px ${config.glowColor}, 0 0 24px ${config.glowColor}`
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
                          {/* Node active/inactive indicator */}
                          <span className={`w-1.5 h-1.5 rounded-full ${node.active ? 'bg-green-400' : 'bg-white/20'}`} />
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
      )}

      {/* Selected Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && activeFlow && (
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
              activeFlow?.active
                ? 'bg-amber-500/10 border-amber-500/15 hover:bg-amber-500/15'
                : 'bg-cyan-500/10 border-cyan-500/15 hover:bg-cyan-500/15'
            }`}
          >
            {activeFlow?.active ? (
              <PowerOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Power className="w-4 h-4 text-cyan-400" />
            )}
            <span className={`text-[8px] font-bold ${activeFlow?.active ? 'text-amber-400' : 'text-cyan-400'}`}>
              {activeFlow?.active ? 'Deactivate' : 'Activate'}
            </span>
          </motion.button>
          <motion.button
            onClick={duplicateFlow}
            disabled={saving}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/15 hover:bg-purple-500/15 transition-colors disabled:opacity-50"
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

      {/* Node Type Picker Modal - Enhanced with icons and descriptions */}
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
                  <Sparkles className="w-4 h-4 text-cyan-400" />
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

              {/* Node Types - Enhanced with icons, gradient, glow */}
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
                      whileHover={{ boxShadow: `0 0 12px ${config.glowColor}` }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] hover:border-white/10 transition-all node-type-btn"
                      style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})` }}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}
                        style={{ border: `1px solid ${config.color}30`, boxShadow: `0 0 8px ${config.glowColor}` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-bold text-white/90">{config.label}</p>
                          <span className={`text-[7px] px-1.5 py-0.5 rounded-md font-bold ${config.bgClass} ${config.textClass} border ${config.borderClass}`}>
                            NODE
                          </span>
                        </div>
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
      {!showNodePicker && activeFlow && (
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

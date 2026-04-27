'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  ArrowLeft, Webhook, Globe, Zap, Activity, Check, X, Shield,
  Eye, EyeOff, Plus, ChevronDown, ChevronUp, Clock, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Trash2, ExternalLink, Hash,
  Heart, TrendingUp, Radio
} from 'lucide-react'

// --- Types ---

type WebhookStatus = 'Active' | 'Inactive' | 'Paused'
type EventLogStatus = 200 | 301 | 404 | 500
type FilterTab = 'all' | 'delivered' | 'read' | 'failed' | 'message'
type RetryPolicy = 'none' | '3-retries' | '5-retries'

interface WebhookEndpoint {
  id: string
  url: string
  status: WebhookStatus
  events: string[]
  lastTriggered: string
  successCount: number
  failureCount: number
  eventLogs: EventLogEntry[]
}

interface EventLogEntry {
  id: string
  eventType: string
  status: EventLogStatus
  responseTime: number
  timestamp: string
  payload?: string
}

const availableEvents = [
  'message.received',
  'message.delivered',
  'message.read',
  'message.failed',
  'contact.added',
  'contact.updated',
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// --- Helper Functions ---

function getStatusBgClass(status: EventLogStatus): string {
  if (status >= 200 && status < 300) return 'bg-green-500/10 border-green-500/15 text-green-400'
  if (status >= 300 && status < 400) return 'bg-amber-500/10 border-amber-500/15 text-amber-400'
  return 'bg-red-500/10 border-red-500/15 text-red-400'
}

function getWebhookStatusBadge(status: WebhookStatus): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'Active':
      return { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', dot: 'bg-green-500' }
    case 'Inactive':
      return { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' }
    case 'Paused':
      return { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' }
  }
}

function truncateUrl(url: string, maxLen: number = 42): string {
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen) + '...'
}

function getEventBadgeColor(event: string): string {
  if (event.startsWith('message.received')) return 'bg-blue-500/10 border-blue-500/15 text-blue-400'
  if (event.startsWith('message.delivered')) return 'bg-green-500/10 border-green-500/15 text-green-400'
  if (event.startsWith('message.read')) return 'bg-cyan-500/10 border-cyan-500/15 text-cyan-400'
  if (event.startsWith('message.failed')) return 'bg-red-500/10 border-red-500/15 text-red-400'
  if (event.startsWith('contact.added')) return 'bg-purple-500/10 border-purple-500/15 text-purple-400'
  if (event.startsWith('contact.updated')) return 'bg-amber-500/10 border-amber-500/15 text-amber-400'
  return 'bg-white/5 border-white/10 text-white/50'
}

function getEventDotColor(event: string): string {
  if (event.startsWith('message.received')) return '#3b82f6'
  if (event.startsWith('message.delivered')) return '#22c55e'
  if (event.startsWith('message.read')) return '#06b6d4'
  if (event.startsWith('message.failed')) return '#ef4444'
  if (event.startsWith('contact.added')) return '#8b5cf6'
  if (event.startsWith('contact.updated')) return '#f59e0b'
  return '#6b7280'
}

function filterEventsByTab(events: EventLogEntry[], tab: FilterTab): EventLogEntry[] {
  if (tab === 'all') return events
  if (tab === 'delivered') return events.filter(e => e.eventType === 'message.delivered')
  if (tab === 'read') return events.filter(e => e.eventType === 'message.read')
  if (tab === 'failed') return events.filter(e => e.eventType === 'message.failed' || e.status >= 400)
  if (tab === 'message') return events.filter(e => e.eventType.startsWith('message.'))
  return events
}

/** Compute health score (0-100) for a single endpoint */
function computeHealthScore(endpoint: WebhookEndpoint): number {
  const total = endpoint.successCount + endpoint.failureCount
  if (total === 0) return 100 // no data = neutral healthy
  return Math.round((endpoint.successCount / total) * 100)
}

function getHealthColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function getHealthLabel(score: number): string {
  if (score >= 90) return 'Healthy'
  if (score >= 70) return 'Fair'
  if (score >= 50) return 'Degraded'
  return 'Unhealthy'
}

// --- Component ---

export function WebhookManagerPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [eventFilter, setEventFilter] = useState<FilterTab>('all')
  const [showConfigModal, setShowConfigModal] = useState(false)

  // Config modal state
  const [configUrl, setConfigUrl] = useState('')
  const [configEvents, setConfigEvents] = useState<string[]>([])
  const [configSecret, setConfigSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [configRetry, setConfigRetry] = useState<RetryPolicy>('3-retries')
  const [isTesting, setIsTesting] = useState(false)

  // Compute stats
  const activeWebhooks = endpoints.filter(e => e.status === 'Active').length
  const totalSuccess = endpoints.reduce((sum, e) => sum + e.successCount, 0)
  const totalFail = endpoints.reduce((sum, e) => sum + e.failureCount, 0)
  const successRate = (totalSuccess + totalFail) > 0 ? Math.round((totalSuccess / (totalSuccess + totalFail)) * 100) : 0
  const avgHealthScore = endpoints.length > 0
    ? Math.round(endpoints.reduce((sum, e) => sum + computeHealthScore(e), 0) / endpoints.length)
    : 100
  const healthColor = getHealthColor(avgHealthScore)

  // Collect all event logs from all endpoints
  const allEventLogs: EventLogEntry[] = endpoints.flatMap(e => e.eventLogs)

  // Toggle endpoint expansion
  const toggleExpand = (id: string) => {
    setExpandedEndpoint(prev => prev === id ? null : id)
  }

  // Handle save webhook
  const handleSaveWebhook = () => {
    if (!configUrl.trim()) {
      addToast({ type: 'error', message: 'Endpoint URL is required' })
      return
    }
    if (configEvents.length === 0) {
      addToast({ type: 'error', message: 'Select at least one event' })
      return
    }
    const newEndpoint: WebhookEndpoint = {
      id: Date.now().toString(),
      url: configUrl,
      status: 'Active',
      events: configEvents,
      lastTriggered: 'Never',
      successCount: 0,
      failureCount: 0,
      eventLogs: [],
    }
    setEndpoints(prev => [...prev, newEndpoint])
    addToast({ type: 'success', message: 'Webhook endpoint created successfully' })
    resetConfigModal()
    setShowConfigModal(false)
  }

  // Test webhook
  const handleTestWebhook = () => {
    if (!configUrl.trim()) {
      addToast({ type: 'error', message: 'Enter an endpoint URL to test' })
      return
    }
    setIsTesting(true)
    setTimeout(() => {
      setIsTesting(false)
      addToast({ type: 'success', message: 'Test webhook sent! Response: 200 OK (142ms)' })
    }, 1500)
  }

  // Delete webhook
  const handleDeleteWebhook = (id: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== id))
    if (expandedEndpoint === id) setExpandedEndpoint(null)
    addToast({ type: 'info', message: 'Webhook endpoint removed' })
  }

  // Toggle endpoint status
  const handleToggleStatus = (id: string) => {
    setEndpoints(prev => prev.map(e => {
      if (e.id !== id) return e
      const nextStatus: Record<WebhookStatus, WebhookStatus> = {
        Active: 'Paused',
        Paused: 'Active',
        Inactive: 'Active',
      }
      return { ...e, status: nextStatus[e.status] }
    }))
  }

  // Toggle event in config
  const toggleConfigEvent = (event: string) => {
    setConfigEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  // Reset modal
  const resetConfigModal = () => {
    setConfigUrl('')
    setConfigEvents([])
    setConfigSecret('')
    setShowSecret(false)
    setConfigRetry('3-retries')
    setIsTesting(false)
  }

  // Filter tabs for event log
  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'read', label: 'Read' },
    { key: 'failed', label: 'Failed' },
    { key: 'message', label: 'Message' },
  ]

  const filteredRecentEvents = filterEventsByTab(allEventLogs, eventFilter)

  // SVG ring for health score
  const healthCircumference = 2 * Math.PI * 28
  const healthOffset = healthCircumference - (healthCircumference * avgHealthScore / 100)

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-orange-400" style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' }} />
            <h1 className="text-lg font-extrabold text-white/95">Webhook Manager</h1>
          </div>
          <p className="text-[11px] text-white/50 mt-0.5">Manage API webhooks & events</p>
        </div>
      </motion.div>

      {/* Stats Section - Enhanced with health score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        {/* Active Webhooks with animated ping */}
        <div className="glass-card rounded-xl p-3 text-center stat-card-green card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5 relative">
            <Globe className="w-3.5 h-3.5 text-green-400" />
            {activeWebhooks > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 webhook-ping" />
            )}
          </div>
          <p className="text-xl font-extrabold text-white/95">{activeWebhooks}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Active Webhooks</p>
          {activeWebhooks > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <Radio className="w-2.5 h-2.5 text-green-400 animate-breathe" style={{ color: '#22c55e' }} />
              <span className="text-[8px] text-green-400/60 font-medium">Listening</span>
            </div>
          )}
        </div>

        {/* Total Events */}
        <div className="glass-card rounded-xl p-3 text-center stat-card-orange card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-orange-500/10 flex items-center justify-center mb-1.5">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{allEventLogs.length.toLocaleString()}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Total Events</p>
        </div>

        {/* Health Score with ring */}
        <div className="glass-card rounded-xl p-3 text-center card-hover-lift"
          style={{ borderLeft: `3px solid ${healthColor}80` }}
        >
          <div className="w-7 h-7 mx-auto mb-1.5 relative">
            <svg width="28" height="28" className="health-score-ring" style={{ '--health-offset': healthOffset } as React.CSSProperties}>
              <circle cx="14" cy="14" r="11" strokeWidth="2.5" className="health-score-bg" />
              <circle 
                cx="14" cy="14" r="11" 
                strokeWidth="2.5" 
                stroke={healthColor}
                strokeDasharray={2 * Math.PI * 11}
                strokeDashoffset={2 * Math.PI * 11 - (2 * Math.PI * 11 * avgHealthScore / 100)}
                className="health-score-fill"
                style={{ 
                  filter: `drop-shadow(0 0 3px ${healthColor}60)`,
                  transition: 'stroke-dashoffset 1s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-2.5 h-2.5" style={{ color: healthColor }} />
            </div>
          </div>
          <p className="text-sm font-extrabold" style={{ color: healthColor }}>{avgHealthScore}%</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Health</p>
        </div>
      </motion.div>

      {/* Overall Health Score + Success Rate Bar */}
      {endpoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: healthColor }} />
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Delivery Overview</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold" style={{ color: healthColor }}>
                {getHealthLabel(avgHealthScore)}
              </span>
            </div>
          </div>
          {/* Success / Failure bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden relative">
              <div className="h-full rounded-full delivery-bar-animated flex">
                <div 
                  className="h-full bg-gradient-to-r from-green-500/70 to-green-400/60"
                  style={{ width: `${successRate}%` }}
                />
                {100 - successRate > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-red-500/60 to-red-400/50"
                    style={{ width: `${100 - successRate}%` }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-bold">{totalSuccess.toLocaleString()}</span>
              <span className="text-white/30">success</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/30">rate</span>
              <span className="font-bold" style={{ color: healthColor }}>{successRate}%</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold">{totalFail.toLocaleString()}</span>
              <span className="text-white/30">failed</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="gradient-divider" />

      {/* Webhook Endpoints Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/15">
            <Webhook className="w-3 h-3 text-orange-400" />
            <span className="text-[11px] font-bold text-orange-400/90 uppercase tracking-wider">Endpoints</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-500/20 to-transparent" />
          <motion.button
            onClick={() => { resetConfigModal(); setShowConfigModal(true) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-bold">Add New</span>
          </motion.button>
        </div>

        {endpoints.length === 0 ? (
          <div className="glass-card rounded-2xl py-14 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
              <Webhook className="w-7 h-7 text-orange-400/50" />
            </div>
            <p className="text-sm text-white/50 font-semibold mb-1">No webhook endpoints</p>
            <p className="text-xs text-white/30 mb-4 max-w-[220px] mx-auto">
              Add a webhook endpoint to receive real-time event notifications.
            </p>
            <motion.button
              onClick={() => { resetConfigModal(); setShowConfigModal(true) }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/25 text-orange-300 font-semibold text-xs hover:from-orange-500/30 hover:to-amber-500/15 transition-all"
              style={{ boxShadow: '0 0 15px rgba(249,115,22,0.15)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Create Webhook
            </motion.button>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {endpoints.map((endpoint) => {
              const statusBadge = getWebhookStatusBadge(endpoint.status)
              const total = endpoint.successCount + endpoint.failureCount
              const successPercent = total > 0 ? Math.round((endpoint.successCount / total) * 100) : 0
              const isExpanded = expandedEndpoint === endpoint.id
              const healthScore = computeHealthScore(endpoint)
              const endpointHealthColor = getHealthColor(healthScore)

              return (
                <motion.div
                  key={endpoint.id}
                  variants={listItem}
                  className="glass-card rounded-2xl overflow-hidden card-hover-lift"
                >
                  {/* Endpoint Card */}
                  <motion.div
                    onClick={() => toggleExpand(endpoint.id)}
                    className="p-4 cursor-pointer hover:bg-white/[0.02] transition-all duration-200"
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* URL + Status row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="relative">
                            <Globe className="w-3.5 h-3.5 text-orange-400/60 flex-shrink-0" />
                            {/* Animated ping indicator for active webhooks */}
                            {endpoint.status === 'Active' && (
                              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 webhook-ping" />
                            )}
                          </div>
                          <p className="text-[12px] font-mono text-white/70 truncate">{truncateUrl(endpoint.url)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${statusBadge.bg} ${statusBadge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} ${endpoint.status === 'Active' ? 'animate-breathe' : ''}`} style={endpoint.status === 'Active' ? { color: '#22c55e' } : undefined} />
                            {endpoint.status}
                          </span>
                          <span className="text-[9px] text-white/30">•</span>
                          <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {endpoint.lastTriggered}
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-white/20" />
                      </motion.div>
                    </div>

                    {/* Events tags - Enhanced with colored dot indicators */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {endpoint.events.map((event) => (
                        <span key={event} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold border ${getEventBadgeColor(event)}`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getEventDotColor(event) }} />
                          {event.split('.')[1]}
                        </span>
                      ))}
                    </div>

                    {/* Health Score + Delivery Rate */}
                    <div className="flex items-center gap-3">
                      {/* Mini health score ring */}
                      <div className="flex items-center gap-1.5">
                        <svg width="20" height="20" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                          <circle cx="10" cy="10" r="7" fill="none" strokeWidth="2" stroke="rgba(255,255,255,0.06)" />
                          <circle cx="10" cy="10" r="7" fill="none" strokeWidth="2"
                            stroke={endpointHealthColor}
                            strokeDasharray={2 * Math.PI * 7}
                            strokeDashoffset={2 * Math.PI * 7 - (2 * Math.PI * 7 * healthScore / 100)}
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 2px ${endpointHealthColor}50)`, transition: 'stroke-dashoffset 0.5s ease-out' }}
                          />
                        </svg>
                        <span className="text-[9px] font-bold" style={{ color: endpointHealthColor }}>{healthScore}%</span>
                      </div>
                      
                      {/* Success/Failure bar */}
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full flex delivery-bar-animated">
                          <div
                            className="h-full bg-gradient-to-r from-green-500/70 to-green-400/50"
                            style={{ width: `${successPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[9px]">
                        <span className="text-green-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {endpoint.successCount.toLocaleString()}
                        </span>
                        <span className="text-red-400 font-bold flex items-center gap-0.5">
                          <XCircle className="w-2.5 h-2.5" />
                          {endpoint.failureCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Expanded Event Logs */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 border-t border-white/[0.04]">
                          <div className="flex items-center justify-between mt-3 mb-2">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Recent Events</p>
                            <div className="flex items-center gap-2">
                              <motion.button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(endpoint.id) }}
                                whileTap={{ scale: 0.9 }}
                                className="text-[9px] text-amber-400/60 hover:text-amber-400 flex items-center gap-0.5 transition-colors"
                              >
                                {endpoint.status === 'Active' ? 'Pause' : 'Resume'}
                              </motion.button>
                              <motion.button
                                onClick={(e) => { e.stopPropagation(); handleDeleteWebhook(endpoint.id) }}
                                whileTap={{ scale: 0.9 }}
                                className="text-[9px] text-red-400/60 hover:text-red-400 flex items-center gap-0.5 transition-colors"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                Delete
                              </motion.button>
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                            {endpoint.eventLogs.length === 0 ? (
                              <p className="text-[10px] text-white/25 text-center py-4">No events recorded yet</p>
                            ) : (
                              endpoint.eventLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getEventBadgeColor(log.eventType)}`}>
                                      {log.eventType.split('.')[1]}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getStatusBgClass(log.status)}`}>
                                      {log.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] text-white/30">
                                    <span>{log.responseTime}ms</span>
                                    <span>{log.timestamp}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      <div className="gradient-divider" />

      {/* Event Log Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">Event Log</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>

        {allEventLogs.length === 0 ? (
          <div className="glass-card rounded-2xl py-10 text-center">
            <Activity className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30 font-medium">No events recorded</p>
            <p className="text-[10px] text-white/20 mt-1">Events will appear here when webhooks are triggered</p>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
              {filterTabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setEventFilter(tab.key)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex-1 flex items-center justify-center py-2 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                    eventFilter === tab.key
                      ? 'text-orange-400'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {eventFilter === tab.key && (
                    <motion.div
                      layoutId="eventFilterIndicator"
                      className="absolute inset-0 rounded-lg bg-orange-500/10 border border-orange-500/15"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Event List */}
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
              <AnimatePresence mode="popLayout">
                {filteredRecentEvents.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="empty-state py-12"
                  >
                    <AlertTriangle className="w-10 h-10 text-white/10 mb-3" />
                    <p className="text-sm text-white/40 font-medium">No events found</p>
                    <p className="text-xs text-white/25 mt-1">Try a different filter</p>
                  </motion.div>
                ) : (
                  filteredRecentEvents.map((event, i) => {
                    const statusColor = event.status >= 200 && event.status < 300 ? '#22c55e' : event.status >= 300 && event.status < 400 ? '#f59e0b' : '#ef4444'
                    const eventDotColor = getEventDotColor(event.eventType)
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-all duration-200"
                      >
                        {/* Status indicator dot with glow */}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: statusColor,
                            boxShadow: `0 0 6px ${statusColor}60`
                          }}
                        />

                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${getEventBadgeColor(event.eventType)}`}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: eventDotColor }} />
                              {event.eventType.split('.')[1]}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStatusBgClass(event.status)}`}>
                              {event.status} {event.status < 300 ? 'OK' : event.status < 400 ? 'Redirect' : event.status === 404 ? 'Not Found' : 'Server Error'}
                            </span>
                          </div>
                        </div>

                        {/* Response time & timestamp */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-mono text-white/50">{event.responseTime}ms</p>
                          <p className="text-[9px] text-white/25 mt-0.5">{event.timestamp}</p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* Webhook Configuration Modal (Bottom Sheet) */}
      <AnimatePresence>
        {showConfigModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowConfigModal(false); resetConfigModal() }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="bg-[#0c0c14] border-t border-white/10 rounded-t-3xl p-5 max-w-lg mx-auto">
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-5" />

                {/* Title */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Webhook className="w-4.5 h-4.5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white/95">New Webhook</h2>
                    <p className="text-[10px] text-white/40">Configure your webhook endpoint</p>
                  </div>
                </div>

                {/* Endpoint URL */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Endpoint URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                    <input
                      type="url"
                      placeholder="https://api.example.com/webhooks/whatsapp"
                      value={configUrl}
                      onChange={(e) => setConfigUrl(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/90 placeholder:text-white/25 font-mono focus:outline-none focus:border-orange-500/30 focus:bg-white/[0.07] transition-all"
                    />
                  </div>
                </div>

                {/* Events Subscription - Enhanced with colored badges */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 block">
                    Events Subscription
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableEvents.map((event) => {
                      const isSelected = configEvents.includes(event)
                      const dotColor = getEventDotColor(event)
                      return (
                        <motion.button
                          key={event}
                          onClick={() => toggleConfigEvent(event)}
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                            isSelected
                              ? getEventBadgeColor(event)
                              : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-white/15'
                          }`}>
                            {isSelected ? (
                              <Check className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                            )}
                          </div>
                          {event}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Secret Key */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Secret Key
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                    <input
                      type={showSecret ? 'text' : 'password'}
                      placeholder="Enter webhook secret key"
                      value={configSecret}
                      onChange={(e) => setConfigSecret(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/90 placeholder:text-white/25 font-mono focus:outline-none focus:border-orange-500/30 focus:bg-white/[0.07] transition-all"
                    />
                    <motion.button
                      onClick={() => setShowSecret(!showSecret)}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                </div>

                {/* Retry Policy */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Retry Policy
                  </label>
                  <div className="flex gap-2">
                    {([
                      { key: 'none' as RetryPolicy, label: 'None' },
                      { key: '3-retries' as RetryPolicy, label: '3 Retries' },
                      { key: '5-retries' as RetryPolicy, label: '5 Retries' },
                    ]).map((option) => (
                      <motion.button
                        key={option.key}
                        onClick={() => setConfigRetry(option.key)}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-1 py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                          configRetry === option.key
                            ? 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.04]'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleTestWebhook}
                    disabled={isTesting}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/8 text-white/60 hover:bg-white/[0.07] transition-all text-xs font-semibold disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        Test Webhook
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={handleSaveWebhook}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/25 text-orange-400 hover:from-orange-500/25 hover:to-amber-500/25 transition-all text-xs font-bold"
                    style={{ boxShadow: '0 0 15px rgba(249,115,22,0.15)' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Webhook
                  </motion.button>
                </div>

                {/* Cancel */}
                <motion.button
                  onClick={() => { setShowConfigModal(false); resetConfigModal() }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full mt-2 py-2.5 rounded-xl text-center text-xs text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

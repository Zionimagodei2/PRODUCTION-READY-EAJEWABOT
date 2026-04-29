'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { useToastStore } from '@/store/toast-store'
import {
  Calendar, Clock, Send, Play, Pause, StopCircle, ListChecks, Timer, Zap,
  ArrowLeft, ChevronDown, ChevronUp, GripVertical, AlertTriangle, Shield,
  RotateCcw, Sparkles, Image as ImageIcon, Users, Tag, Globe, CheckCircle2, XCircle,
  Plus, Minus, Eye, Rocket, Info, Hash, Bell, MessageSquare, Layers,
  DollarSign, TrendingUp, CalendarDays, MoveVertical
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────
interface Campaign {
  id: string
  name: string
  scheduledTime: string
  contactsCount: number
  status: 'pending' | 'sending' | 'paused' | 'completed' | 'failed'
  progress: number
  messagePreview: string
}

interface DaySlot {
  day: string
  enabled: boolean
  start: string
  end: string
}

interface ContactList {
  id: string
  name: string
  count: number
  tag?: string
}

// ─── Live Data Sources (No mocks) ──────────────────────────
interface ApiContact { id: string; tags: string; status: string; createdAt: string }

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata',
  'Australia/Sydney', 'Pacific/Auckland'
]

const QUICK_TEMPLATES = [
  { name: 'Morning Blast', description: '9 AM weekdays, all contacts', days: [1,2,3,4,5], time: '09:00', speed: 30 },
  { name: 'Afternoon Follow-up', description: '2 PM weekdays, recent leads', days: [1,2,3,4,5], time: '14:00', speed: 20 },
  { name: 'Weekend Promo', description: '10 AM weekends, VIP list', days: [0,6], time: '10:00', speed: 15 },
  { name: 'Drip Campaign', description: 'Daily 11 AM, new signups', days: [0,1,2,3,4,5,6], time: '11:00', speed: 10 },
]

// ─── Section Wrapper Component ───────────────────────────
function Section({ id, icon, title, badge, badgeColor = '#6366f1', isExpanded, onToggle, children }: {
  id: string
  icon: React.ReactNode
  title: string
  badge?: string
  badgeColor?: string
  isExpanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border-white/5 card-hover-lift">
      <motion.button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${badgeColor}15`, border: `1px solid ${badgeColor}25` }}
          >
            {icon}
          </div>
          <span className="text-[13px] font-bold text-white/85 uppercase tracking-wider">{title}</span>
          {badge && (
            <span
              className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md text-white badge-pulse"
              style={{ background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}99)` }}
            >
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </motion.button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────
export function BulkSchedulerPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  // Schedule Builder State
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [msgPerMinute, setMsgPerMinute] = useState(30)
  const [delayBetween, setDelayBetween] = useState(2)
  const [smartSchedule, setSmartSchedule] = useState(true)

  // Time Slot State
  const [daySlots, setDaySlots] = useState<DaySlot[]>([
    { day: 'Sun', enabled: false, start: '09:00', end: '17:00' },
    { day: 'Mon', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Tue', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Wed', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Thu', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Fri', enabled: true, start: '09:00', end: '17:00' },
    { day: 'Sat', enabled: false, start: '09:00', end: '17:00' },
  ])
  const [timezone, setTimezone] = useState('America/New_York')
  const [showTimezonePicker, setShowTimezonePicker] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)

  // Sending Rules State
  const [maxPerHour, setMaxPerHour] = useState(100)
  const [maxPerDay, setMaxPerDay] = useState(500)
  const [optOutDetection, setOptOutDetection] = useState(true)
  const [retryFailed, setRetryFailed] = useState(true)
  const [maxRetries, setMaxRetries] = useState(3)

  // Queue State
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // Preview State
  const [showPreview, setShowPreview] = useState(false)
  const [hasAttachment, setHasAttachment] = useState(false)

  // Summary / Confirmation State
  const [showConfirm, setShowConfirm] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    builder: true,
    timeSlots: true,
    preview: false,
    queue: true,
    rules: false,
    summary: true,
  })


  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoadingData(true)
      try {
        const [contactsRes, campaignsRes] = await Promise.all([fetch('/api/contacts'), fetch('/api/campaigns')])
        if (!cancelled && contactsRes.ok) {
          const contacts: ApiContact[] = await contactsRes.json()
          const byTag = new Map<string, number>()
          contacts.forEach((c) => {
            ;(c.tags || '').split(',').map((t) => t.trim()).filter(Boolean).forEach((tag) => {
              byTag.set(tag, (byTag.get(tag) || 0) + 1)
            })
          })
          const dynamicLists: ContactList[] = [
            { id: 'all', name: 'All Contacts', count: contacts.length },
            ...Array.from(byTag.entries()).map(([tag, count]) => ({ id: `tag-${tag}`, name: `${tag.toUpperCase()} Contacts`, count, tag })),
          ]
          setContactLists(dynamicLists)
        }
        if (!cancelled && campaignsRes.ok) {
          const rows = await campaignsRes.json()
          const mapped: Campaign[] = Array.isArray(rows) ? rows.map((c: any) => ({
            id: c.id,
            name: c.name,
            scheduledTime: c.date || c.createdAt || new Date().toISOString(),
            contactsCount: Number(c.total || 0),
            status: c.status || 'pending',
            progress: c.total ? Math.round((Number(c.sent || 0) / Number(c.total || 1)) * 100) : 0,
            messagePreview: c.message || '',
          })) : []
          setCampaigns(mapped)
        }
      } catch {
        // keep empty-state UI
      } finally {
        if (!cancelled) setLoadingData(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [])

  // ─── Computed Values ────────────────────────────────────
  const totalContacts = useMemo(() => {
    return selectedLists.reduce((sum, id) => {
      const list = contactLists.find(l => l.id === id)
      return sum + (list?.count ?? 0)
    }, 0)
  }, [selectedLists, contactLists])

  const charCount = message.length
  const charLimit = 4096
  const charPercentage = (charCount / charLimit) * 100

  const substitutedMessage = useMemo(() => {
    return message
      .replace(/\{\{name\}\}/g, 'Alex Johnson')
      .replace(/\{\{company\}\}/g, 'EAJE Tech')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
  }, [message])

  const enabledDays = daySlots.filter(d => d.enabled)

  const estimatedDuration = useMemo(() => {
    if (totalContacts === 0 || msgPerMinute === 0) return '0h 0m'
    const minutes = Math.ceil(totalContacts / msgPerMinute)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }, [totalContacts, msgPerMinute])

  const msgsPerDay = useMemo(() => {
    const enabledCount = enabledDays.length
    if (enabledCount === 0) return 0
    return Math.ceil(totalContacts / Math.max(1, Math.ceil(totalContacts / maxPerDay)))
  }, [totalContacts, enabledDays, maxPerDay])

  const costEstimate = useMemo(() => {
    const costPerMsg = 0.005
    return (totalContacts * costPerMsg).toFixed(2)
  }, [totalContacts])

  // ─── Handlers ───────────────────────────────────────────
  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const insertVariable = useCallback((variable: string) => {
    setMessage(prev => prev + `{{${variable}}}`)
  }, [])

  const toggleList = useCallback((id: string) => {
    setSelectedLists(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }, [])

  const toggleDay = useCallback((index: number) => {
    setDaySlots(prev => prev.map((d, i) => i === index ? { ...d, enabled: !d.enabled } : d))
  }, [])

  const updateDayTime = useCallback((index: number, field: 'start' | 'end', value: string) => {
    setDaySlots(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }, [])

  const handleAiSuggest = useCallback(() => {
    setAiSuggesting(true)
    setTimeout(() => {
      setDaySlots(prev => prev.map((d, i) => {
        if (i === 0 || i === 6) return { ...d, enabled: false }
        return { ...d, enabled: true, start: '09:30', end: '11:30' }
      }))
      setSmartSchedule(true)
      setAiSuggesting(false)
      addToast({ type: 'success', title: 'AI Suggestion Applied', message: 'Optimal sending window: 9:30-11:30 AM weekdays' })
    }, 1500)
  }, [addToast])

  const handleCampaignAction = useCallback((id: string, action: 'pause' | 'resume' | 'cancel') => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      if (action === 'pause') return { ...c, status: 'paused' as const }
      if (action === 'resume') return { ...c, status: 'sending' as const }
      if (action === 'cancel') return { ...c, status: 'failed' as const, progress: c.progress }
      return c
    }))
    addToast({ type: 'success', title: `Campaign ${action === 'cancel' ? 'cancelled' : action + 'd'}` })
  }, [addToast])

  const handleStartScheduling = useCallback(() => {
    if (!campaignName.trim()) {
      addToast({ type: 'error', title: 'Campaign name required' })
      return
    }
    if (!message.trim()) {
      addToast({ type: 'error', title: 'Message content required' })
      return
    }
    if (selectedLists.length === 0) {
      addToast({ type: 'error', title: 'Select at least one contact list' })
      return
    }
    setShowConfirm(true)
  }, [campaignName, message, selectedLists, addToast])

  const confirmStart = useCallback(() => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignName,
      scheduledTime: `${new Date().toISOString().split('T')[0]} ${daySlots.find(d => d.enabled)?.start ?? '09:00'}`,
      contactsCount: totalContacts,
      status: 'pending',
      progress: 0,
      messagePreview: message.substring(0, 50) + '...',
    }
    setCampaigns(prev => [newCampaign, ...prev])
    setShowConfirm(false)
    setCampaignName('')
    setMessage('')
    setSelectedLists([])
    addToast({ type: 'success', title: 'Campaign Scheduled! 🚀', message: `${campaignName} queued for ${totalContacts} contacts` })
  }, [campaignName, message, totalContacts, daySlots, addToast])

  const applyTemplate = useCallback((template: typeof QUICK_TEMPLATES[0]) => {
    setDaySlots(prev => prev.map((d, i) => ({
      ...d,
      enabled: template.days.includes(i),
      start: template.time,
      end: `${parseInt(template.time) + 2}:00`,
    })))
    setMsgPerMinute(template.speed)
    addToast({ type: 'info', title: `Template: ${template.name}`, message: template.description })
  }, [addToast])

  const moveCampaign = useCallback((fromIndex: number, toIndex: number) => {
    setCampaigns(prev => {
      const arr = [...prev]
      const [item] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, item)
      return arr
    })
  }, [])

  // ─── Status Config ──────────────────────────────────────
  const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    pending: { color: '#f59e0b', bg: 'bg-amber-500/10', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
    sending: { color: '#6366f1', bg: 'bg-indigo-500/10', label: 'Sending', icon: <Send className="w-3 h-3" /> },
    paused: { color: '#f97316', bg: 'bg-orange-500/10', label: 'Paused', icon: <Pause className="w-3 h-3" /> },
    completed: { color: '#22c55e', bg: 'bg-emerald-500/10', label: 'Completed', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { color: '#ef4444', bg: 'bg-red-500/10', label: 'Failed', icon: <XCircle className="w-3 h-3" /> },
  }

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
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
            <Calendar className="w-5 h-5 text-indigo-400" style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Bulk Scheduler</h2>
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white badge-pulse">PRO</span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Schedule bulk WhatsApp campaigns</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 1. SCHEDULE BUILDER                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="builder"
        icon={<Rocket className="w-4 h-4" style={{ color: '#6366f1' }} />}
        title="Schedule Builder"
        badge="REQUIRED"
        badgeColor="#6366f1"
        isExpanded={expandedSections.builder}
        onToggle={toggleSection}
      >
        {/* Campaign Name */}
        <div>
          <label className="text-[11px] text-white/50 font-semibold mb-1.5 block">Campaign Name</label>
          <input
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            placeholder="e.g. Welcome Series Q1"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        {/* Message Composer */}
        <div>
          <label className="text-[11px] text-white/50 font-semibold mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
          />
          {/* Variable Placeholders */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['name', 'company', 'date'].map(v => (
              <motion.button
                key={v}
                onClick={() => insertVariable(v)}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-medium hover:bg-indigo-500/15 transition-colors"
              >
                <Hash className="w-2.5 h-2.5" />
                {`{{${v}}}`}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Contact List Selector */}
        <div>
          <label className="text-[11px] text-white/50 font-semibold mb-1.5 block flex items-center gap-1.5">
            <Users className="w-3 h-3 text-white/40" />
            Contact Lists
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
            {contactLists.map(list => (
              <motion.button
                key={list.id}
                onClick={() => toggleList(list.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-200 ${
                  selectedLists.includes(list.id)
                    ? 'bg-indigo-500/10 border-indigo-500/25'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    selectedLists.includes(list.id)
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-white/20'
                  }`}>
                    {selectedLists.includes(list.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs text-white/75 font-medium">{list.name}</span>
                  {list.tag && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/35 font-medium uppercase">{list.tag}</span>
                  )}
                </div>
                <span className="text-[10px] text-white/30 font-medium">{list.count.toLocaleString()}</span>
              </motion.button>
            ))}
          </div>
          {selectedLists.length > 0 && (
            <div className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
              <span className="text-[10px] text-indigo-400 font-semibold">
                {totalContacts.toLocaleString()} contacts selected
              </span>
            </div>
          )}
        </div>

        {/* Sending Speed */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-white/50 font-semibold mb-1.5 block flex items-center gap-1">
              <Timer className="w-3 h-3 text-white/40" />
              Msgs/min
            </label>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setMsgPerMinute(Math.max(1, msgPerMinute - 5))}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              >
                <Minus className="w-3 h-3 text-white/50" />
              </motion.button>
              <input
                type="number"
                value={msgPerMinute}
                onChange={e => setMsgPerMinute(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-center text-xs text-white/80 focus:outline-none focus:border-indigo-500/30 transition-all"
              />
              <motion.button
                onClick={() => setMsgPerMinute(Math.min(100, msgPerMinute + 5))}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              >
                <Plus className="w-3 h-3 text-white/50" />
              </motion.button>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/50 font-semibold mb-1.5 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-white/40" />
              Delay (sec)
            </label>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setDelayBetween(Math.max(1, delayBetween - 1))}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              >
                <Minus className="w-3 h-3 text-white/50" />
              </motion.button>
              <input
                type="number"
                value={delayBetween}
                onChange={e => setDelayBetween(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-center text-xs text-white/80 focus:outline-none focus:border-indigo-500/30 transition-all"
              />
              <motion.button
                onClick={() => setDelayBetween(Math.min(30, delayBetween + 1))}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
              >
                <Plus className="w-3 h-3 text-white/50" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Smart Scheduling Toggle */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <span className="text-[11px] text-white/70 font-medium block">Avoid Peak/Spam Hours</span>
              <span className="text-[9px] text-white/30">Auto-skip high-risk times</span>
            </div>
          </div>
          <button
            onClick={() => setSmartSchedule(!smartSchedule)}
            className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${
              smartSchedule ? 'bg-indigo-500/30 border border-indigo-500/40' : 'bg-white/[0.06] border border-white/[0.1]'
            }`}
          >
            <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 ${
              smartSchedule
                ? 'left-5 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                : 'left-0.5 bg-white/40'
            }`} style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 2. TIME SLOT PICKER                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="timeSlots"
        icon={<CalendarDays className="w-4 h-4" style={{ color: '#6366f1' }} />}
        title="Time Slots"
        badge="SMART"
        badgeColor="#6366f1"
        isExpanded={expandedSections.timeSlots}
        onToggle={toggleSection}
      >
        {/* Day-of-Week Selector */}
        <div>
          <label className="text-[11px] text-white/50 font-semibold mb-2 block">Active Days</label>
          <div className="flex gap-1.5">
            {daySlots.map((slot, i) => (
              <motion.button
                key={slot.day}
                onClick={() => toggleDay(i)}
                whileTap={{ scale: 0.92 }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all duration-200 ${
                  slot.enabled
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                    : 'bg-white/[0.03] text-white/25 border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {slot.day}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Time Ranges per Day */}
        <div className="space-y-1.5">
          {daySlots.filter(d => d.enabled).map((slot, i) => (
            <div key={slot.day} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[10px] font-bold text-indigo-400/80 w-7">{slot.day}</span>
              <input
                type="time"
                value={slot.start}
                onChange={e => updateDayTime(daySlots.indexOf(slot), 'start', e.target.value)}
                className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1 text-[10px] text-white/70 focus:outline-none focus:border-indigo-500/30 transition-all flex-1"
              />
              <span className="text-[10px] text-white/20">→</span>
              <input
                type="time"
                value={slot.end}
                onChange={e => updateDayTime(daySlots.indexOf(slot), 'end', e.target.value)}
                className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1 text-[10px] text-white/70 focus:outline-none focus:border-indigo-500/30 transition-all flex-1"
              />
            </div>
          ))}
          {enabledDays.length === 0 && (
            <p className="text-[10px] text-white/20 text-center py-2">Select at least one day above</p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label className="text-[11px] text-white/50 font-semibold mb-1.5 block flex items-center gap-1">
            <Globe className="w-3 h-3 text-white/40" />
            Timezone
          </label>
          <div className="relative">
            <motion.button
              onClick={() => setShowTimezonePicker(!showTimezonePicker)}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <span>{timezone}</span>
              <ChevronDown className="w-3 h-3 text-white/30" />
            </motion.button>
            <AnimatePresence>
              {showTimezonePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 top-full mt-1 w-full glass-card rounded-xl border border-white/10 max-h-32 overflow-y-auto no-scrollbar"
                >
                  {TIMEZONES.map(tz => (
                    <button
                      key={tz}
                      onClick={() => { setTimezone(tz); setShowTimezonePicker(false) }}
                      className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors ${
                        tz === timezone ? 'text-indigo-400 font-semibold' : 'text-white/50'
                      }`}
                    >
                      {tz}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Suggest Button */}
        <motion.button
          onClick={handleAiSuggest}
          whileTap={{ scale: 0.97 }}
          disabled={aiSuggesting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 hover:border-indigo-500/40 transition-all"
          style={{ boxShadow: '0 0 15px rgba(99,102,241,0.1)' }}
        >
          <Sparkles className={`w-4 h-4 text-indigo-400 ${aiSuggesting ? 'animate-spin' : ''}`} />
          <span className="text-xs font-bold text-indigo-400">
            {aiSuggesting ? 'Analyzing...' : 'Best Time to Send (AI)'}
          </span>
        </motion.button>

        {/* Visual Timeline */}
        {enabledDays.length > 0 && (
          <div className="mt-1">
            <label className="text-[10px] text-white/30 font-semibold mb-1.5 block flex items-center gap-1">
              <Layers className="w-3 h-3 text-white/20" />
              Sending Timeline
            </label>
            <div className="glass-card rounded-xl p-3 space-y-1">
              {daySlots.map((slot) => {
                if (!slot.enabled) return null
                const startHour = parseInt(slot.start.split(':')[0])
                const endHour = parseInt(slot.end.split(':')[0])
                return (
                  <div key={slot.day} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-white/40 w-7">{slot.day}</span>
                    <div className="flex-1 h-3 bg-white/[0.03] rounded-full relative overflow-hidden">
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{
                          left: `${(startHour / 24) * 100}%`,
                          width: `${((endHour - startHour) / 24) * 100}%`,
                          background: 'linear-gradient(90deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))',
                          boxShadow: '0 0 8px rgba(99,102,241,0.2)',
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-white/25 w-16 text-right">{slot.start}-{slot.end}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 3. MESSAGE PREVIEW                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="preview"
        icon={<Eye className="w-4 h-4" style={{ color: '#22c55e' }} />}
        title="Message Preview"
        badge="LIVE"
        badgeColor="#22c55e"
        isExpanded={expandedSections.preview}
        onToggle={toggleSection}
      >
        {/* WhatsApp-style Bubble */}
        <div className="bg-[#0b141a] rounded-xl p-3 space-y-2 border border-white/[0.05]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-white/40 font-medium">EAJE Business</span>
            <span className="text-[8px] text-white/20 ml-auto">Today</span>
          </div>
          <div className="max-w-[85%] ml-auto">
            <div className="bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2">
              <p className="text-[12px] text-white/90 leading-relaxed whitespace-pre-wrap">
                {substitutedMessage || 'Your message preview will appear here...'}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[8px] text-white/30">9:41 AM</span>
                <CheckCircle2 className="w-2.5 h-2.5 text-blue-400" />
              </div>
            </div>
          </div>
          {/* Media Attachment Preview */}
          {hasAttachment && (
            <div className="max-w-[85%] ml-auto">
              <div className="bg-[#005c4b] rounded-xl rounded-tr-sm px-2 py-2 mb-1">
                <div className="w-full h-24 rounded-lg bg-white/[0.06] flex items-center justify-center border border-white/[0.08]">
                  <ImageIcon className="w-6 h-6 text-white/20" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Character Count */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-white/30">
            {substitutedMessage ? 'Preview with sample data' : 'No message yet'}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(charPercentage, 100)}%`,
                  background: charPercentage > 90
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : charPercentage > 70
                      ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                      : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
            <span className={`text-[9px] font-mono font-semibold ${
              charPercentage > 90 ? 'text-red-400' : charPercentage > 70 ? 'text-amber-400' : 'text-white/30'
            }`}>
              {charCount}/{charLimit}
            </span>
          </div>
        </div>

        {/* Attachment Toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[11px] text-white/60 font-medium">Attach Media</span>
          </div>
          <button
            onClick={() => setHasAttachment(!hasAttachment)}
            className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${
              hasAttachment ? 'bg-emerald-500/30 border border-emerald-500/40' : 'bg-white/[0.06] border border-white/[0.1]'
            }`}
          >
            <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 ${
              hasAttachment
                ? 'left-5 bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                : 'left-0.5 bg-white/40'
            }`} style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 4. SCHEDULE QUEUE                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="queue"
        icon={<ListChecks className="w-4 h-4" style={{ color: '#f59e0b' }} />}
        title="Schedule Queue"
        badge={`${campaigns.filter(c => c.status === 'pending' || c.status === 'sending').length} ACTIVE`}
        badgeColor="#f59e0b"
        isExpanded={expandedSections.queue}
        onToggle={toggleSection}
      >
        {campaigns.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto text-white/10 mb-2" />
            <p className="text-xs text-white/30">No scheduled campaigns</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
            {campaigns.map((campaign, i) => {
              const config = statusConfig[campaign.status]
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-3 border border-white/[0.05] group"
                >
                  <div className="flex items-start gap-2">
                    {/* Drag Handle */}
                    <div className="mt-1 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical className="w-3 h-3 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-white/80 truncate pr-2">{campaign.name}</span>
                        <span
                          className="text-[8px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold uppercase tracking-wider flex-shrink-0"
                          style={{
                            backgroundColor: `${config.color}10`,
                            color: config.color,
                            borderColor: `${config.color}25`,
                          }}
                        >
                          {config.icon} {config.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/30 mb-1.5 truncate">{campaign.messagePreview}</p>
                      <div className="flex items-center gap-3 text-[9px] text-white/25 mb-1.5">
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {campaign.scheduledTime}</span>
                        <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {campaign.contactsCount.toLocaleString()}</span>
                      </div>
                      {/* Progress bar for active campaigns */}
                      {campaign.status === 'sending' && (
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full progress-shimmer"
                            style={{
                              width: `${campaign.progress}%`,
                              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
                            }}
                          />
                        </div>
                      )}
                      {campaign.status === 'completed' && (
                        <div className="w-full h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/60" style={{ width: '100%' }} />
                        </div>
                      )}
                      {campaign.status === 'paused' && campaign.progress > 0 && (
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500/50"
                            style={{ width: `${campaign.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-white/[0.03]">
                    {campaign.status === 'sending' && (
                      <motion.button
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[9px] font-semibold text-orange-400 hover:bg-orange-500/15 transition-colors"
                      >
                        <Pause className="w-2.5 h-2.5" /> Pause
                      </motion.button>
                    )}
                    {campaign.status === 'paused' && (
                      <motion.button
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-semibold text-indigo-400 hover:bg-indigo-500/15 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5" /> Resume
                      </motion.button>
                    )}
                    {(campaign.status === 'pending' || campaign.status === 'sending' || campaign.status === 'paused') && (
                      <motion.button
                        onClick={() => handleCampaignAction(campaign.id, 'cancel')}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-semibold text-red-400 hover:bg-red-500/15 transition-colors"
                      >
                        <StopCircle className="w-2.5 h-2.5" /> Cancel
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 5. SENDING RULES                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="rules"
        icon={<Shield className="w-4 h-4" style={{ color: '#ef4444' }} />}
        title="Sending Rules"
        badge="SAFETY"
        badgeColor="#ef4444"
        isExpanded={expandedSections.rules}
        onToggle={toggleSection}
      >
        {/* Max messages per hour/day */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-white/40 font-semibold mb-1 block flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400/60" />
              Max/Hour
            </label>
            <input
              type="number"
              value={maxPerHour}
              onChange={e => setMaxPerHour(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-amber-500/30 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 font-semibold mb-1 block flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-red-400/60" />
              Max/Day
            </label>
            <input
              type="number"
              value={maxPerDay}
              onChange={e => setMaxPerDay(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-red-500/30 transition-all"
            />
          </div>
        </div>

        {/* Opt-out Detection */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <span className="text-[11px] text-white/70 font-medium block">Opt-out Keyword Detection</span>
              <span className="text-[9px] text-white/30">STOP, UNSUBSCRIBE, CANCEL</span>
            </div>
          </div>
          <button
            onClick={() => setOptOutDetection(!optOutDetection)}
            className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${
              optOutDetection ? 'bg-emerald-500/30 border border-emerald-500/40' : 'bg-white/[0.06] border border-white/[0.1]'
            }`}
          >
            <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 ${
              optOutDetection
                ? 'left-5 bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                : 'left-0.5 bg-white/40'
            }`} style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Rate Limiting Info */}
        <div className="px-3 py-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Rate limiting helps prevent WhatsApp bans. Recommended: <span className="text-amber-400/80 font-semibold">max 100/hr</span> and <span className="text-amber-400/80 font-semibold">max 500/day</span> per number.
              </p>
            </div>
          </div>
        </div>

        {/* Retry Failed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-[11px] text-white/70 font-medium block">Retry Failed Messages</span>
                <span className="text-[9px] text-white/30">Automatically resend failed messages</span>
              </div>
            </div>
            <button
              onClick={() => setRetryFailed(!retryFailed)}
              className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${
                retryFailed ? 'bg-indigo-500/30 border border-indigo-500/40' : 'bg-white/[0.06] border border-white/[0.1]'
              }`}
            >
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all duration-300 ${
                retryFailed
                  ? 'left-5 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'left-0.5 bg-white/40'
              }`} style={{ width: 18, height: 18 }} />
            </button>
          </div>
          {retryFailed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 pl-5"
            >
              <label className="text-[10px] text-white/40 font-medium">Max retries:</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map(n => (
                  <motion.button
                    key={n}
                    onClick={() => setMaxRetries(n)}
                    whileTap={{ scale: 0.9 }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                      maxRetries === n
                        ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                        : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* 6. SCHEDULE SUMMARY                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <Section
        id="summary"
        icon={<Zap className="w-4 h-4" style={{ color: '#6366f1' }} />}
        title="Schedule Summary"
        badge="READY"
        badgeColor="#6366f1"
        isExpanded={expandedSections.summary}
        onToggle={toggleSection}
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Users className="w-4 h-4" />, label: 'Total Contacts', value: totalContacts.toLocaleString(), color: '#6366f1' },
            { icon: <Timer className="w-4 h-4" />, label: 'Est. Duration', value: estimatedDuration, color: '#f59e0b' },
            { icon: <CalendarDays className="w-4 h-4" />, label: 'Msgs/Day', value: msgsPerDay.toLocaleString(), color: '#8b5cf6' },
            { icon: <DollarSign className="w-4 h-4" />, label: 'Cost Est.', value: `$${costEstimate}`, color: '#22c55e' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-3 text-center"
              style={{ borderLeft: `2px solid ${stat.color}` }}
            >
              <div className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: `${stat.color}12`, color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-sm font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] text-white/30 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick-Start Templates */}
        <div>
          <label className="text-[10px] text-white/30 font-semibold mb-1.5 block flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-indigo-400/60" />
            Quick-Start Templates
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_TEMPLATES.map((template, i) => (
              <motion.button
                key={template.name}
                onClick={() => applyTemplate(template)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="text-left px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-indigo-500/[0.06] hover:border-indigo-500/20 transition-all"
              >
                <p className="text-[10px] font-bold text-white/70">{template.name}</p>
                <p className="text-[8px] text-white/25 mt-0.5">{template.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start Scheduling Button */}
        <motion.button
          onClick={handleStartScheduling}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/25 to-purple-500/25 border border-indigo-500/30 hover:border-indigo-500/50 transition-all"
          style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15), 0 0 40px rgba(99,102,241,0.08)' }}
        >
          <Send className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-extrabold text-indigo-300">Start Scheduling</span>
        </motion.button>
      </Section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* CONFIRMATION MODAL                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card rounded-2xl p-5 w-full max-w-sm border border-indigo-500/20"
              style={{ boxShadow: '0 0 30px rgba(99,102,241,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                  <Send className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white/90">Confirm Schedule</h3>
                  <p className="text-[10px] text-white/40">Review before starting</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Campaign</span>
                  <span className="text-white/80 font-semibold">{campaignName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Contacts</span>
                  <span className="text-indigo-400 font-semibold">{totalContacts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Est. Duration</span>
                  <span className="text-amber-400 font-semibold">{estimatedDuration}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Cost Estimate</span>
                  <span className="text-emerald-400 font-semibold">${costEstimate}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Speed</span>
                  <span className="text-white/70 font-semibold">{msgPerMinute} msg/min</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/40">Active Days</span>
                  <span className="text-white/70 font-semibold">{enabledDays.length} days/week</span>
                </div>
              </div>
              <div className="gradient-divider mb-4" />
              <div className="flex gap-2">
                <motion.button
                  onClick={confirmStart}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/25 to-purple-500/25 border border-indigo-500/30 text-sm font-bold text-indigo-300"
                  style={{ boxShadow: '0 0 15px rgba(99,102,241,0.15)' }}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  Confirm & Start
                </motion.button>
                <motion.button
                  onClick={() => setShowConfirm(false)}
                  whileTap={{ scale: 0.97 }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

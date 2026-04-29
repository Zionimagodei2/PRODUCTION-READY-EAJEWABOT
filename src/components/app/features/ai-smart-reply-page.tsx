'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  ArrowLeft, Bot, Sparkles, Brain, MessageSquare, Zap,
  ToggleLeft, ToggleRight, Clock, Send, Upload, ChevronDown,
  ChevronUp, Plus, Trash2, Edit3, Copy, CheckCircle2,
  AlertTriangle, Gauge, TrendingUp, Eye, Play, X, FileText,
  Smile, Briefcase, Coffee, Layers, Hash, Star, Loader2
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

// ─── Types ───────────────────────────────────────────────────────

type ReplyMode = 'professional' | 'casual' | 'custom' | 'context-aware'
type AIStatus = 'active' | 'inactive' | 'learning'

interface SmartRule {
  id: string
  trigger: string
  responseTemplate: string
  priority: 'high' | 'medium' | 'low'
  active: boolean
  isPrebuilt?: boolean
}

interface ResponseTemplate {
  id: string
  category: 'greetings' | 'faq' | 'follow-ups' | 'appointments' | 'support'
  title: string
  content: string
  variables: string[]
  starred: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  timestamp: Date
  confidence?: number
}

// ─── Constants ───────────────────────────────────────────────────

const modeConfig: Record<ReplyMode, {
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  preview: string
}> = {
  professional: {
    label: 'Professional',
    description: 'Formal business tone with polite, structured responses',
    icon: <Briefcase className="w-4 h-4" />,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    preview: 'Thank you for your inquiry. We will review your request and respond within 24 business hours.',
  },
  casual: {
    label: 'Casual',
    description: 'Friendly conversational style with a warm approach',
    icon: <Coffee className="w-4 h-4" />,
    color: '#22c55e',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    preview: 'Hey! Thanks for reaching out 😊 We\'ll get back to you super soon!',
  },
  custom: {
    label: 'Custom',
    description: 'Define your own personality and response style',
    icon: <Edit3 className="w-4 h-4" />,
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    preview: 'Your custom personality will respond based on your defined instructions.',
  },
  'context-aware': {
    label: 'Context-Aware',
    description: 'Adapts tone and style based on conversation context',
    icon: <Layers className="w-4 h-4" />,
    color: '#06b6d4',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    preview: 'Automatically adjusts — formal for business, casual for friendly chats.',
  },
}

const defaultRules: SmartRule[] = [
  { id: 'r1', trigger: 'hello, hi, hey, good morning, good afternoon', responseTemplate: 'Hello {{name}}! 👋 Thank you for reaching out. How can I assist you today?', priority: 'medium', active: true, isPrebuilt: true },
  { id: 'r2', trigger: 'price, pricing, cost, how much, rate', responseTemplate: 'Great question about pricing! Our plans start at $19.99/mo. Would you like me to send you our full pricing catalog?', priority: 'high', active: true, isPrebuilt: true },
  { id: 'r3', trigger: 'hours, open, close, available, schedule', responseTemplate: 'We\'re available Mon–Fri, 9 AM – 6 PM EST. Weekend support is available via email at support@example.com.', priority: 'medium', active: true, isPrebuilt: true },
  { id: 'r4', trigger: 'thank, thanks, appreciated', responseTemplate: 'You\'re welcome, {{name}}! Don\'t hesitate to reach out if you need anything else. 😊', priority: 'low', active: true, isPrebuilt: true },
  { id: 'r5', trigger: 'appointment, book, schedule, meeting, call', responseTemplate: 'I\'d love to help you schedule that! Our next available slot is {{time}}. Would that work for you?', priority: 'high', active: true, isPrebuilt: true },
]

const defaultTemplates: ResponseTemplate[] = [
  { id: 't1', category: 'greetings', title: 'Welcome Message', content: 'Hello {{name}}! Welcome to our WhatsApp support. How can we help you today? 🎉', variables: ['name'], starred: true },
  { id: 't2', category: 'greetings', title: 'Returning Customer', content: 'Welcome back, {{name}}! Great to see you again. What can we do for you this time?', variables: ['name'], starred: false },
  { id: 't3', category: 'faq', title: 'Business Hours', content: 'We\'re open {{hours}}. Feel free to message us anytime and we\'ll reply during business hours!', variables: ['hours'], starred: true },
  { id: 't4', category: 'faq', title: 'Pricing Info', content: 'Our pricing starts at {{price}}/month. Would you like a detailed breakdown of our plans?', variables: ['price'], starred: false },
  { id: 't5', category: 'follow-ups', title: 'Check-in', content: 'Hi {{name}}! Just checking in — were you able to resolve your issue? Let us know if you need more help! 😊', variables: ['name'], starred: false },
  { id: 't6', category: 'follow-ups', title: 'Feedback Request', content: 'Thanks for choosing us, {{name}}! We\'d love your feedback. On a scale of 1-10, how was your experience?', variables: ['name'], starred: true },
  { id: 't7', category: 'appointments', title: 'Booking Confirmation', content: 'Your appointment is confirmed for {{date}} at {{time}}. Reply CANCEL to reschedule.', variables: ['date', 'time'], starred: false },
  { id: 't8', category: 'appointments', title: 'Reminder', content: 'Reminder: You have an appointment tomorrow at {{time}}. See you there! 📅', variables: ['time'], starred: false },
  { id: 't9', category: 'support', title: 'Ticket Created', content: 'Your support ticket #{{ticket_id}} has been created. We\'ll get back to you within {{response_time}}.', variables: ['ticket_id', 'response_time'], starred: true },
  { id: 't10', category: 'support', title: 'Resolution', content: 'Great news! The issue with ticket #{{ticket_id}} has been resolved. Is there anything else we can help with?', variables: ['ticket_id'], starred: false },
]

const categoryConfig: Record<ResponseTemplate['category'], { label: string; color: string; icon: React.ReactNode }> = {
  greetings: { label: 'Greetings', color: '#22c55e', icon: <Smile className="w-3 h-3" /> },
  faq: { label: 'FAQ', color: '#3b82f6', icon: <Hash className="w-3 h-3" /> },
  'follow-ups': { label: 'Follow-ups', color: '#8b5cf6', icon: <TrendingUp className="w-3 h-3" /> },
  appointments: { label: 'Appointments', color: '#f59e0b', icon: <Clock className="w-3 h-3" /> },
  support: { label: 'Support', color: '#ef4444', icon: <AlertTriangle className="w-3 h-3" /> },
}

const sampleResponses: Record<ReplyMode, { input: string; output: string }[]> = {
  professional: [
    { input: 'Can I get a refund?', output: 'Certainly. I can assist you with the refund process. Could you please provide your order number so I can review your request?' },
    { input: 'When will my order arrive?', output: 'Your order is currently in transit. Based on the tracking information, estimated delivery is within 2-3 business days.' },
  ],
  casual: [
    { input: 'Can I get a refund?', output: 'Hey! Absolutely, no worries 😊 Just share your order number and I\'ll sort that out for you right away!' },
    { input: 'When will my order arrive?', output: 'It\'s on the way! Should be there in about 2-3 days. Want me to send you the tracking link? 📦' },
  ],
  custom: [
    { input: 'Can I get a refund?', output: 'Based on your custom instructions, a personalized refund response would appear here.' },
    { input: 'When will my order arrive?', output: 'Your custom personality would craft a tailored response for delivery inquiries.' },
  ],
  'context-aware': [
    { input: 'Can I get a refund?', output: 'I understand this is important to you. Let me help process your refund request promptly — could you share your order details?', },
    { input: 'When will my order arrive?', output: 'Your order should arrive in 2-3 days! I can send tracking info if you\'d like 😊', },
  ],
}

// Simulated AI canned responses for the Live Preview
const cannedAIResponses: Record<string, { text: string; confidence: number }> = {
  hello: { text: 'Hello! 👋 Welcome to our support. How can I assist you today?', confidence: 96 },
  hi: { text: 'Hi there! Great to hear from you. What can I help you with?', confidence: 97 },
  pricing: { text: 'Our pricing starts at $19.99/month for the Starter plan. Would you like me to walk you through our options?', confidence: 94 },
  hours: { text: 'We\'re available Mon–Fri, 9 AM – 6 PM EST. Weekend support is available via email.', confidence: 95 },
  help: { text: 'I\'m here to help! Could you tell me more about what you need assistance with?', confidence: 92 },
  thanks: { text: 'You\'re welcome! Don\'t hesitate to reach out anytime. 😊', confidence: 98 },
  appointment: { text: 'I can help you schedule an appointment! Our next available slot is tomorrow at 10 AM. Would that work?', confidence: 91 },
  refund: { text: 'I\'d be happy to help with your refund request. Could you provide your order number so I can look into it?', confidence: 93 },
  default: { text: 'Thank you for your message. I\'m looking into this and will get back to you shortly!', confidence: 85 },
}

// ─── Circular Progress Component ─────────────────────────────────

function CircularProgress({ size = 72, strokeWidth = 5, progress = 0, color = '#06b6d4' }: {
  size?: number; strokeWidth?: number; progress?: number; color?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="rgba(255,255,255,0.06)" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1s ease-out',
          filter: `drop-shadow(0 0 6px ${color}50)`,
        }}
      />
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────

export function AiSmartReplyPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  // ── AI Reply Dashboard State ──
  const [enabled, setEnabled] = useState(true)
  const [aiStatus, setAiStatus] = useState<AIStatus>('active')
  const [accuracy, setAccuracy] = useState(94)
  const [avgResponseTime, setAvgResponseTime] = useState(1.2)
  const [autoRepliesToday, setAutoRepliesToday] = useState(47)

  // ── Reply Mode State ──
  const [selectedMode, setSelectedMode] = useState<ReplyMode>('context-aware')

  // ── AI Training State ──
  const [customInstructions, setCustomInstructions] = useState('')
  const [formalSlider, setFormalSlider] = useState(6)
  const [briefSlider, setBriefSlider] = useState(5)
  const [seriousSlider, setSeriousSlider] = useState(4)
  const [showSampleResponses, setShowSampleResponses] = useState(false)
  const [uploadAreaHover, setUploadAreaHover] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [training, setTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)

  // ── Smart Rules State ──
  const [rules, setRules] = useState<SmartRule[]>(defaultRules)
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRuleTrigger, setNewRuleTrigger] = useState('')
  const [newRuleResponse, setNewRuleResponse] = useState('')
  const [newRulePriority, setNewRulePriority] = useState<'high' | 'medium' | 'low'>('medium')

  // ── Response Templates State ──
  const [templates, setTemplates] = useState<ResponseTemplate[]>(defaultTemplates)
  const [activeCategory, setActiveCategory] = useState<ResponseTemplate['category'] | 'all'>('all')
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // ── Live Preview State ──
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', text: 'Hi! I\'m your AI Smart Reply assistant. Send me a test message and I\'ll show you how I\'d respond! 🤖', timestamp: new Date(), confidence: 99 },
  ])
  const [previewInput, setPreviewInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // ── Derived ──
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return templates
    return templates.filter(t => t.category === activeCategory)
  }, [templates, activeCategory])

  const statusConfig = useMemo(() => {
    const configs: Record<AIStatus, { label: string; color: string; bgColor: string; dotClass: string }> = {
      active: { label: 'Active', color: '#22c55e', bgColor: 'bg-green-500/10', dotClass: 'animate-breathe' },
      inactive: { label: 'Inactive', color: '#6b7280', bgColor: 'bg-gray-500/10', dotClass: '' },
      learning: { label: 'Learning', color: '#f59e0b', bgColor: 'bg-amber-500/10', dotClass: 'animate-pulse' },
    }
    return configs[aiStatus]
  }, [aiStatus])

  // ── Handlers ──

  const handleToggleEnabled = useCallback(() => {
    const newVal = !enabled
    setEnabled(newVal)
    setAiStatus(newVal ? 'active' : 'inactive')
    addToast({
      type: newVal ? 'success' : 'info',
      message: newVal ? 'AI Smart Reply activated! Responses will be generated automatically.' : 'AI Smart Reply paused.',
    })
  }, [enabled, addToast])

  const handleStartTraining = useCallback(() => {
    setTraining(true)
    setTrainingProgress(0)
    const steps = [
      { progress: 20, delay: 400 },
      { progress: 45, delay: 600 },
      { progress: 70, delay: 500 },
      { progress: 90, delay: 400 },
      { progress: 100, delay: 300 },
    ]
    let total = 0
    steps.forEach(({ progress, delay }) => {
      total += delay
      setTimeout(() => setTrainingProgress(progress), total)
    })
    setTimeout(() => {
      setTraining(false)
      setAccuracy(Math.min(accuracy + 2, 99))
      addToast({ type: 'success', message: 'AI model updated! Accuracy improved.' })
    }, total + 500)
  }, [accuracy, addToast])

  const handleFileUpload = useCallback(() => {
    const fakeNames = ['chat_export_jan.txt', 'whatsapp_backup.csv', 'conversation_history.json']
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)]
    setUploadedFiles(prev => [...prev, name])
    addToast({ type: 'success', message: `Uploaded ${name}` })
  }, [addToast])

  const handleRemoveFile = useCallback((name: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== name))
  }, [])

  const handleAddRule = useCallback(() => {
    if (!newRuleTrigger.trim() || !newRuleResponse.trim()) return
    const rule: SmartRule = {
      id: `r${Date.now()}`,
      trigger: newRuleTrigger.trim(),
      responseTemplate: newRuleResponse.trim(),
      priority: newRulePriority,
      active: true,
    }
    setRules(prev => [...prev, rule])
    setNewRuleTrigger('')
    setNewRuleResponse('')
    setShowAddRule(false)
    addToast({ type: 'success', message: 'Smart rule added!' })
  }, [newRuleTrigger, newRuleResponse, newRulePriority, addToast])

  const handleToggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }, [])

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
    addToast({ type: 'info', message: 'Rule deleted' })
  }, [addToast])

  const handleStarTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, starred: !t.starred } : t))
  }, [])

  const handleCopyTemplate = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      addToast({ type: 'success', message: 'Copied to clipboard!' })
    }).catch(() => {
      addToast({ type: 'error', message: 'Failed to copy' })
    })
  }, [addToast])

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    addToast({ type: 'info', message: 'Template deleted' })
  }, [addToast])

  const handleStartEditTemplate = useCallback((template: ResponseTemplate) => {
    setEditingTemplate(template.id)
    setEditContent(template.content)
  }, [])

  const handleSaveEditTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, content: editContent } : t))
    setEditingTemplate(null)
    setEditContent('')
    addToast({ type: 'success', message: 'Template updated!' })
  }, [editContent, addToast])

  const handleSendPreview = useCallback(() => {
    if (!previewInput.trim()) return
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: 'user',
      text: previewInput.trim(),
      timestamp: new Date(),
    }
    setPreviewMessages(prev => [...prev, userMsg])
    setPreviewInput('')
    setIsTyping(true)

    // Simulate AI thinking delay
    setTimeout(() => {
      const input = previewInput.trim().toLowerCase()
      let matched = cannedAIResponses.default
      for (const [keyword, response] of Object.entries(cannedAIResponses)) {
        if (keyword !== 'default' && input.includes(keyword)) {
          matched = response
          break
        }
      }
      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`,
        role: 'ai',
        text: matched.text,
        timestamp: new Date(),
        confidence: matched.confidence,
      }
      setPreviewMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
      setAutoRepliesToday(prev => prev + 1)
    }, 800 + Math.random() * 600)
  }, [previewInput])

  // ── Render ──

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">

      {/* ═══════ HEADER ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white/95 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            AI Smart Reply
          </h1>
          <p className="text-[11px] text-white/40">Intelligent reply suggestions</p>
        </div>
        <motion.button
          onClick={handleToggleEnabled}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200"
          style={{
            background: enabled ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
            border: `1px solid ${enabled ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.2)'}`,
            color: enabled ? '#4ade80' : '#9ca3af',
          }}
        >
          {enabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {enabled ? 'ON' : 'OFF'}
        </motion.button>
      </motion.div>

      {/* ═══════ AI REPLY DASHBOARD ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card-inset rounded-2xl p-5 neon-glow-cyan relative overflow-hidden"
      >
        {/* Decorative orbs */}
        <div className="glow-orb w-28 h-28 bg-cyan-500/20 -top-8 -right-8" style={{ animationDelay: '-2s' }} />
        <div className="glow-orb w-20 h-20 bg-cyan-400/15 bottom-0 left-0" style={{ animationDelay: '-5s' }} />

        <div className="relative flex items-start gap-4">
          {/* Accuracy Ring */}
          <div className="relative flex-shrink-0">
            <CircularProgress size={72} strokeWidth={5} progress={accuracy} color="#06b6d4" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-white/95">{accuracy}%</span>
              <span className="text-[7px] text-white/35 font-semibold uppercase tracking-wider">Accuracy</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} style={{ backgroundColor: statusConfig.color, color: statusConfig.color }} />
              <span className="text-[11px] font-bold" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
              {enabled && (
                <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">AI</span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card rounded-xl p-2.5 text-center">
                <Clock className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                <p className="text-sm font-extrabold text-white/95">{avgResponseTime}s</p>
                <p className="text-[8px] text-white/40 font-medium">Avg Response</p>
              </div>
              <div className="glass-card rounded-xl p-2.5 text-center">
                <Zap className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
                <p className="text-sm font-extrabold text-white/95">{autoRepliesToday}</p>
                <p className="text-[8px] text-white/40 font-medium">Auto-Replies Today</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════ REPLY MODE CONFIGURATION ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Reply Mode</h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(modeConfig) as ReplyMode[]).map((mode) => {
            const config = modeConfig[mode]
            const isSelected = selectedMode === mode
            return (
              <motion.button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                whileTap={{ scale: 0.97 }}
                className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor}`
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                }`}
                style={isSelected ? {
                  boxShadow: `0 0 15px ${config.color}15, inset 0 1px 0 ${config.color}10`,
                } : {}}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div style={{ color: isSelected ? config.color : 'rgba(255,255,255,0.35)' }}>{config.icon}</div>
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-white/90' : 'text-white/55'}`}>{config.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-3 h-3 ml-auto" style={{ color: config.color }} />
                  )}
                </div>
                <p className="text-[9px] text-white/35 leading-snug">{config.description}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Preview of selected mode */}
        <div className="glass-card rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" /> Preview
          </p>
          <p className="text-[11px] text-white/60 leading-relaxed italic">&ldquo;{modeConfig[selectedMode].preview}&rdquo;</p>
        </div>
      </motion.div>

      {/* ═══════ AI TRAINING ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">AI Training</h3>
        </div>

        {/* Upload Area */}
        <div
          onClick={handleFileUpload}
          onMouseEnter={() => setUploadAreaHover(true)}
          onMouseLeave={() => setUploadAreaHover(false)}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            uploadAreaHover ? 'border-cyan-500/30 bg-cyan-500/[0.03]' : 'border-white/[0.08] bg-white/[0.01]'
          }`}
        >
          <Upload className="w-6 h-6 text-white/20 mx-auto mb-2" />
          <p className="text-[11px] text-white/40 font-medium">Upload past conversations</p>
          <p className="text-[9px] text-white/20 mt-0.5">.txt, .csv, .json — Max 10MB</p>
        </div>

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-1.5">
            {uploadedFiles.map((name, i) => (
              <motion.div
                key={`${name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400/60" />
                <span className="text-[10px] text-white/55 flex-1 truncate">{name}</span>
                <button onClick={() => handleRemoveFile(name)} className="text-white/20 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom Instructions */}
        <div>
          <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider block mb-1.5">
            Custom Instructions
          </label>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Describe how the AI should respond... e.g., 'Always address the customer by name, be concise but friendly, mention our return policy when asked about refunds'"
            className="w-full h-24 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-cyan-500/30 transition-colors"
          />
        </div>

        {/* Personality Sliders */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Personality</p>

          {/* Formal ↔ Casual */}
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/50 font-medium">Formal</span>
              <span className="text-[9px] text-cyan-400/60 font-bold">{formalSlider}/10</span>
              <span className="text-[10px] text-white/50 font-medium">Casual</span>
            </div>
            <input
              type="range" min={1} max={10} value={formalSlider}
              onChange={(e) => setFormalSlider(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Brief ↔ Detailed */}
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/50 font-medium">Brief</span>
              <span className="text-[9px] text-cyan-400/60 font-bold">{briefSlider}/10</span>
              <span className="text-[10px] text-white/50 font-medium">Detailed</span>
            </div>
            <input
              type="range" min={1} max={10} value={briefSlider}
              onChange={(e) => setBriefSlider(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Serious ↔ Humorous */}
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/50 font-medium">Serious</span>
              <span className="text-[9px] text-cyan-400/60 font-bold">{seriousSlider}/10</span>
              <span className="text-[10px] text-white/50 font-medium">Humorous</span>
            </div>
            <input
              type="range" min={1} max={10} value={seriousSlider}
              onChange={(e) => setSeriousSlider(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Sample Responses */}
        <motion.div className="glass-card rounded-2xl overflow-hidden">
          <motion.button
            onClick={() => setShowSampleResponses(!showSampleResponses)}
            className="w-full flex items-center justify-between p-3.5"
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold text-white/70">Sample Responses</span>
            </div>
            {showSampleResponses ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
          </motion.button>
          <AnimatePresence>
            {showSampleResponses && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3.5 pb-3.5 space-y-2.5">
                  <div className="gradient-divider" />
                  {sampleResponses[selectedMode].map((sample, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="chat-bubble-received rounded-xl p-2.5 rounded-tl-sm">
                        <p className="text-[9px] text-white/25 uppercase tracking-wider font-semibold mb-0.5">Customer</p>
                        <p className="text-[11px] text-white/65">{sample.input}</p>
                      </div>
                      <div className="chat-bubble-sent rounded-xl p-2.5 rounded-tr-sm">
                        <p className="text-[9px] text-green-400/50 uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                          <Bot className="w-2.5 h-2.5" /> AI Reply
                        </p>
                        <p className="text-[11px] text-white/75">{sample.output}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Train Button */}
        <motion.button
          onClick={handleStartTraining}
          disabled={training}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          style={{
            background: training
              ? 'rgba(139,92,246,0.1)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: training ? 'none' : '0 0 15px rgba(139,92,246,0.1)',
            color: '#a78bfa',
          }}
        >
          {training ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Training... {trainingProgress}%
              <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{
                width: `${trainingProgress}%`,
                background: 'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(6,182,212,0.7))',
                transition: 'width 0.4s ease-out',
              }} />
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Update AI Model
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ═══════ SMART RULES ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Smart Rules</h3>
          </div>
          <motion.button
            onClick={() => setShowAddRule(!showAddRule)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Rule
          </motion.button>
        </div>

        {/* Add Rule Form */}
        <AnimatePresence>
          {showAddRule && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 glass-card rounded-xl p-4">
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider font-semibold block mb-1">Trigger Keywords</label>
                  <input
                    value={newRuleTrigger}
                    onChange={(e) => setNewRuleTrigger(e.target.value)}
                    placeholder="e.g., pricing, cost, how much"
                    className="w-full h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/30 uppercase tracking-wider font-semibold block mb-1">Response Template</label>
                  <textarea
                    value={newRuleResponse}
                    onChange={(e) => setNewRuleResponse(e.target.value)}
                    placeholder="e.g., Our pricing starts at {{price}}. Want more details?"
                    className="w-full h-16 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-[11px] text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-cyan-500/30 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Priority:</label>
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewRulePriority(p)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-colors ${
                        newRulePriority === p
                          ? p === 'high' ? 'bg-red-500/15 text-red-400 border-red-500/25'
                            : p === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                            : 'bg-green-500/15 text-green-400 border-green-500/25'
                          : 'bg-white/[0.03] text-white/30 border-white/[0.08]'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAddRule}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2 rounded-lg text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors"
                  >
                    Add Rule
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAddRule(false)}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg text-[11px] font-bold bg-white/[0.03] text-white/40 border border-white/[0.08] hover:text-white/60 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules List */}
        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
          {rules.map((rule) => {
            const priorityConfig = {
              high: { color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
              medium: { color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
              low: { color: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/15' },
            }[rule.priority]
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass-card rounded-xl p-3 transition-opacity ${!rule.active ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-white/70">{rule.trigger}</span>
                      <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-md ${priorityConfig.bg} ${priorityConfig.text} border ${priorityConfig.border}`}>
                        {rule.priority.toUpperCase()}
                      </span>
                      {rule.isPrebuilt && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.04] text-white/30 border border-white/[0.06]">
                          TEMPLATE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      onClick={() => handleToggleRule(rule.id)}
                      whileTap={{ scale: 0.9 }}
                      className="transition-colors"
                      style={{ color: rule.active ? '#4ade80' : '#6b7280' }}
                    >
                      {rule.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteRule(rule.id)}
                      whileTap={{ scale: 0.9 }}
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{rule.responseTemplate}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══════ RESPONSE TEMPLATES GALLERY ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-green-400" />
          </div>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Response Templates</h3>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-[9px] font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-white/[0.08] text-white/70 border-white/[0.12]'
                : 'bg-white/[0.02] text-white/35 border-white/[0.06] hover:border-white/[0.1]'
            }`}
          >
            All ({templates.length})
          </button>
          {(Object.keys(categoryConfig) as ResponseTemplate['category'][]).map(cat => {
            const config = categoryConfig[cat]
            const count = templates.filter(t => t.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[9px] font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeCategory === cat
                    ? `${config.color === '#22c55e' ? 'bg-green-500/10 text-green-400 border-green-500/15' : config.color === '#3b82f6' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' : config.color === '#8b5cf6' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15' : config.color === '#f59e0b' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' : 'bg-red-500/10 text-red-400 border-red-500/15'}`
                    : 'bg-white/[0.02] text-white/35 border-white/[0.06] hover:border-white/[0.1]'
                }`}
              >
                {config.icon}
                {config.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto no-scrollbar">
          {filteredTemplates.map(template => {
            const catConfig = categoryConfig[template.category]
            const isEditing = editingTemplate === template.id
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white/75">{template.title}</span>
                    {template.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: `${catConfig.color}12`,
                        color: catConfig.color,
                        border: `1px solid ${catConfig.color}20`,
                      }}
                    >
                      {catConfig.label}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-16 rounded-lg bg-white/[0.03] border border-cyan-500/20 px-2.5 py-2 text-[11px] text-white/80 resize-none focus:outline-none transition-colors"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleSaveEditTemplate(template.id)}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                      >
                        Save
                      </motion.button>
                      <motion.button
                        onClick={() => setEditingTemplate(null)}
                        whileTap={{ scale: 0.97 }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/[0.03] text-white/35 border border-white/[0.08]"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] text-white/45 leading-relaxed">{template.content}</p>
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[8px] text-white/25 font-semibold">Variables:</span>
                        {template.variables.map(v => (
                          <span key={v} className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/15">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <motion.button
                        onClick={() => handleStartEditTemplate(template)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg bg-white/[0.03] text-white/25 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleCopyTemplate(template.content)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg bg-white/[0.03] text-white/25 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleStarTemplate(template.id)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg bg-white/[0.03] text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Star className={`w-3 h-3 ${template.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </motion.button>
                      <div className="flex-1" />
                      <motion.button
                        onClick={() => handleDeleteTemplate(template.id)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg bg-white/[0.03] text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══════ LIVE PREVIEW PANEL ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card-inset rounded-2xl overflow-hidden neon-glow-cyan relative"
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-400/10 flex items-center justify-center">
            <Play className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-white/80">Live Preview</h3>
            <p className="text-[9px] text-white/30">Test how AI Smart Reply would respond</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-breathe" style={{ color: '#22c55e' }} />
            <span className="text-[8px] font-bold text-green-400">LIVE</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto no-scrollbar">
          {previewMessages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-xl p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-500/15 border border-blue-500/15 rounded-tr-sm'
                  : 'bg-white/[0.04] border border-white/[0.06] rounded-tl-sm'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1 mb-1">
                    <Bot className="w-2.5 h-2.5 text-cyan-400/60" />
                    <span className="text-[8px] text-cyan-400/50 font-bold uppercase tracking-wider">AI Reply</span>
                    {msg.confidence && (
                      <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-400/60 ml-1">
                        {msg.confidence}% conf.
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-white/75 leading-relaxed">{msg.text}</p>
                <p className="text-[8px] text-white/15 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-cyan-400/50 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Bot className="w-2.5 h-2.5" /> Thinking
                  </span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex gap-2">
            <input
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPreview()}
              placeholder="Type a test message..."
              className="flex-1 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors"
            />
            <motion.button
              onClick={handleSendPreview}
              disabled={!previewInput.trim() || isTyping}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.1))',
                border: '1px solid rgba(6,182,212,0.25)',
                boxShadow: '0 0 10px rgba(6,182,212,0.1)',
                color: '#22d3ee',
              }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  MessageSquare, Plus, Trash2, ArrowLeft, Zap, Hash, ToggleLeft,
  Sparkles, Bot, Send, Loader2, Briefcase, ChevronDown, MessageCircle
} from 'lucide-react'
import { useToastStore } from '@/store/toast-store'

interface AutoReplyRule {
  id: string
  trigger: string
  response: string
  active: boolean
  matchType: string
  createdAt: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type PersonalityType = 'professional' | 'friendly' | 'casual' | 'support' | 'sales'

interface AISettings {
  aiMode: boolean
  aiFallback: boolean
  businessName: string
  businessContext: string
  personality: PersonalityType
}

const PERSONALITY_OPTIONS: { id: PersonalityType; label: string; icon: string; color: string }[] = [
  { id: 'professional', label: 'Professional', icon: '💼', color: '#3b82f6' },
  { id: 'friendly', label: 'Friendly', icon: '😊', color: '#22c55e' },
  { id: 'casual', label: 'Casual', icon: '✌️', color: '#f59e0b' },
  { id: 'support', label: 'Support', icon: '🎧', color: '#8b5cf6' },
  { id: 'sales', label: 'Sales', icon: '🎯', color: '#ef4444' },
]

function loadAISettings(): AISettings {
  if (typeof window === 'undefined') {
    return { aiMode: false, aiFallback: false, businessName: '', businessContext: '', personality: 'professional' }
  }
  try {
    const saved = localStorage.getItem('eaje-ai-settings')
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return { aiMode: false, aiFallback: false, businessName: '', businessContext: '', personality: 'professional' }
}

function saveAISettings(settings: AISettings) {
  try {
    localStorage.setItem('eaje-ai-settings', JSON.stringify(settings))
  } catch { /* ignore */ }
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

  // AI Mode states
  const [aiSettings, setAiSettings] = useState<AISettings>(loadAISettings)
  const [testMessage, setTestMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [displayedReply, setDisplayedReply] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Update localStorage when AI settings change
  useEffect(() => {
    saveAISettings(aiSettings)
  }, [aiSettings])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, displayedReply])

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
    switch (type) {
      case 'contains': return 'Contains'
      case 'exact': return 'Exact'
      case 'starts_with': return 'Starts with'
      default: return type
    }
  }

  // Send test message to AI
  const sendTestMessage = async () => {
    if (!testMessage.trim() || isAiThinking) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: testMessage.trim(),
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMsg])
    setTestMessage('')
    setIsAiThinking(true)
    setDisplayedReply('')

    try {
      const previousMessages = chatMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/auto-reply/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: aiSettings.businessContext,
          businessName: aiSettings.businessName || 'EAJE WhatsBot',
          personality: aiSettings.personality,
          previousMessages,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const reply = data.reply || 'Sorry, I could not generate a response.'
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        }
        setChatMessages(prev => [...prev, aiMsg])

        // Typing animation
        setIsTyping(true)
        let charIndex = 0
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = setInterval(() => {
          charIndex++
          setDisplayedReply(reply.slice(0, charIndex))
          if (charIndex >= reply.length) {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
            setIsTyping(false)
            setDisplayedReply('')
          }
        }, 15)
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm having trouble responding right now. Please try again.",
          timestamp: new Date(),
        }])
      }
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
      }])
    } finally {
      setIsAiThinking(false)
    }
  }

  const clearChat = () => {
    setChatMessages([])
    setDisplayedReply('')
    setIsTyping(false)
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
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

      {/* AI Mode Toggle Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl overflow-hidden"
        style={{
          boxShadow: aiSettings.aiMode
            ? '0 0 20px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
            : undefined,
          border: aiSettings.aiMode
            ? '1px solid rgba(168,85,247,0.25)'
            : undefined,
        }}
      >
        {/* Gradient top border when AI mode is on */}
        {aiSettings.aiMode && (
          <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        )}

        <div className="p-4 space-y-4">
          {/* AI Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: aiSettings.aiMode
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))'
                  : 'rgba(255,255,255,0.04)',
                boxShadow: aiSettings.aiMode ? '0 0 12px rgba(168,85,247,0.2)' : undefined,
              }}>
                <Sparkles className="w-4 h-4" style={{
                  color: aiSettings.aiMode ? '#a855f7' : 'rgba(255,255,255,0.3)',
                  filter: aiSettings.aiMode ? 'drop-shadow(0 0 6px rgba(168,85,247,0.5))' : undefined,
                }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/85">AI Auto-Reply</h3>
                <p className="text-[10px] text-white/40">Powered by Gemini</p>
              </div>
            </div>
            <motion.button
              onClick={() => setAiSettings(s => ({ ...s, aiMode: !s.aiMode }))}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{
                background: aiSettings.aiMode
                  ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: aiSettings.aiMode
                  ? '0 0 16px rgba(168,85,247,0.4)'
                  : undefined,
              }}
            >
              <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{
                  transform: aiSettings.aiMode ? 'translateX(26px)' : 'translateX(2px)',
                  width: '20px', height: '20px',
                }}
              />
            </motion.button>
          </div>

          {/* AI Fallback Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400/70" />
              <div>
                <p className="text-xs font-semibold text-white/70">AI Fallback</p>
                <p className="text-[10px] text-white/30">AI responds when no rule matches</p>
              </div>
            </div>
            <motion.button
              onClick={() => setAiSettings(s => ({ ...s, aiFallback: !s.aiFallback }))}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-5.5 rounded-full transition-all relative"
              style={{
                background: aiSettings.aiFallback ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                boxShadow: aiSettings.aiFallback ? '0 0 12px rgba(245,158,11,0.3)' : undefined,
              }}
            >
              <div className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{
                  transform: aiSettings.aiFallback ? 'translateX(20px)' : 'translateX(2px)',
                  width: '18px', height: '18px',
                }}
              />
            </motion.button>
          </div>

          {/* AI Settings - Show when AI mode is on */}
          <AnimatePresence>
            {aiSettings.aiMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Business Name */}
                <div>
                  <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Business Name</label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      value={aiSettings.businessName}
                      onChange={(e) => setAiSettings(s => ({ ...s, businessName: e.target.value }))}
                      placeholder="e.g. EAJE Store"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Business Context */}
                <div>
                  <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Business Context</label>
                  <textarea
                    value={aiSettings.businessContext}
                    onChange={(e) => setAiSettings(s => ({ ...s, businessContext: e.target.value }))}
                    placeholder="Describe your business, products, and services to help AI respond accurately..."
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>

                {/* Personality Selector */}
                <div>
                  <label className="text-[11px] text-white/50 font-medium mb-1.5 block">AI Personality</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PERSONALITY_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.id}
                        onClick={() => setAiSettings(s => ({ ...s, personality: opt.id }))}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl border transition-all duration-200"
                        style={{
                          background: aiSettings.personality === opt.id
                            ? `${opt.color}15`
                            : 'rgba(255,255,255,0.03)',
                          borderColor: aiSettings.personality === opt.id
                            ? `${opt.color}40`
                            : 'rgba(255,255,255,0.06)',
                          boxShadow: aiSettings.personality === opt.id
                            ? `0 0 12px ${opt.color}20`
                            : undefined,
                        }}
                      >
                        <span className="text-sm">{opt.icon}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider"
                          style={{ color: aiSettings.personality === opt.id ? opt.color : 'rgba(255,255,255,0.35)' }}
                        >
                          {opt.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Powered by Gemini Badge */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/15">
                    <Sparkles className="w-3 h-3 text-purple-400/70" />
                    <span className="text-[9px] font-bold text-purple-300/70 uppercase tracking-wider">Powered by Gemini</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* AI Test Chat Section */}
      {aiSettings.aiMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {/* Chat Header */}
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }} />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Test AI Reply</span>
            </div>
            {chatMessages.length > 0 && (
              <motion.button
                onClick={clearChat}
                whileTap={{ scale: 0.95 }}
                className="text-[10px] text-white/30 hover:text-white/50 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
              >
                Clear
              </motion.button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto no-scrollbar min-h-[100px]">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <MessageCircle className="w-8 h-8 text-white/10 mb-2" />
                <p className="text-xs text-white/30">Type a message to test AI auto-reply</p>
              </div>
            )}
            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const isLastAi = msg.role === 'assistant' && i === chatMessages.length - 1
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    isUser
                      ? 'bg-blue-500/15 border border-blue-500/20 rounded-tr-sm'
                      : 'bg-purple-500/10 border border-purple-500/15 rounded-tl-sm'
                  }`}>
                    {!isUser && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400/70" />
                        <span className="text-[8px] font-bold text-purple-400/50 uppercase tracking-wider">AI</span>
                      </div>
                    )}
                    <p className="text-xs text-white/80 leading-relaxed">
                      {isLastAi && isTyping ? displayedReply || msg.content.charAt(0) : msg.content}
                      {isLastAi && isTyping && (
                        <span className="inline-block w-1 h-3 bg-purple-400/70 ml-0.5 animate-pulse" />
                      )}
                    </p>
                    <p className="text-[8px] text-white/20 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              )
            })}
            {/* Thinking indicator */}
            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-purple-500/10 border border-purple-500/15 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-2.5 h-2.5 text-purple-400/70" />
                    <span className="text-[8px] font-bold text-purple-400/50 uppercase tracking-wider">AI</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTestMessage() } }}
                placeholder="Type a test message..."
                disabled={isAiThinking}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all disabled:opacity-50"
              />
              <motion.button
                onClick={sendTestMessage}
                whileTap={{ scale: 0.9 }}
                disabled={isAiThinking || !testMessage.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: testMessage.trim() && !isAiThinking
                    ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: testMessage.trim() && !isAiThinking
                    ? '0 0 12px rgba(168,85,247,0.3)'
                    : undefined,
                }}
              >
                {isAiThinking ? (
                  <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white/70" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-3 text-center card-hover-lift"
          style={{ borderLeft: '2px solid #3b82f6' }}
        >
          <p className="text-lg font-extrabold text-blue-400">{rules.filter(r => r.active).length}</p>
          <p className="text-[10px] text-white/45 font-semibold">Active Rules</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

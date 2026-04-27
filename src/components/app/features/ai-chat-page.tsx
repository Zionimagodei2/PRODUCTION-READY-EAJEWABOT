'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { Bot, Send, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

const quickPrompts = [
  'Optimize my campaigns',
  'Best send times?',
  'Improve reply rates',
  'Help with chatbot',
]

// Sound wave component for AI thinking
function SoundWaveIndicator() {
  return (
    <div className="sound-wave">
      <span /><span /><span /><span /><span />
    </div>
  )
}

export function AiChatPage() {
  const { goBack } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your EAJE AI Assistant. I can help you with campaign optimization, contact management, and automation strategies. What would you like to know?",
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [typingText, setTypingText] = useState('')
  const [showTransition, setShowTransition] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Page transition flash effect
  useEffect(() => {
    const timer = setTimeout(() => setShowTransition(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingText, isThinking, scrollToBottom])

  // Typewriter effect
  useEffect(() => {
    if (!typingMessageId) return
    
    const message = messages.find(m => m.id === typingMessageId)
    if (!message) return
    
    const fullText = message.content
    if (typingText.length >= fullText.length) {
      // Typing complete
      const completedId = typingMessageId
      queueMicrotask(() => {
        setTypingMessageId(null)
        setTypingText('')
        setMessages(prev => prev.map(m => 
          m.id === completedId ? { ...m, isTyping: false } : m
        ))
      })
      return
    }

    const timer = setInterval(() => {
      setTypingText(prev => {
        const nextLength = prev.length + 1
        if (nextLength >= fullText.length) {
          clearInterval(timer)
        }
        return fullText.substring(0, nextLength)
      })
    }, 15)

    return () => clearInterval(timer)
  }, [typingMessageId, typingText.length, messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return
    
    setError(null)
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    try {
      // Build history from last 10 messages
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      })
      
      if (res.ok) {
        const data = await res.json()
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response || "I'm sorry, I couldn't generate a response. Please try again.",
          timestamp: new Date(),
          isTyping: true,
        }
        setIsThinking(false)
        setMessages(prev => [...prev, aiMessage])
        setTypingMessageId(aiMessage.id)
        setTypingText('')
      } else {
        setIsThinking(false)
        setError('Failed to get AI response. Please try again.')
      }
    } catch {
      setIsThinking(false)
      setError('Network error. Please check your connection.')
    }
  }, [isThinking, messages])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }, [inputValue, sendMessage])

  const handleQuickPrompt = useCallback((prompt: string) => {
    sendMessage(prompt)
  }, [sendMessage])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getDisplayContent = (message: ChatMessage) => {
    if (message.id === typingMessageId) {
      return typingText
    }
    if (message.isTyping && typingMessageId !== message.id) {
      return ''
    }
    return message.content
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
      {/* Page Transition Flash */}
      {showTransition && <div className="page-transition-flash" />}

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass-card rounded-xl p-4 neon-glow-orange border border-orange-500/15">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={goBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </motion.button>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20"
              style={{ boxShadow: '0 0 12px rgba(249,115,22,0.15)' }}
            >
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-white/90">AI Assistant</h2>
              <p className="text-[10px] text-white/40">Powered by EAJE Intelligence</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
              <span className="text-[9px] text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 max-h-[calc(100vh-320px)]">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-bubble`}
            >
              <div className={`max-w-[85%] relative ${
                message.role === 'user' 
                  ? 'chat-bubble-sent rounded-2xl rounded-tr-sm chat-bubble-tail-sent'
                  : 'chat-bubble-received rounded-2xl rounded-tl-sm chat-bubble-tail-received'
              } px-4 py-3`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400/70" />
                    <span className="text-[10px] font-medium text-amber-400/70">EAJE AI</span>
                  </div>
                )}
                <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-line">
                  {getDisplayContent(message)}
                  {message.id === typingMessageId && typingText.length < message.content.length && (
                    <span className="inline-block w-0.5 h-4 bg-amber-400/70 ml-0.5 animate-pulse" />
                  )}
                </p>
                {/* Timestamp - hover to reveal */}
                <p className="timestamp-hover text-[9px] text-white/20 mt-1.5 text-right">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking Indicator - Enhanced with sound wave */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start message-bubble"
          >
            <div className="chat-bubble-received rounded-2xl rounded-tl-sm chat-bubble-tail-received px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400/70" />
                <span className="text-[10px] font-medium text-amber-400/70">EAJE AI</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Sound wave indicator */}
                <SoundWaveIndicator />
                <span className="text-[10px] text-white/30">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 max-w-[85%]">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-[11px] text-red-400/80">{error}</p>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, i) => (
            <motion.button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isThinking}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300/80 hover:bg-amber-500/15 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3">
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-2 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isThinking}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white/90 placeholder-white/25 focus:outline-none disabled:opacity-40"
          />
          <motion.button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20 transition-shadow"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}

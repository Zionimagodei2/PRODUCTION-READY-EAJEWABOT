'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, ArrowLeft } from 'lucide-react'
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

const cannedResponses: Record<string, string> = {
  'optimize my campaigns': 'Here are some tips to optimize your campaigns:\n\n1. **Segment your audience** — Group contacts by engagement level, interests, or demographics for targeted messaging.\n\n2. **A/B test your messages** — Try different subject lines, CTAs, and send times to find what works best.\n\n3. **Personalize content** — Use template variables like {name} and {last_purchase} to make messages feel personal.\n\n4. **Monitor delivery rates** — Keep an eye on delivery rates and adjust your contact lists to remove inactive numbers.\n\n5. **Schedule strategically** — Send during peak engagement hours (typically 10am-12pm and 7pm-9pm local time).',
  'best send times': 'Based on WhatsApp messaging data, here are the optimal send times:\n\n📊 **Best Days**: Tuesday through Thursday\n⏰ **Peak Morning**: 10:00 AM - 12:00 PM\n🌆 **Peak Evening**: 7:00 PM - 9:00 PM\n\n**Avoid**: Monday mornings (inbox overload) and Friday evenings (weekend mode)\n\n💡 **Pro Tip**: Use the Scheduler feature to queue messages at optimal times for each timezone. Your audience in different regions may respond better at different hours.',
  'improve reply rates': 'Here are proven strategies to boost your reply rates:\n\n1. **Ask questions** — End messages with a clear, simple question to encourage responses.\n\n2. **Keep it concise** — Messages under 160 characters get 2x more replies.\n\n3. **Use emojis strategically** — 1-2 relevant emojis increase engagement without looking unprofessional.\n\n4. **Create urgency** — Limited-time offers and deadlines drive faster responses.\n\n5. **Follow up** — Send a gentle reminder 24-48 hours after your first message.\n\n6. **Use Auto Reply** — Set up instant responses to keep conversations going even when you\'re away.',
  'help with chatbot': 'I can help you build effective chatbot flows! Here\'s a quick guide:\n\n🤖 **Getting Started**:\n- Go to the Chatbot Builder to create a new flow\n- Start with a Welcome Message node\n- Add Condition nodes to branch based on user input\n- Use Action nodes to trigger automations\n\n📋 **Best Practices**:\n1. Always offer a menu of options (1-4 choices)\n2. Include a "Talk to human" escape hatch\n3. Keep each message focused on one action\n4. Test your flows before going live\n\n🔧 **Popular Flows**:\n- Customer FAQ Bot\n- Order Status Checker\n- Appointment Scheduler\n- Lead Qualification Bot',
}

function getSmartResponse(message: string): string {
  const lower = message.toLowerCase()
  
  // Check for direct matches with quick prompts
  for (const [key, value] of Object.entries(cannedResponses)) {
    if (lower.includes(key) || key.includes(lower.substring(0, 10))) {
      return value
    }
  }
  
  // Keyword-based responses
  if (lower.includes('campaign') || lower.includes('broadcast') || lower.includes('blast')) {
    return cannedResponses['optimize my campaigns']
  }
  if (lower.includes('time') || lower.includes('schedule') || lower.includes('when') || lower.includes('send')) {
    return cannedResponses['best send times']
  }
  if (lower.includes('reply') || lower.includes('response') || lower.includes('rate') || lower.includes('engagement')) {
    return cannedResponses['improve reply rates']
  }
  if (lower.includes('chatbot') || lower.includes('bot') || lower.includes('flow') || lower.includes('automat')) {
    return cannedResponses['help with chatbot']
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! 👋 Great to see you here. I can help you with:\n\n• Campaign optimization strategies\n• Best send times for your audience\n• Tips to improve reply rates\n• Chatbot flow building\n• Contact management\n• Automation setup\n\nWhat would you like to explore?'
  }
  if (lower.includes('contact') || lower.includes('lead') || lower.includes('scraper')) {
    return 'Here are some tips for contact management:\n\n📱 **Growing Your List**:\n- Use the Lead Scraper to find potential customers\n- Extract group members with Group Extractor\n- Create WhatsApp links for easy opt-ins\n\n✅ **List Hygiene**:\n- Remove inactive contacts regularly\n- Segment by engagement level\n- Tag contacts for targeted campaigns\n\n⚠️ **Compliance**:\n- Always get consent before messaging\n- Include opt-out instructions\n- Respect WhatsApp\'s anti-spam policies'
  }
  if (lower.includes('template') || lower.includes('message')) {
    return 'Templates can save you a lot of time! Here\'s how to use them effectively:\n\n📝 **Creating Templates**:\n- Use variables like {name}, {date}, {product} for personalization\n- Keep templates under 160 characters when possible\n- Create category-specific templates (welcome, follow-up, promo)\n\n💡 **Pro Tips**:\n- A/B test different template versions\n- Star your most-used templates for quick access\n- Use the Templates feature in Core Automation to manage them\n\nCheck out the Templates page to create and manage your message templates!'
  }
  if (lower.includes('analytics') || lower.includes('report') || lower.includes('metric') || lower.includes('stat')) {
    return 'Analytics are key to improving your WhatsApp strategy! Here\'s what to track:\n\n📊 **Key Metrics**:\n- **Delivery Rate**: Aim for 95%+\n- **Read Rate**: Typical is 70-80%\n- **Reply Rate**: Good benchmark is 15-25%\n- **Conversion Rate**: Track link clicks and actions\n\n📈 **Using Reports**:\n- Check Campaign Reports after each broadcast\n- Compare performance across campaigns\n- Identify your best-performing message types\n\nVisit the Analytics and Campaign Reports pages for detailed insights!'
  }
  
  // Default response
  return 'That\'s a great question! While I\'m most helpful with WhatsApp business automation topics, I\'ll do my best to assist you.\n\nHere are the areas where I can provide the most value:\n\n🚀 **Campaign Strategy** — Optimization, timing, targeting\n💬 **Auto Reply & Chatbot** — Setup, flows, best practices\n📊 **Analytics** — Metrics, reports, insights\n📱 **Contact Management** — Growth, segmentation, hygiene\n🔧 **Automation** — Templates, scheduling, workflows\n\nCould you rephrase your question or pick one of these topics? I\'d love to help!'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    // Simulate AI thinking delay then try API
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })
      
      if (res.ok) {
        const data = await res.json()
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          isTyping: true,
        }
        setIsThinking(false)
        setMessages(prev => [...prev, aiMessage])
        setTypingMessageId(aiMessage.id)
        setTypingText('')
        return
      }
    } catch {
      // API failed, fall through to canned response
    }

    // Fallback to smart canned response
    setTimeout(() => {
      const responseText = getSmartResponse(text)
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isTyping: true,
      }
      setIsThinking(false)
      setMessages(prev => [...prev, aiMessage])
      setTypingMessageId(aiMessage.id)
      setTypingText('')
    }, 1000)
  }, [isThinking])

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
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20">
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
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${
                message.role === 'user' 
                  ? 'bg-blue-500/10 border border-blue-500/15 rounded-2xl rounded-tr-sm' 
                  : 'bg-purple-500/10 border border-purple-500/15 rounded-2xl rounded-tl-sm'
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
                <p className="text-[9px] text-white/20 mt-1.5 text-right">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-purple-500/10 border border-purple-500/15 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-400/70" />
                <span className="text-[10px] font-medium text-amber-400/70">EAJE AI</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.div
                  className="w-2 h-2 rounded-full bg-purple-400/60"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-purple-400/60"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                />
                <motion.div
                  className="w-2 h-2 rounded-full bg-purple-400/60"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt) => (
            <motion.button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isThinking}
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

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MessageCircle, Search, Check, CheckCheck,
  Plus, MessageSquare, Users, BarChart3, Phone, Trash2, Archive,
  Loader2
} from 'lucide-react'

interface ConversationThread {
  contactId: string
  contactName: string
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
  messageStatus: 'read' | 'sent' | 'none'
  avatarColor: string
  totalMessages: number
  isOnline: boolean
}

interface ApiConversation {
  id: string
  contactId: string
  contactName: string
  direction: string
  content: string
  timestamp: string
  createdAt: string
}

type FilterTab = 'all' | 'unread'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
}

const conversationItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// Swipe action definitions
const swipeActions = [
  { icon: Phone, label: 'Call', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { icon: Archive, label: 'Archive', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { icon: Trash2, label: 'Delete', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
]

const avatarColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444']

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function InboxPage() {
  const { goBack, setSelectedContactId, setActiveFeature } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [showTransition, setShowTransition] = useState(true)
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      const responseData = await res.json()
      const data: ApiConversation[] = responseData.conversations || []

      // Group by contactId to create threads
      const threadMap = new Map<string, ApiConversation[]>()

      for (const conv of data) {
        const key = conv.contactId || conv.contactName || 'unknown'
        if (!threadMap.has(key)) {
          threadMap.set(key, [])
        }
        threadMap.get(key)!.push(conv)
      }

      // Build thread objects
      const builtThreads: ConversationThread[] = []

      for (const [contactId, messages] of threadMap) {
        // Sort messages by timestamp descending (most recent first)
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        const latest = messages[0]
        const unreadCount = messages.filter(m => m.direction === 'incoming').length

        // Determine message status based on last outgoing message
        const hasOutgoing = messages.some(m => m.direction === 'outgoing')
        const lastOutgoing = messages.find(m => m.direction === 'outgoing')
        let messageStatus: 'read' | 'sent' | 'none' = 'none'
        if (lastOutgoing) {
          messageStatus = 'sent'
        }
        if (hasOutgoing && unreadCount === 0) {
          messageStatus = 'read'
        }

        builtThreads.push({
          contactId,
          contactName: latest.contactName || 'Unknown Contact',
          lastMessage: latest.content,
          lastTimestamp: latest.timestamp,
          unreadCount,
          messageStatus,
          avatarColor: getAvatarColor(contactId),
          totalMessages: messages.length,
          isOnline: false, // We don't have real online status data
        })
      }

      // Sort threads by most recent message
      builtThreads.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime())

      setThreads(builtThreads)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Page transition flash effect
  useEffect(() => {
    const timer = setTimeout(() => setShowTransition(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filteredConversations = useMemo(() => {
    let filtered = threads

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) => c.contactName.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query)
      )
    }

    // Apply tab filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0)
    }

    return filtered
  }, [searchQuery, activeFilter, threads])

  const totalConversations = threads.length
  const totalUnread = threads.reduce((sum, c) => sum + c.unreadCount, 0)
  const responseRate = threads.length > 0
    ? Math.round((threads.filter(t => t.messageStatus === 'read' || t.messageStatus === 'sent').length / threads.length) * 100)
    : 0

  const handleConversationClick = (thread: ConversationThread) => {
    setSelectedContactId(thread.contactId)
    setActiveFeature('contact-detail')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalConversations },
    { key: 'unread', label: 'Unread', count: threads.filter((c) => c.unreadCount > 0).length },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Page Transition Flash */}
      {showTransition && <div className="page-transition-flash" />}

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
            <MessageCircle className="w-5 h-5 text-green-400 neon-text-glow-green" />
            <h1 className="text-lg font-extrabold text-white/95">Inbox</h1>
          </div>
          <p className="text-[11px] text-white/50 mt-0.5">All conversations</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="glass-card rounded-xl p-3 text-center stat-card-green card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{totalConversations}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Conversations</p>
          {/* Mini progress */}
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500/50 to-green-400/50 progress-shimmer" style={{ width: '85%', backgroundSize: '200% 100%' }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-blue card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{totalUnread}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Unread</p>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500/50 to-blue-400/50" style={{ width: `${totalConversations > 0 ? Math.min((totalUnread / totalConversations) * 100, 100) : 0}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-purple card-hover-lift">
          <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{responseRate}%</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Response Rate</p>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500/50 to-purple-400/50" style={{ width: `${responseRate}%` }} />
          </div>
        </div>
      </motion.div>

      <div className="gradient-divider" />

      {/* Search Bar - Enhanced with animated focus */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
          searchFocused ? 'text-green-400' : 'text-white/30'
        }`} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white/90 placeholder:text-white/30 focus:outline-none transition-all duration-300 search-focus-ring ${
            searchFocused
              ? 'border-green-500/30 bg-white/[0.07] shadow-[0_0_12px_rgba(34,197,94,0.08)]'
              : 'border-white/8'
          }`}
        />
        {searchFocused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-green-500/40 via-green-400/60 to-green-500/40 rounded-full origin-left"
          />
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative"
      >
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          {filters.map((filter) => (
            <motion.button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              whileTap={{ scale: 0.95 }}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeFilter === filter.key
                  ? 'text-green-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {activeFilter === filter.key && (
                <motion.div
                  layoutId="inboxFilterIndicator"
                  className="absolute inset-0 rounded-lg bg-green-500/10 border border-green-500/15"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
              <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                activeFilter === filter.key
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/30'
              }`}>
                {filter.count}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-green-400/50 animate-spin mb-3" />
          <p className="text-sm text-white/40">Loading conversations...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="w-10 h-10 text-red-400/30 mb-3" />
          <p className="text-sm text-red-400/60 font-medium">{error}</p>
          <motion.button
            onClick={fetchConversations}
            whileTap={{ scale: 0.95 }}
            className="mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 font-medium hover:bg-white/10 transition-colors"
          >
            Retry
          </motion.button>
        </div>
      )}

      {/* Conversation List */}
      {!isLoading && !error && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="glass-card rounded-2xl overflow-hidden"
        >
          <AnimatePresence mode="popLayout">
            {filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="empty-state py-12"
              >
                <MessageCircle className="w-10 h-10 text-white/10 mb-3" />
                {threads.length === 0 ? (
                  <>
                    <p className="text-sm text-white/40 font-medium">No conversations yet</p>
                    <p className="text-xs text-white/25 mt-1">Start a conversation by sending a message to a contact</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/40 font-medium">No conversations found</p>
                    <p className="text-xs text-white/25 mt-1">Try adjusting your search or filters</p>
                  </>
                )}
              </motion.div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.contactId}
                  variants={conversationItem}
                  layout
                  onClick={() => handleConversationClick(conversation)}
                  onMouseEnter={() => setHoveredConvId(conversation.contactId)}
                  onMouseLeave={() => setHoveredConvId(null)}
                  className="relative flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-all duration-200 group swipe-hint"
                  whileHover={{
                    boxShadow: conversation.unreadCount > 0
                      ? '0 0 15px rgba(34,197,94,0.08)'
                      : '0 0 10px rgba(255,255,255,0.02)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white/80"
                      style={{
                        background: `linear-gradient(135deg, ${conversation.avatarColor}40, ${conversation.avatarColor}15)`,
                        border: `1.5px solid ${conversation.avatarColor}30`,
                        boxShadow: conversation.unreadCount > 0 ? `0 0 12px ${conversation.avatarColor}15` : 'none'
                      }}
                    >
                      {getInitials(conversation.contactName)}
                    </div>
                    {/* Online status dot */}
                    {conversation.isOnline && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0c0c14] online-status-ring"
                        style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
                      />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-[13px] font-bold truncate ${
                        conversation.unreadCount > 0 ? 'text-white/95' : 'text-white/70'
                      }`}>
                        {conversation.contactName}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-medium ${
                          conversation.unreadCount > 0 ? 'text-green-400/60' : 'text-white/30'
                        }`}>
                          {formatRelativeTime(conversation.lastTimestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Last message */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[11px] truncate leading-relaxed ${
                        conversation.unreadCount > 0 ? 'text-white/60' : 'text-white/40'
                      }`}>
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Message status icon */}
                        {conversation.messageStatus === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400/60" />
                        )}
                        {conversation.messageStatus === 'sent' && (
                          <Check className="w-3.5 h-3.5 text-white/25" />
                        )}
                        {/* Unread badge */}
                        {conversation.unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-[9px] font-bold text-white px-1 unread-badge-pulse"
                            style={{
                              boxShadow: '0 0 8px rgba(34,197,94,0.4), 0 0 16px rgba(34,197,94,0.15)'
                            }}
                          >
                            {conversation.unreadCount}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Swipe action hints - visible on hover */}
                  <AnimatePresence>
                    {hoveredConvId === conversation.contactId && (
                      <motion.div
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="flex items-center gap-0.5 flex-shrink-0"
                      >
                        {swipeActions.map((action) => (
                          <motion.div
                            key={action.label}
                            whileHover={{ scale: 1.15 }}
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ background: action.bg }}
                          >
                            <action.icon className="w-3 h-3" style={{ color: action.color }} />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle divider (not on last item) */}
                  {index < filteredConversations.length - 1 && (
                    <div className="absolute bottom-0 left-16 right-4 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB - New Conversation */}
      <motion.button
        onClick={() => setActiveFeature('send-message')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg z-30 animate-fab-pulse"
        style={{
          boxShadow: '0 0 20px rgba(34,197,94,0.35), 0 4px 15px rgba(0,0,0,0.3)'
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  ArrowLeft, MessageCircle, Search, Check, CheckCheck,
  Plus, MessageSquare, Users, BarChart3, Phone, Trash2, Archive,
  Loader2, Pin, Send, MoreVertical, Eye, EyeOff, X, Reply, CornerDownLeft
} from 'lucide-react'

interface ConversationThread {
  contactId: string
  contactName: string
  contactPhone: string
  lastMessage: string
  lastTimestamp: string
  unreadCount: number
  totalMessages: number
  isPinned: boolean
  isArchived: boolean
  lastDirection: string
  lastStatus: string
  isOnline: boolean
}

interface ChatMessage {
  id: string
  contactId: string
  contactName: string
  contactPhone: string
  direction: string
  content: string
  status: string
  isRead: boolean
  mediaType: string
  mediaUrl: string
  timestamp: string
  createdAt: string
  readAt: string | null
}

type FilterTab = 'all' | 'unread' | 'groups' | 'archived'

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
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

function truncatePreview(text: string, maxLen = 42): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '…'
}

export function InboxPage() {
  const { goBack, setActiveFeature } = useAppStore()
  const { addToast } = useToastStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [showTransition, setShowTransition] = useState(true)
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Thread view state
  const [activeThread, setActiveThread] = useState<ConversationThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)

  // Quick actions menu
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (activeFilter !== 'all') params.set('filter', activeFilter)

      const res = await fetch(`/api/conversations?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch conversations')
      const data = await res.json()

      // Use threads from API if available, otherwise build from raw conversations
      if (data.threads && data.threads.length > 0) {
        setThreads(data.threads.map((t: ConversationThread) => ({
          ...t,
          avatarColor: getAvatarColor(t.contactId),
          isOnline: false,
        })))
      } else if (data.conversations && data.conversations.length > 0) {
        // Fallback: build threads from raw messages
        const threadMap = new Map<string, ConversationThread>()
        for (const conv of data.conversations) {
          const key = conv.contactId || conv.contactName || 'unknown'
          const existing = threadMap.get(key)
          if (!existing) {
            threadMap.set(key, {
              contactId: conv.contactId || key,
              contactName: conv.contactName || 'Unknown Contact',
              contactPhone: conv.contactPhone || '',
              lastMessage: conv.content,
              lastTimestamp: conv.timestamp,
              unreadCount: !conv.isRead && conv.direction === 'incoming' ? 1 : 0,
              totalMessages: 1,
              isPinned: conv.isPinned || false,
              isArchived: conv.isArchived || false,
              lastDirection: conv.direction,
              lastStatus: conv.status || 'sent',
              isOnline: false,
            })
          } else {
            existing.totalMessages += 1
            if (!conv.isRead && conv.direction === 'incoming') existing.unreadCount += 1
            if (new Date(conv.timestamp) > new Date(existing.lastTimestamp)) {
              existing.lastMessage = conv.content
              existing.lastTimestamp = conv.timestamp
              existing.lastDirection = conv.direction
              existing.lastStatus = conv.status || 'sent'
            }
            if (conv.isPinned) existing.isPinned = true
          }
        }
        setThreads(Array.from(threadMap.values()).map(t => ({ ...t, avatarColor: getAvatarColor(t.contactId) })))
      } else {
        setThreads([])
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, activeFilter])

  // Page transition flash effect
  useEffect(() => {
    const timer = setTimeout(() => setShowTransition(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Fetch conversations on mount and when filters change
  useEffect(() => {
    queueMicrotask(() => {
      fetchConversations()
    })
  }, [fetchConversations])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = useCallback(async (contactId: string) => {
    try {
      setMessagesLoading(true)
      const res = await fetch(`/api/conversations?view=messages&contactId=${encodeURIComponent(contactId)}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      addToast({ type: 'error', title: 'Failed', message: 'Could not load messages' })
    } finally {
      setMessagesLoading(false)
    }
  }, [addToast])

  const handleConversationClick = (thread: ConversationThread) => {
    setActiveThread(thread)
    fetchMessages(thread.contactId)
    // Mark as read
    if (thread.unreadCount > 0) {
      fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', contactId: thread.contactId }),
      }).then(() => {
        setThreads(prev => prev.map(t =>
          t.contactId === thread.contactId ? { ...t, unreadCount: 0 } : t
        ))
      }).catch(() => {})
    }
  }

  const handleBackFromThread = () => {
    setActiveThread(null)
    setMessages([])
    setReplyText('')
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return
    setSendingReply(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: activeThread.contactId,
          contactName: activeThread.contactName,
          contactPhone: activeThread.contactPhone,
          content: replyText.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const newMsg = await res.json()
      setMessages(prev => [...prev, newMsg])
      setReplyText('')
      // Update thread
      setThreads(prev => prev.map(t =>
        t.contactId === activeThread.contactId
          ? { ...t, lastMessage: replyText.trim(), lastTimestamp: newMsg.timestamp, lastDirection: 'outgoing', lastStatus: 'sent' }
          : t
      ))
    } catch {
      addToast({ type: 'error', title: 'Send Failed', message: 'Could not send reply' })
    } finally {
      setSendingReply(false)
    }
  }

  const handleQuickAction = async (action: string, thread: ConversationThread) => {
    setActionsMenuId(null)
    try {
      const res = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, contactId: thread.contactId }),
      })
      if (!res.ok) throw new Error('Action failed')
      
      // Update local state
      if (action === 'mark-read') {
        setThreads(prev => prev.map(t => t.contactId === thread.contactId ? { ...t, unreadCount: 0 } : t))
        addToast({ type: 'success', title: 'Marked as read' })
      } else if (action === 'mark-unread') {
        setThreads(prev => prev.map(t => t.contactId === thread.contactId ? { ...t, unreadCount: 1 } : t))
        addToast({ type: 'success', title: 'Marked as unread' })
      } else if (action === 'pin') {
        setThreads(prev => prev.map(t => t.contactId === thread.contactId ? { ...t, isPinned: true } : t))
        addToast({ type: 'success', title: 'Conversation pinned' })
      } else if (action === 'unpin') {
        setThreads(prev => prev.map(t => t.contactId === thread.contactId ? { ...t, isPinned: false } : t))
        addToast({ type: 'success', title: 'Conversation unpinned' })
      } else if (action === 'archive') {
        setThreads(prev => prev.filter(t => t.contactId !== thread.contactId))
        addToast({ type: 'success', title: 'Conversation archived' })
      } else if (action === 'unarchive') {
        setThreads(prev => prev.map(t => t.contactId === thread.contactId ? { ...t, isArchived: false } : t))
        addToast({ type: 'success', title: 'Conversation unarchived' })
      }
    } catch {
      addToast({ type: 'error', title: 'Action Failed', message: 'Could not perform action' })
    }
  }

  const filteredConversations = useMemo(() => {
    let filtered = threads

    // Apply search filter (client-side for real-time)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.contactName.toLowerCase().includes(query) ||
          (c.contactPhone && c.contactPhone.includes(query)) ||
          c.lastMessage.toLowerCase().includes(query)
      )
    }

    // Apply tab filter (client-side)
    if (activeFilter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0)
    } else if (activeFilter === 'archived') {
      filtered = filtered.filter((c) => c.isArchived)
    } else if (activeFilter === 'groups') {
      // Groups heuristic: multiple participants or group-like names
      filtered = filtered.filter((c) => c.contactName.toLowerCase().includes('group') || c.totalMessages > 5)
    } else {
      // All: exclude archived
      filtered = filtered.filter((c) => !c.isArchived)
    }

    return filtered
  }, [searchQuery, activeFilter, threads])

  const totalConversations = threads.filter(c => !c.isArchived).length
  const totalUnread = threads.reduce((sum, c) => sum + c.unreadCount, 0)
  const responseRate = threads.length > 0
    ? Math.round((threads.filter(t => t.lastStatus === 'read' || t.lastStatus === 'delivered').length / threads.length) * 100)
    : 0
  const pinnedCount = threads.filter(c => c.isPinned && !c.isArchived).length
  const archivedCount = threads.filter(c => c.isArchived).length
  const groupsCount = threads.filter(c => c.contactName.toLowerCase().includes('group') || c.totalMessages > 5).length

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
    { key: 'groups', label: 'Groups', count: groupsCount },
    { key: 'archived', label: 'Archived', count: archivedCount },
  ]

  // ====================== THREAD VIEW ======================
  if (activeThread) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-lg mx-auto">
        {/* Thread Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <motion.button
            onClick={handleBackFromThread}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white/95 truncate">{activeThread.contactName}</h2>
            <p className="text-[10px] text-white/40">{activeThread.contactPhone || 'No phone'}</p>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => handleQuickAction(activeThread.isPinned ? 'unpin' : 'pin', activeThread)}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Pin className={`w-3.5 h-3.5 ${activeThread.isPinned ? 'text-green-400' : 'text-white/30'}`} />
            </motion.button>
            <motion.button
              onClick={() => setActionsMenuId(actionsMenuId === activeThread.contactId ? null : activeThread.contactId)}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
            >
              <MoreVertical className="w-3.5 h-3.5 text-white/30" />
              {/* Actions dropdown */}
              <AnimatePresence>
                {actionsMenuId === activeThread.contactId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-10 w-44 glass-card rounded-xl py-1.5 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => handleQuickAction(activeThread.unreadCount > 0 ? 'mark-read' : 'mark-unread', activeThread)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-white/70 hover:bg-white/[0.06] transition-colors"
                    >
                      {activeThread.unreadCount > 0 ? <Eye className="w-3.5 h-3.5 text-white/40" /> : <EyeOff className="w-3.5 h-3.5 text-white/40" />}
                      {activeThread.unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}
                    </button>
                    <button
                      onClick={() => handleQuickAction('archive', activeThread)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-white/70 hover:bg-white/[0.06] transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-white/40" />
                      Archive
                    </button>
                    <button
                      onClick={() => handleQuickAction(activeThread.isPinned ? 'unpin' : 'pin', activeThread)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-white/70 hover:bg-white/[0.06] transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5 text-white/40" />
                      {activeThread.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-green-400/50 animate-spin mb-3" />
              <p className="text-xs text-white/40">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-sm text-white/40">No messages yet</p>
              <p className="text-xs text-white/25 mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.direction === 'outgoing' ? 'chat-bubble-sent' : 'chat-bubble-received'} rounded-2xl px-3.5 py-2.5 message-bubble`}>
                  {/* Media attachment */}
                  {msg.mediaType === 'image' && msg.mediaUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <div className="w-full h-32 bg-white/5 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white/20" />
                      </div>
                    </div>
                  )}
                  {msg.mediaType === 'document' && (
                    <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <MessageSquare className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] text-white/50">Document attachment</span>
                    </div>
                  )}
                  {msg.mediaType === 'audio' && (
                    <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-0.5">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-0.5 bg-green-400/40 rounded-full" style={{ height: `${Math.max(4, Math.random() * 14)}px` }} />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/50">0:{String(Math.floor(Math.random() * 50 + 10)).padStart(2, '0')}</span>
                    </div>
                  )}
                  {/* Message text */}
                  <p className="text-[13px] text-white/85 leading-relaxed break-words">{msg.content}</p>
                  {/* Timestamp & read receipt */}
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-[9px] text-white/25 timestamp-hover">{formatMessageTime(msg.timestamp)}</span>
                    {msg.direction === 'outgoing' && (
                      msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-400/70" /> :
                      msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/30" /> :
                      <Check className="w-3 h-3 text-white/25" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() } }}
                placeholder="Type a message..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-2.5 pr-10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-green-500/30 transition-all"
              />
              <CornerDownLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            </div>
            <motion.button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendingReply}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                replyText.trim()
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
              style={replyText.trim() ? { boxShadow: '0 0 15px rgba(34,197,94,0.3)' } : undefined}
            >
              {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // ====================== CONVERSATION LIST VIEW ======================
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
        {/* Unread summary badge */}
        {totalUnread > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-breathe" style={{ color: '#22c55e' }} />
            <span className="text-[10px] font-bold text-green-400">{totalUnread}</span>
          </motion.div>
        )}
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

      {/* Search Bar */}
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
          placeholder="Search by name, phone, or message..."
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
        {searchQuery && (
          <motion.button
            onClick={() => setSearchQuery('')}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-3 h-3 text-white/50" />
          </motion.button>
        )}
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
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
            <motion.button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
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
                  onMouseLeave={() => { setHoveredConvId(null); setActionsMenuId(null) }}
                  className={`relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 group conversation-card-glow ${
                    conversation.unreadCount > 0 ? 'bg-green-500/[0.02]' : 'hover:bg-white/[0.03]'
                  }`}
                  whileHover={{
                    boxShadow: conversation.unreadCount > 0
                      ? '0 0 20px rgba(34,197,94,0.1), 0 0 40px rgba(34,197,94,0.04)'
                      : '0 0 12px rgba(255,255,255,0.03)',
                    backgroundColor: conversation.unreadCount > 0
                      ? 'rgba(34,197,94,0.03)'
                      : 'rgba(255,255,255,0.03)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Pinned indicator */}
                  {conversation.isPinned && (
                    <div className="absolute top-2 right-3">
                      <Pin className="w-3 h-3 text-green-400/40" />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white/80"
                      style={{
                        background: `linear-gradient(135deg, ${getAvatarColor(conversation.contactId)}40, ${getAvatarColor(conversation.contactId)}15)`,
                        border: `1.5px solid ${getAvatarColor(conversation.contactId)}30`,
                        boxShadow: conversation.unreadCount > 0 ? `0 0 12px ${getAvatarColor(conversation.contactId)}15` : 'none'
                      }}
                    >
                      {getInitials(conversation.contactName)}
                    </div>
                    {conversation.isOnline && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0c0c14] online-status-ring"
                        style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
                      />
                    )}
                    {conversation.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-[9px] font-bold text-white px-1 unread-badge-pulse"
                        style={{
                          boxShadow: '0 0 8px rgba(34,197,94,0.4), 0 0 16px rgba(34,197,94,0.15)'
                        }}
                      >
                        {conversation.unreadCount}
                      </motion.div>
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

                    {/* Last message preview */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-[11px] truncate leading-relaxed ${
                        conversation.unreadCount > 0 ? 'text-white/60' : 'text-white/40'
                      }`}>
                        {conversation.lastDirection === 'outgoing' && (
                          <span className="text-white/30">You: </span>
                        )}
                        {truncatePreview(conversation.lastMessage)}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Read receipts */}
                        {conversation.lastDirection === 'outgoing' && conversation.lastStatus === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400/60" />
                        )}
                        {conversation.lastDirection === 'outgoing' && conversation.lastStatus === 'delivered' && (
                          <CheckCheck className="w-3.5 h-3.5 text-white/25" />
                        )}
                        {conversation.lastDirection === 'outgoing' && conversation.lastStatus === 'sent' && (
                          <Check className="w-3.5 h-3.5 text-white/25" />
                        )}
                        {conversation.totalMessages > 0 && conversation.unreadCount === 0 && (
                          <span className="text-[9px] text-white/20 font-medium">{conversation.totalMessages}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick action hints on hover */}
                  <AnimatePresence>
                    {hoveredConvId === conversation.contactId && (
                      <motion.div
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="flex items-center gap-0.5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          onClick={(e) => { e.stopPropagation(); handleConversationClick(conversation) }}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-green-500/10"
                        >
                          <Reply className="w-3 h-3 text-green-400" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          onClick={(e) => { e.stopPropagation(); handleQuickAction(conversation.unreadCount > 0 ? 'mark-read' : 'mark-unread', conversation) }}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/10"
                        >
                          {conversation.unreadCount > 0 ? <Eye className="w-3 h-3 text-blue-400" /> : <EyeOff className="w-3 h-3 text-blue-400" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          onClick={(e) => { e.stopPropagation(); handleQuickAction(conversation.isPinned ? 'unpin' : 'pin', conversation) }}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-purple-500/10"
                        >
                          <Pin className={`w-3 h-3 text-purple-400`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          onClick={(e) => { e.stopPropagation(); handleQuickAction('archive', conversation) }}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-500/10"
                        >
                          <Archive className="w-3 h-3 text-amber-400" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle divider */}
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

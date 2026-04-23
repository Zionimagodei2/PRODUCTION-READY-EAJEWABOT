'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MessageCircle, Search, Check, CheckCheck,
  Plus, MessageSquare, Users, BarChart3
} from 'lucide-react'

interface Conversation {
  id: string
  name: string
  isGroup: boolean
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline: boolean
  messageStatus: 'read' | 'sent' | 'none'
  avatarColor: string
}

const mockConversations: Conversation[] = [
  {
    id: '1', name: 'John Smith', isGroup: false, lastMessage: 'Thanks for the update! I\'ll review the proposal and get back to you by tomorrow.',
    timestamp: '2m', unreadCount: 3, isOnline: true, messageStatus: 'none', avatarColor: '#3b82f6'
  },
  {
    id: '2', name: 'Marketing Team', isGroup: true, lastMessage: 'Sarah: The new campaign is performing well, 42% open rate!',
    timestamp: '15m', unreadCount: 5, isOnline: false, messageStatus: 'none', avatarColor: '#8b5cf6'
  },
  {
    id: '3', name: 'Emily Davis', isGroup: false, lastMessage: 'Can we schedule a call for next week?',
    timestamp: '1h', unreadCount: 1, isOnline: true, messageStatus: 'none', avatarColor: '#ec4899'
  },
  {
    id: '4', name: 'Sales Group', isGroup: true, lastMessage: 'Mike: Q4 targets have been updated in the dashboard',
    timestamp: '3h', unreadCount: 0, isOnline: false, messageStatus: 'read', avatarColor: '#f97316'
  },
  {
    id: '5', name: 'Alex Rivera', isGroup: false, lastMessage: 'The bulk order has been confirmed and shipped.',
    timestamp: '5h', unreadCount: 0, isOnline: false, messageStatus: 'read', avatarColor: '#22c55e'
  },
  {
    id: '6', name: 'Lisa Wong', isGroup: false, lastMessage: 'Please send me the updated price list for Q1.',
    timestamp: 'Yesterday', unreadCount: 2, isOnline: false, messageStatus: 'none', avatarColor: '#06b6d4'
  },
  {
    id: '7', name: 'Support Team', isGroup: true, lastMessage: 'Anna: All tickets from last week have been resolved.',
    timestamp: 'Yesterday', unreadCount: 0, isOnline: false, messageStatus: 'sent', avatarColor: '#f59e0b'
  },
  {
    id: '8', name: 'David Brown', isGroup: false, lastMessage: 'Delivery confirmed! Everything looks great.',
    timestamp: '2d ago', unreadCount: 0, isOnline: false, messageStatus: 'read', avatarColor: '#ef4444'
  },
  {
    id: '9', name: 'Product Launch', isGroup: true, lastMessage: 'Jake: Press release draft is ready for review.',
    timestamp: '2d ago', unreadCount: 0, isOnline: false, messageStatus: 'sent', avatarColor: '#8b5cf6'
  },
  {
    id: '10', name: 'Anna Mueller', isGroup: false, lastMessage: 'I\'m interested in your enterprise plan. Can we discuss?',
    timestamp: '3d ago', unreadCount: 0, isOnline: false, messageStatus: 'read', avatarColor: '#06b6d4'
  },
]

type FilterTab = 'all' | 'unread' | 'groups'

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

export function InboxPage() {
  const { goBack, setSelectedContactId, setActiveFeature } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const filteredConversations = useMemo(() => {
    let filtered = mockConversations

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query)
      )
    }

    // Apply tab filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter((c) => c.unreadCount > 0)
    } else if (activeFilter === 'groups') {
      filtered = filtered.filter((c) => c.isGroup)
    }

    return filtered
  }, [searchQuery, activeFilter])

  const totalConversations = mockConversations.length
  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unreadCount, 0)
  const responseRate = 94

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedContactId(conversation.id)
    setActiveFeature('contact-detail')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
  }

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalConversations },
    { key: 'unread', label: 'Unread', count: mockConversations.filter((c) => c.unreadCount > 0).length },
    { key: 'groups', label: 'Groups', count: mockConversations.filter((c) => c.isGroup).length },
  ]

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
            <MessageCircle className="w-5 h-5 text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.5))' }} />
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
        <div className="glass-card rounded-xl p-3 text-center stat-card-green">
          <div className="w-7 h-7 mx-auto rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{totalConversations}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Conversations</p>
          {/* Mini progress */}
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-green-500/50" style={{ width: '85%' }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-blue">
          <div className="w-7 h-7 mx-auto rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{totalUnread}</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Unread</p>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500/50" style={{ width: `${Math.min((totalUnread / totalConversations) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-3 text-center stat-card-purple">
          <div className="w-7 h-7 mx-auto rounded-lg bg-purple-500/10 flex items-center justify-center mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-white/95">{responseRate}%</p>
          <p className="text-[9px] text-white/50 font-semibold mt-0.5">Response Rate</p>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500/50" style={{ width: `${responseRate}%` }} />
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-green-500/30 focus:bg-white/[0.07] transition-all"
        />
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

      {/* Conversation List */}
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
              <p className="text-sm text-white/40 font-medium">No conversations found</p>
              <p className="text-xs text-white/25 mt-1">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                variants={conversationItem}
                layout
                onClick={() => handleConversationClick(conversation)}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-all duration-200 group"
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
                      background: `linear-gradient(135deg, ${conversation.avatarColor}30, ${conversation.avatarColor}10)`,
                      border: `1.5px solid ${conversation.avatarColor}25`
                    }}
                  >
                    {conversation.isGroup ? (
                      <Users className="w-4.5 h-4.5" style={{ color: conversation.avatarColor }} />
                    ) : (
                      getInitials(conversation.name)
                    )}
                  </div>
                  {/* Online status dot */}
                  {conversation.isOnline && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0c0c14] animate-pulse-dot"
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
                      {conversation.name}
                    </h3>
                    <span className="text-[10px] text-white/30 flex-shrink-0 font-medium">
                      {conversation.timestamp}
                    </span>
                  </div>
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
                        <span
                          className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white px-1"
                          style={{
                            boxShadow: '0 0 8px rgba(34,197,94,0.4), 0 0 16px rgba(34,197,94,0.15)'
                          }}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtle divider (not on last item) */}
                {index < filteredConversations.length - 1 && (
                  <div className="absolute bottom-0 left-16 right-4 h-px bg-white/[0.03]" />
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

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

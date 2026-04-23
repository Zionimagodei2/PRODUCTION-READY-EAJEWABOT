'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, MessageSquare, StickyNote,
  Mail, Building2, MapPin, Calendar, Tag, Clock,
  Send, Check, CheckCheck
} from 'lucide-react'

interface ContactDetail {
  id: string
  name: string
  phone: string
  email: string
  company: string
  location: string
  dateAdded: string
  status: string
  tags: string
  lastMessage: string
  score: number
  segments: string
}

interface Conversation {
  id: string
  contactId: string
  contactName: string
  direction: string
  content: string
  timestamp: string
}

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function ContactDetailPage() {
  const { selectedContactId, setActiveFeature } = useAppStore()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedContactId) {
        setIsLoading(false)
        return
      }
      try {
        // Fetch contacts and find the one we need
        const contactsRes = await fetch('/api/contacts')
        if (contactsRes.ok) {
          const contacts = await contactsRes.json()
          const found = contacts.find((c: ContactDetail) => c.id === selectedContactId)
          setContact(found || null)
        }

        // Fetch conversations for this contact
        const convosRes = await fetch(`/api/conversations?contactId=${selectedContactId}`)
        if (convosRes.ok) {
          const convos = await convosRes.json()
          setConversations(convos)
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedContactId])

  if (isLoading) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto text-center">
        <div className="skeleton-shimmer h-10 w-10 mx-auto rounded-full mb-3" />
        <div className="skeleton-shimmer h-5 w-32 mx-auto rounded mb-2" />
        <div className="skeleton-shimmer h-4 w-48 mx-auto rounded" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="px-4 py-6 pb-24 max-w-lg mx-auto text-center">
        <p className="text-white/40 text-sm">Contact not found</p>
        <button
          onClick={() => setActiveFeature(null)}
          className="mt-4 text-neon-blue text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    )
  }

  const tags = contact.tags ? contact.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const initials = contact.name.split(' ').map(n => n[0]).join('')

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setActiveFeature(null)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <h1 className="text-lg font-extrabold text-white/95">Contact Details</h1>
      </div>

      {/* Contact Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 flex flex-col items-center text-center space-y-3"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue/40 to-neon-purple/40 border-2 border-white/10 flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white/80">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-white/90">{contact.name}</h2>
          <p className="text-sm text-white/55 flex items-center justify-center gap-1.5 mt-1">
            <Phone className="w-3.5 h-3.5" />
            {contact.phone}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-3 py-1 rounded-full border ${
          contact.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-white/5 text-white/30 border-white/10'
        }`}>
          {contact.status === 'active' ? '● Active' : '● Inactive'}
        </span>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2.5"
      >
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-green-500/15 transition-colors">
          <MessageSquare className="w-4 h-4" /> Message
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-sm hover:bg-blue-500/15 transition-colors">
          <Phone className="w-4 h-4" /> Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-sm hover:bg-purple-500/15 transition-colors">
          <StickyNote className="w-4 h-4" /> Note
        </button>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 space-y-3.5"
      >
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Contact Info</h3>
        <div className="space-y-3">
          {contact.email && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/30">Email</p>
                <p className="text-sm text-white/55 truncate">{contact.email}</p>
              </div>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/30">Company</p>
                <p className="text-sm text-white/55 truncate">{contact.company}</p>
              </div>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/30">Location</p>
                <p className="text-sm text-white/55">{contact.location}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30">Date Added</p>
              <p className="text-sm text-white/55">{formatDate(contact.dateAdded)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tags */}
      {tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-white/40" />
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Conversation History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Recent Conversation</h3>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {conversations.length > 0 ? conversations.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  msg.direction === 'outgoing'
                    ? 'bg-green-500/5 border border-green-500/10 rounded-br-md'
                    : 'bg-white/5 border border-white/10 rounded-bl-md'
                }`}
              >
                <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.direction === 'outgoing' ? 'text-green-400/50' : 'text-white/30'}`}>
                  <span className="text-[9px]">{formatTime(msg.timestamp)}</span>
                  {msg.direction === 'outgoing' && (
                    <CheckCheck className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="text-xs text-white/20 text-center py-4">No conversation history yet</p>
          )}
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Activity Timeline</h3>
        </div>
        <div className="space-y-0">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f615' }}>
                <Send className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} />
              </div>
              <div className="w-px flex-1 bg-white/10 my-1" />
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm text-white/55 leading-snug">Contact added to database</p>
              <p className="text-[10px] text-white/30 mt-0.5">{formatDate(contact.dateAdded)}</p>
            </div>
          </div>
          {conversations.length > 0 && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#22c55e15' }}>
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/55 leading-snug">Last message: {contact.lastMessage || conversations[conversations.length - 1]?.content || 'N/A'}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{formatTime(conversations[conversations.length - 1]?.timestamp || '')}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

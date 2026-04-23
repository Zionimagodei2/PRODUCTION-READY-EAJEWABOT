'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Import, MoreHorizontal, Phone, MessageSquare, UserPlus, Users, RotateCcw, ArrowDownUp, Clock, ShieldCheck, TrendingUp, UserCheck, Tags, Sparkles, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { ListSkeleton } from '@/components/app/loading-skeleton'
import { useToastStore } from '@/store/toast-store'

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  company: string
  location: string
  tags: string
  lastMessage: string
  status: string
  score: number
  segments: string
  dateAdded: string
  createdAt: string
  updatedAt: string
}

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

const segmentColors: Record<string, string> = {
  VIP: 'bg-amber-500/12 text-amber-400/80 border-amber-500/15',
  Customer: 'bg-blue-500/12 text-blue-400/80 border-blue-500/15',
  Lead: 'bg-green-500/12 text-green-400/80 border-green-500/15',
  Prospect: 'bg-purple-500/12 text-purple-400/80 border-purple-500/15',
  Hot: 'bg-red-500/12 text-red-400/80 border-red-500/15',
  Wholesale: 'bg-cyan-500/12 text-cyan-400/80 border-cyan-500/15',
}

function RingProgress({ value, maxValue, color, size = 36 }: { value: number; maxValue: number; color: string; size?: number }) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(value / maxValue, 1)
  const dashOffset = circumference * (1 - percentage)

  return (
    <svg width={size} height={size} className="ring-progress">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
        fill="none"
        className="ring-progress-bg"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={3}
        fill="none"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        className="ring-progress-fill"
      />
    </svg>
  )
}

const quickStatsVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const quickStatItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
}

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const { setSelectedContactId, setActiveFeature, setAddContactOpen, pendingNewContact, setPendingNewContact } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'active'>('name')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { addToast } = useToastStore()

  // Fetch contacts from API
  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) {
        const data = await res.json()
        setContacts(data)
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to load contacts' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  // Derived stats
  const totalContacts = contacts.length
  const activeContacts = contacts.filter(c => c.status === 'active').length
  const newThisWeek = contacts.filter(c => {
    const added = new Date(c.dateAdded)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return added >= weekAgo
  }).length
  const taggedContacts = contacts.filter(c => c.tags && c.tags.length > 0).length

  // Handle new contact from modal
  useEffect(() => {
    if (pendingNewContact) {
      // POST to API
      const createContact = async () => {
        try {
          const res = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: pendingNewContact.name,
              phone: pendingNewContact.phone,
              tags: pendingNewContact.tags?.join(',') || '',
              status: pendingNewContact.status || 'active',
            }),
          })
          if (res.ok) {
            const newContact = await res.json()
            setContacts(prev => [newContact, ...prev])
            addToast({ type: 'success', title: 'Contact added' })
          }
        } catch {
          addToast({ type: 'error', title: 'Failed to add contact' })
        }
        setPendingNewContact(null)
      }
      createContact()
    }
  }, [pendingNewContact, setPendingNewContact, addToast])

  // Parse tags from comma-separated string
  const parseTags = (tagsStr: string): string[] => {
    if (!tagsStr) return []
    return tagsStr.split(',').map(t => t.trim()).filter(Boolean)
  }

  // Parse segments from comma-separated string
  const parseSegments = (segmentsStr: string): string[] => {
    if (!segmentsStr) return []
    return segmentsStr.split(',').map(s => s.trim()).filter(Boolean)
  }

  // Format last active time
  const formatLastActive = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 5) return '5m ago'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Delete contact
  const handleDeleteContact = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id))
        addToast({ type: 'success', title: 'Contact deleted' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to delete contact' })
    }
    setDeletingId(null)
  }

  const allTags = Array.from(new Set(contacts.flatMap(c => parseTags(c.tags))))
  
  const filtered = contacts.filter(c => {
    const tags = parseTags(c.tags)
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                       c.phone.includes(search)
    const matchTag = !selectedTag || tags.includes(selectedTag)
    return matchSearch && matchTag
  }).sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.score - a.score
      case 'active': return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      case 'name': default: return a.name.localeCompare(b.name)
    }
  })

  const handleResetFilters = () => {
    setSearch('')
    setSelectedTag(null)
  }

  // Contact score color helper
  const scoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 50) return '#3b82f6'
    if (score >= 30) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Quick Stats Widget - Glass card with ring progress */}
      <motion.div
        variants={quickStatsVariants}
        initial="hidden"
        animate="visible"
        className="glass-card-inset rounded-2xl p-4 neon-glow-blue"
        style={{ boxShadow: '0 0 20px rgba(59,130,246,0.1), 0 0 40px rgba(139,92,246,0.05)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-neon-blue" />
          </div>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Total Contacts */}
          <motion.div
            variants={quickStatItemVariants}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
          >
            <RingProgress value={totalContacts} maxValue={20} color="#3b82f6" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-lg font-extrabold text-neon-blue">{totalContacts}</p>
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <p className="text-[10px] text-white/40 font-medium">Total Contacts</p>
            </div>
          </motion.div>

          {/* Active Contacts */}
          <motion.div
            variants={quickStatItemVariants}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
          >
            <RingProgress value={activeContacts} maxValue={totalContacts || 1} color="#22c55e" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-lg font-extrabold text-neon-green">{activeContacts}</p>
                <UserCheck className="w-3 h-3 text-green-400/60" />
              </div>
              <p className="text-[10px] text-white/40 font-medium">Active</p>
            </div>
          </motion.div>

          {/* New This Week */}
          <motion.div
            variants={quickStatItemVariants}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
          >
            <RingProgress value={newThisWeek} maxValue={totalContacts || 1} color="#3b82f6" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-lg font-extrabold text-blue-400">{newThisWeek}</p>
                <Sparkles className="w-3 h-3 text-blue-400/60" />
              </div>
              <p className="text-[10px] text-white/40 font-medium">New This Week</p>
            </div>
          </motion.div>

          {/* Tagged Contacts */}
          <motion.div
            variants={quickStatItemVariants}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
          >
            <RingProgress value={taggedContacts} maxValue={totalContacts || 1} color="#8b5cf6" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-lg font-extrabold text-neon-purple">{taggedContacts}</p>
                <Tags className="w-3 h-3 text-purple-400/60" />
              </div>
              <p className="text-[10px] text-white/40 font-medium">Tagged</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40 transition-colors"
        />
      </div>

      {/* Tags filter + Sort */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border ${
              !selectedTag 
                ? 'bg-gradient-to-r from-neon-blue/25 to-neon-purple/20 text-neon-blue border-neon-blue/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                : 'bg-white/5 text-white/40 border-white/5'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border ${
                selectedTag === tag 
                  ? tagColors[tag] || 'bg-white/10 text-white/70 border-white/20'
                  : 'bg-white/5 text-white/40 border-white/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-white/40" />
          </button>
          <AnimatePresence>
            {showSortDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-32 rounded-xl bg-[#14141f] border border-white/10 shadow-xl overflow-hidden z-20"
              >
                {([['name', 'Name'], ['score', 'Score'], ['active', 'Last Active']] as [typeof sortBy, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSortBy(value); setShowSortDropdown(false) }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors ${
                      sortBy === value ? 'text-neon-blue bg-blue-500/10' : 'text-white/50 hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons - Enhanced with navigation */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setAddContactOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-white font-semibold border border-neon-blue/25 text-xs hover:from-neon-blue/30 hover:to-neon-purple/30 transition-all"
          style={{ boxShadow: '0 0 16px rgba(59,130,246,0.2), 0 0 8px rgba(139,92,246,0.15)' }}
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Contact
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setActiveFeature('contact-import')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
          style={{ boxShadow: '0 0 10px rgba(6,182,212,0.12)' }}
        >
          <Import className="w-3.5 h-3.5" /> Import CSV
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setActiveFeature('number-validator')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-green-500/10 text-green-300 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20 transition-colors"
          style={{ boxShadow: '0 0 10px rgba(34,197,94,0.12)' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Contact list - with skeleton loading */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        /* Empty state for when search/filter returns no results */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-sm font-bold text-white/50 mb-1">No contacts found</h3>
          <p className="text-xs text-subtitle mb-4">Try adjusting your search or filter</p>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neon-blue/15 text-neon-blue border border-neon-blue/25 text-xs font-semibold hover:bg-neon-blue/25 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact, i) => {
            const tags = parseTags(contact.tags)
            const segments = parseSegments(contact.segments)
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedContactId(contact.id)
                  setActiveFeature('contact-detail')
                }}
                className={`glass-card rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? 'bg-white/[0.005]' : ''}`}
              >
                {/* Avatar with contact score ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 border border-white/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-white/70">{contact.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  {/* Contact Score ring */}
                  <svg width={14} height={14} className="absolute -bottom-0.5 -right-0.5 ring-progress">
                    <circle cx={7} cy={7} r={5} strokeWidth={1.5} fill="none" stroke="rgba(255,255,255,0.08)" />
                    <circle cx={7} cy={7} r={5} strokeWidth={1.5} fill="none" stroke={scoreColor(contact.score)} 
                      strokeDasharray={`${(contact.score / 100) * 31.4} 31.4`} strokeLinecap="round" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white/90 truncate">{contact.name}</h3>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${contact.status === 'active' ? 'bg-emerald-400 animate-pulse-dot' : 'bg-white/20'}`} />
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" /> {contact.phone}
                  </p>
                  {contact.lastMessage && (
                    <p className="text-[10px] text-white/20 mt-0.5 truncate flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" /> {contact.lastMessage}
                    </p>
                  )}
                  {contact.status === 'active' && (
                    <p className="text-[9px] text-white/20 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2 h-2" /> Last active: {formatLastActive(contact.updatedAt)}
                    </p>
                  )}
                  {/* Segment badges */}
                  {segments.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {segments.slice(0, 3).map((segment) => (
                        <span key={segment} className={`text-[7px] px-1 py-px rounded border font-bold ${segmentColors[segment] || 'bg-white/10 text-white/50 border-white/10'}`}>
                          {segment}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags + Delete */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="flex gap-1">
                    {tags.slice(0, 2).map((tag) => (
                      <span key={tag} className={`text-[8px] px-1.5 py-0.5 rounded-md border ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={(e) => handleDeleteContact(contact.id, e)}
                    disabled={deletingId === contact.id}
                    className="p-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

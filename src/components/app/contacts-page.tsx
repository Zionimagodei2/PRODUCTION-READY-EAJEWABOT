'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Import, MoreHorizontal, Phone, MessageSquare, Tag, Trash2, UserPlus, Users, RotateCcw, ArrowDownUp, Clock, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { ListSkeleton } from '@/components/app/loading-skeleton'

interface Contact {
  id: string
  name: string
  phone: string
  tags: string[]
  lastMessage: string
  status: 'active' | 'inactive'
  dateAdded: string
  score: number
  lastActive: string
}

const mockContacts: Contact[] = [
  { id: '1', name: 'John Smith', phone: '+1 234 567 8901', tags: ['customer', 'vip'], lastMessage: 'Thanks for the update!', status: 'active', dateAdded: '2024-01-15', score: 85, lastActive: '5m ago' },
  { id: '2', name: 'Sarah Johnson', phone: '+44 7911 123456', tags: ['lead'], lastMessage: 'Interested in your product', status: 'active', dateAdded: '2024-01-14', score: 72, lastActive: '1h ago' },
  { id: '3', name: 'Mike Chen', phone: '+86 138 0013 8000', tags: ['customer'], lastMessage: 'Order confirmed', status: 'active', dateAdded: '2024-01-13', score: 90, lastActive: '30m ago' },
  { id: '4', name: 'Emily Davis', phone: '+1 555 123 4567', tags: ['prospect'], lastMessage: '', status: 'inactive', dateAdded: '2024-01-12', score: 25, lastActive: '3d ago' },
  { id: '5', name: 'Alex Rivera', phone: '+34 612 345 678', tags: ['customer', 'wholesale'], lastMessage: 'Bulk order inquiry', status: 'active', dateAdded: '2024-01-11', score: 68, lastActive: '2h ago' },
  { id: '6', name: 'Lisa Wong', phone: '+852 9123 4567', tags: ['lead', 'hot'], lastMessage: 'Price list request', status: 'active', dateAdded: '2024-01-10', score: 95, lastActive: '15m ago' },
  { id: '7', name: 'David Brown', phone: '+61 4 1234 5678', tags: ['customer'], lastMessage: 'Delivery confirmed', status: 'active', dateAdded: '2024-01-09', score: 55, lastActive: '6h ago' },
  { id: '8', name: 'Anna Mueller', phone: '+49 151 1234 5678', tags: ['prospect'], lastMessage: '', status: 'inactive', dateAdded: '2024-01-08', score: 15, lastActive: '1w ago' },
]

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [contacts, setContacts] = useState(mockContacts)
  const { setSelectedContactId, setActiveFeature, setAddContactOpen, pendingNewContact, setPendingNewContact } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'active'>('name')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Handle new contact from modal
  useEffect(() => {
    if (pendingNewContact) {
      queueMicrotask(() => {
        setContacts(prev => [pendingNewContact!, ...prev])
        setPendingNewContact(null)
      })
    }
  }, [pendingNewContact, setPendingNewContact])

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      queueMicrotask(() => setIsLoading(false))
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)))
  
  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                       c.phone.includes(search)
    const matchTag = !selectedTag || c.tags.includes(selectedTag)
    return matchSearch && matchTag
  }).sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.score - a.score
      case 'active': return a.lastActive.localeCompare(b.lastActive)
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
      {/* Stats - Enhanced with accent borders */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3.5 text-center stat-card-blue">
          <p className="text-xl font-extrabold text-neon-blue">{contacts.length}</p>
          <p className="text-[11px] text-white/55 font-semibold">Total</p>
        </div>
        <div className="glass-card rounded-xl p-3.5 text-center stat-card-green">
          <p className="text-xl font-extrabold text-neon-green">{contacts.filter(c => c.status === 'active').length}</p>
          <p className="text-[11px] text-white/55 font-semibold">Active</p>
        </div>
        <div className="glass-card rounded-xl p-3.5 text-center stat-card-orange">
          <p className="text-xl font-extrabold text-neon-orange">{allTags.length}</p>
          <p className="text-[11px] text-white/55 font-semibold">Tags</p>
        </div>
      </div>

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
          {filtered.map((contact, i) => (
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
                <p className="text-[9px] text-white/15 mt-0.5 flex items-center gap-1">
                  <Clock className="w-2 h-2" /> {contact.lastActive}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex gap-1">
                  {contact.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={`text-[8px] px-1.5 py-0.5 rounded-md border ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="p-1 rounded hover:bg-white/5 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-white/20" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

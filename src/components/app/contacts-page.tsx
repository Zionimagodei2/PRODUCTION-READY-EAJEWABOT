'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { Search, Import, Phone, MessageSquare, UserPlus, Users, RotateCcw, ArrowDownUp, Clock, ShieldCheck, UserCheck, Tags, Sparkles, Trash2, CheckSquare, Square, X, Send, Download, FolderPlus, Plus } from 'lucide-react'
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

interface Group {
  id: string
  name: string
  memberCount: number
  color: string
}

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

const tagDotColors: Record<string, string> = {
  customer: 'bg-blue-400',
  vip: 'bg-amber-400',
  lead: 'bg-green-400',
  hot: 'bg-red-400',
  prospect: 'bg-purple-400',
  wholesale: 'bg-cyan-400',
}

const segmentColors: Record<string, string> = {
  VIP: 'bg-amber-500/12 text-amber-400/80 border-amber-500/15',
  Customer: 'bg-blue-500/12 text-blue-400/80 border-blue-500/15',
  Lead: 'bg-green-500/12 text-green-400/80 border-green-500/15',
  Prospect: 'bg-purple-500/12 text-purple-400/80 border-purple-500/15',
  Hot: 'bg-red-500/12 text-red-400/80 border-red-500/15',
  Wholesale: 'bg-cyan-500/12 text-cyan-400/80 border-cyan-500/15',
}

// Mock groups for the Add to Group modal
const defaultGroups: Group[] = [
  { id: 'g1', name: 'VIP Customers', memberCount: 0, color: '#f59e0b' },
  { id: 'g2', name: 'New Leads', memberCount: 0, color: '#22c55e' },
  { id: 'g3', name: 'Newsletter Subscribers', memberCount: 0, color: '#3b82f6' },
]

function groupColorFor(name: string): string {
  const palette = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
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

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * target)
      setCount(start)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return count
}

function AnimatedStat({ value, label, color, icon: Icon, maxValue }: { value: number; label: string; color: string; icon: React.ElementType; maxValue: number }) {
  const animatedValue = useAnimatedCounter(value)
  return (
    <motion.div
      variants={quickStatItemVariants}
      className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
    >
      <RingProgress value={value} maxValue={maxValue} color={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-lg font-extrabold" style={{ color }}>{animatedValue}</p>
          <Icon className="w-3 h-3 opacity-60" style={{ color }} />
        </div>
        <p className="text-[10px] text-white/40 font-medium">{label}</p>
      </div>
    </motion.div>
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

type SortOption = 'name-az' | 'name-za' | 'newest' | 'oldest' | 'most-active'
type DateFilter = 'all' | 'this-week' | 'this-month' | 'older'
type StatusFilter = 'all' | 'active' | 'inactive'

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const { setSelectedContactId, setActiveFeature, setAddContactOpen, pendingNewContact, setPendingNewContact } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { addToast } = useToastStore()

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [groups, setGroups] = useState<Group[]>(defaultGroups)

  // Advanced filtering
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-az')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Swipe state
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const touchStartX = useRef<number>(0)
  const touchCurrentX = useRef<number>(0)

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

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) return
      const data = await res.json()
      if (!data?.contact_groups) return
      const parsed = JSON.parse(data.contact_groups)
      if (Array.isArray(parsed)) {
        setGroups(parsed)
      }
    } catch {
      // ignore malformed payloads
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchContacts()
      fetchGroups()
    })
  }, [])

  // Derived stats
  const totalContacts = contacts.length
  const activeContacts = contacts.filter(c => c.status === 'active').length
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const activeThisWeek = contacts.filter(c => {
    const updated = new Date(c.updatedAt)
    return c.status === 'active' && updated >= weekAgo
  }).length
  const newThisMonth = contacts.filter(c => {
    const added = new Date(c.dateAdded)
    return added >= monthAgo
  }).length
  const withWhatsApp = contacts.filter(c => c.phone && c.phone.startsWith('+')).length

  // Handle new contact from modal
  useEffect(() => {
    if (pendingNewContact) {
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

  // Format time for "last activity" on enhanced cards
  const formatTimestamp = (dateStr: string): string => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffHours / 24)
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  // Delete contact
  const handleDeleteContact = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDeletingId(id)
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.id !== id))
        selectedIds.delete(id)
        setSelectedIds(new Set(selectedIds))
        addToast({ type: 'success', title: 'Contact deleted' })
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to delete contact' })
    }
    setDeletingId(null)
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      try {
        await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
      } catch { /* continue */ }
    }
    setContacts(prev => prev.filter(c => !selectedIds.has(c.id)))
    addToast({ type: 'success', title: `${ids.length} contacts deleted` })
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  // Bulk export
  const handleBulkExport = () => {
    const selected = contacts.filter(c => selectedIds.has(c.id))
    const csv = [
      ['Name', 'Phone', 'Email', 'Tags', 'Status'].join(','),
      ...selected.map(c => [c.name, c.phone, c.email, c.tags, c.status].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-export-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: `Exported ${selected.length} contacts` })
  }

  // Bulk send message
  const handleBulkSendMessage = () => {
    setActiveFeature('send-message')
  }

  // Bulk add to group
  const handleBulkAddToGroup = () => {
    setShowGroupModal(true)
  }

  // Confirm add to group
  const handleConfirmAddToGroup = () => {
    const run = async () => {
      const selected = contacts.filter((contact) => selectedIds.has(contact.id))
      const existingGroup = groups.find((group) => group.id === selectedGroup)
      const groupName = (newGroupName.trim() || existingGroup?.name || '').trim()
      if (!groupName) return

      for (const contact of selected) {
        const tags = parseTags(contact.tags)
        const hasTag = tags.some((tag) => tag.toLowerCase() === groupName.toLowerCase())
        if (hasTag) continue
        const nextTags = [...tags, groupName].join(', ')
        await fetch('/api/contacts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: contact.id, tags: nextTags }),
        })
      }

      await fetchContacts()

      const baseGroups = [...groups]
      if (!existingGroup) {
        baseGroups.push({
          id: `g-${Date.now()}`,
          name: groupName,
          memberCount: 0,
          color: groupColorFor(groupName),
        })
      }

      const refreshedContacts = await fetch('/api/contacts').then((res) => res.json()).catch(() => contacts)
      const recalculated = baseGroups.map((group) => ({
        ...group,
        memberCount: refreshedContacts.filter((contact: Contact) =>
          parseTags(contact.tags).some((tag) => tag.toLowerCase() === group.name.toLowerCase())
        ).length,
      }))

      setGroups(recalculated)
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'contact_groups', value: JSON.stringify(recalculated) }),
      })

      addToast({ type: 'success', title: `Added ${selected.length} contacts to ${groupName}` })
      setShowGroupModal(false)
      setSelectedGroup(null)
      setNewGroupName('')
      setShowNewGroupInput(false)
      setSelectedIds(new Set())
      setSelectionMode(false)
    }
    void run()
  }

  // Toggle selection
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  // Touch handlers for swipe
  const handleTouchStart = (id: string) => (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    setSwipedId(id)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (id: string) => () => {
    const diff = touchCurrentX.current - touchStartX.current
    if (Math.abs(diff) > 60) {
      setSwipedId(diff > 0 ? null : id) // swipe left reveals delete
    } else {
      setSwipedId(null)
    }
  }

  const allTags = Array.from(new Set(contacts.flatMap(c => parseTags(c.tags))))

  // Advanced filtered + sorted contacts
  const filtered = contacts.filter(c => {
    const tags = parseTags(c.tags)
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                       c.phone.includes(search)
    const matchTag = !selectedTag || tags.includes(selectedTag)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    let matchDate = true
    if (dateFilter !== 'all') {
      const added = new Date(c.dateAdded)
      if (dateFilter === 'this-week') matchDate = added >= weekAgo
      else if (dateFilter === 'this-month') matchDate = added >= monthAgo
      else if (dateFilter === 'older') matchDate = added < monthAgo
    }
    return matchSearch && matchTag && matchStatus && matchDate
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-az': return a.name.localeCompare(b.name)
      case 'name-za': return b.name.localeCompare(a.name)
      case 'newest': return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      case 'oldest': return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
      case 'most-active': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      default: return 0
    }
  })

  const handleResetFilters = () => {
    setSearch('')
    setSelectedTag(null)
    setStatusFilter('all')
    setDateFilter('all')
    setSortBy('name-az')
  }

  // Contact score color helper
  const scoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 50) return '#3b82f6'
    if (score >= 30) return '#f59e0b'
    return '#ef4444'
  }

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const activeFiltersCount = [selectedTag, statusFilter !== 'all', dateFilter !== 'all', sortBy !== 'name-az'].filter(Boolean).length

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Contact Statistics Bar */}
      <motion.div
        variants={quickStatsVariants}
        initial="hidden"
        animate="visible"
        className="glass-card-inset rounded-2xl p-4 neon-glow-blue"
        style={{ boxShadow: '0 0 20px rgba(59,130,246,0.1), 0 0 40px rgba(139,92,246,0.05)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-neon-blue" />
            </div>
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Contact Stats</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <AnimatedStat value={totalContacts} label="Total Contacts" color="#3b82f6" icon={Users} maxValue={Math.max(totalContacts, 20)} />
          <AnimatedStat value={activeThisWeek} label="Active This Week" color="#22c55e" icon={UserCheck} maxValue={Math.max(totalContacts, 1)} />
          <AnimatedStat value={newThisMonth} label="New This Month" color="#8b5cf6" icon={Sparkles} maxValue={Math.max(totalContacts, 1)} />
          <AnimatedStat value={withWhatsApp} label="With WhatsApp" color="#06b6d4" icon={Phone} maxValue={Math.max(totalContacts, 1)} />
        </div>
      </motion.div>

      {/* Search + Selection Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-white/5 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40 transition-all duration-200"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectionMode(!selectionMode)
            if (selectionMode) {
              setSelectedIds(new Set())
            }
          }}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
            selectionMode
              ? 'bg-neon-blue/20 border-neon-blue/40 text-neon-blue'
              : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Selection mode header */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-3 flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="flex items-center gap-1.5">
                {isAllSelected
                  ? <CheckSquare className="w-4 h-4 text-neon-blue" />
                  : <Square className="w-4 h-4 text-white/40" />
                }
                <span className="text-xs text-white/60">{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
              <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                {selectedIds.size} selected
              </span>
            </div>
            <button
              onClick={() => { setSelectionMode(false); setSelectedIds(new Set()) }}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags filter + Sort + Filter toggle */}
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
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center hover:bg-white/10 transition-colors ${
              activeFiltersCount > 0 ? 'bg-neon-blue/15 border-neon-blue/30 text-neon-blue' : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-neon-blue text-[7px] font-bold text-white flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>
          </button>
          <div className="relative">
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
                  className="absolute right-0 top-11 w-36 rounded-xl bg-[#14141f] border border-white/10 shadow-xl overflow-hidden z-20"
                >
                  {([
                    ['name-az', 'Name A-Z'],
                    ['name-za', 'Name Z-A'],
                    ['newest', 'Newest'],
                    ['oldest', 'Oldest'],
                    ['most-active', 'Most Active'],
                  ] as [SortOption, string][]).map(([value, label]) => (
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
      </div>

      {/* Advanced filter panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Advanced Filters</h3>
              <button onClick={() => setShowFilterPanel(false)} className="text-white/30 hover:text-white/50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status filter */}
            <div>
              <p className="text-[10px] text-white/40 font-semibold mb-1.5 uppercase tracking-wider">Status</p>
              <div className="flex gap-1.5">
                {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                      statusFilter === s
                        ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30'
                        : 'bg-white/5 text-white/40 border-white/5'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date added filter */}
            <div>
              <p className="text-[10px] text-white/40 font-semibold mb-1.5 uppercase tracking-wider">Date Added</p>
              <div className="flex gap-1.5">
                {([
                  ['all', 'All'],
                  ['this-week', 'This Week'],
                  ['this-month', 'This Month'],
                  ['older', 'Older'],
                ] as [DateFilter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setDateFilter(value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                      dateFilter === value
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : 'bg-white/5 text-white/40 border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[10px] text-neon-blue/70 hover:text-neon-blue transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
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

      {/* Contact list */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-state"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-sm font-bold text-white/50 mb-1">No contacts found</h3>
          <p className="text-xs text-subtitle mb-4">Try adjusting your search or filters</p>
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
            const isSelected = selectedIds.has(contact.id)
            const isSwiped = swipedId === contact.id

            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={!selectionMode ? { scale: 1.01 } : undefined}
                whileTap={!selectionMode ? { scale: 0.98 } : undefined}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelect(contact.id)
                  } else {
                    setSelectedContactId(contact.id)
                    setActiveFeature('contact-detail')
                  }
                }}
                className={`relative overflow-hidden rounded-xl ${i % 2 === 0 ? 'bg-white/[0.005]' : ''}`}
                onTouchStart={selectionMode ? undefined : handleTouchStart(contact.id)}
                onTouchMove={selectionMode ? undefined : handleTouchMove}
                onTouchEnd={selectionMode ? undefined : handleTouchEnd(contact.id)}
              >
                {/* Swipe action background - delete on left */}
                <div className="absolute inset-0 flex items-center justify-end pr-4 gap-2">
                  <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-400">
                    <Send className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">Message</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold">Delete</span>
                  </div>
                </div>

                {/* Main card */}
                <motion.div
                  animate={{ x: isSwiped ? -120 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={`glass-card rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                    isSelected ? 'ring-1 ring-neon-blue/40 bg-neon-blue/5' : ''
                  }`}
                >
                  {/* Checkbox or Avatar */}
                  {selectionMode ? (
                    <button
                      onClick={(e) => toggleSelect(contact.id, e)}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center"
                    >
                      {isSelected
                        ? <CheckSquare className="w-5 h-5 text-neon-blue" />
                        : <Square className="w-5 h-5 text-white/20 hover:text-white/40" />
                      }
                    </button>
                  ) : (
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 border border-white/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-white/70">{contact.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      {/* Score ring */}
                      <svg width={14} height={14} className="absolute -bottom-0.5 -right-0.5 ring-progress">
                        <circle cx={7} cy={7} r={5} strokeWidth={1.5} fill="none" stroke="rgba(255,255,255,0.08)" />
                        <circle cx={7} cy={7} r={5} strokeWidth={1.5} fill="none" stroke={scoreColor(contact.score)}
                          strokeDasharray={`${(contact.score / 100) * 31.4} 31.4`} strokeLinecap="round" />
                      </svg>
                      {/* Online/offline status */}
                      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0f] ${
                        contact.status === 'active' ? 'bg-emerald-400 online-status-ring' : 'bg-white/30'
                      }`} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white/90 truncate">{contact.name}</h3>
                      {/* Tags as small colored dots */}
                      {tags.length > 0 && (
                        <div className="flex gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`w-2 h-2 rounded-full ${tagDotColors[tag] || 'bg-white/30'}`}
                              title={tag}
                            />
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[8px] text-white/20">+{tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {contact.phone}
                    </p>
                    {/* Last message preview */}
                    {contact.lastMessage && (
                      <p className="text-[10px] text-white/25 mt-0.5 truncate flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{contact.lastMessage}</span>
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

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {/* Last activity timestamp */}
                    <p className="text-[9px] text-white/20 flex items-center gap-1">
                      <Clock className="w-2 h-2" /> {formatTimestamp(contact.updatedAt)}
                    </p>
                    {!selectionMode && (
                      <button
                        onClick={(e) => handleDeleteContact(contact.id, e)}
                        disabled={deletingId === contact.id}
                        className="p-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white/20 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-16 left-0 right-0 px-4 z-30"
          >
            <div className="max-w-lg mx-auto glass-card-inset rounded-2xl p-3 flex items-center justify-around"
              style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(59,130,246,0.1)' }}
            >
              <button
                onClick={handleBulkDelete}
                className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">Delete</span>
              </button>
              <button
                onClick={handleBulkAddToGroup}
                className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">Group</span>
              </button>
              <button
                onClick={handleBulkExport}
                className="flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">Export</span>
              </button>
              <button
                onClick={handleBulkSendMessage}
                className="flex flex-col items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium">Message</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-lg glass-card-inset rounded-t-2xl p-5 space-y-4"
              style={{ background: 'rgba(14,14,22,0.98)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white/90">Add to Group</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-white/30 hover:text-white/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-white/40">
                Add {selectedIds.size} selected contact{selectedIds.size !== 1 ? 's' : ''} to a group
              </p>

              {/* Existing groups */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroup(group.id); setShowNewGroupInput(false) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedGroup === group.id
                        ? 'bg-neon-blue/10 border-neon-blue/30'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${group.color}20` }}>
                      <Users className="w-4 h-4" style={{ color: group.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold text-white/80">{group.name}</p>
                      <p className="text-[10px] text-white/30">{group.memberCount} members</p>
                    </div>
                    {selectedGroup === group.id && (
                      <div className="w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Create new group inline */}
              <div className="border-t border-white/[0.06] pt-3">
                {!showNewGroupInput ? (
                  <button
                    onClick={() => { setShowNewGroupInput(true); setSelectedGroup(null) }}
                    className="flex items-center gap-2 text-xs text-neon-blue/70 hover:text-neon-blue transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Group
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New group name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/50"
                      autoFocus
                    />
                    <button
                      onClick={() => { setShowNewGroupInput(false); setNewGroupName('') }}
                      className="px-3 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirmAddToGroup}
                disabled={!selectedGroup && !newGroupName.trim()}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  (selectedGroup || newGroupName.trim())
                    ? 'bg-gradient-to-r from-neon-blue/25 to-neon-purple/25 text-white border border-neon-blue/30 hover:from-neon-blue/35 hover:to-neon-purple/35'
                    : 'bg-white/5 text-white/20 border border-white/[0.06] cursor-not-allowed'
                }`}
              >
                Add to Group
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

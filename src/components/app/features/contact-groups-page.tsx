'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, ArrowLeft, Plus, Edit, Send, Copy, Trash2, X,
  Check, Sparkles, RefreshCw, ToggleLeft, ToggleRight,
  Circle, Tag, Zap
} from 'lucide-react'

interface ContactGroup {
  id: string
  name: string
  color: string
  contacts: number
  lastMessaged: string
  tags: string[]
  active: boolean
  avatars: string[]
}

interface SmartSegment {
  id: string
  name: string
  description: string
  members: number
  color: string
  accentBorder: string
  icon: React.ReactNode
}

const presetColors = [
  { name: 'blue', value: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  { name: 'green', value: '#22c55e', bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-500' },
  { name: 'purple', value: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  { name: 'orange', value: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  { name: 'pink', value: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/20', dot: 'bg-pink-500' },
]

const tagOptions = ['customer', 'vip', 'lead', 'prospect', 'wholesale', 'hot', 'inactive', 'new']

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  new: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
}

const mockGroups: ContactGroup[] = [
  { id: '1', name: 'VIP Customers', color: '#8b5cf6', contacts: 124, lastMessaged: '2h ago', tags: ['vip', 'customer'], active: true, avatars: ['JD', 'SK', 'MR', 'AL'] },
  { id: '2', name: 'All Customers', color: '#3b82f6', contacts: 847, lastMessaged: '1d ago', tags: ['customer'], active: true, avatars: ['TC', 'NP', 'RW', 'KL'] },
  { id: '3', name: 'Hot Leads', color: '#f97316', contacts: 89, lastMessaged: '3d ago', tags: ['lead', 'hot'], active: true, avatars: ['AB', 'CD', 'EF'] },
  { id: '4', name: 'Newsletter Subscribers', color: '#22c55e', contacts: 342, lastMessaged: '5d ago', tags: ['customer', 'lead'], active: false, avatars: ['GH', 'IJ', 'KL', 'MN'] },
  { id: '5', name: 'Wholesale Buyers', color: '#ec4899', contacts: 56, lastMessaged: '1w ago', tags: ['wholesale'], active: true, avatars: ['OP', 'QR'] },
  { id: '6', name: 'New Prospects', color: '#3b82f6', contacts: 203, lastMessaged: '2w ago', tags: ['prospect', 'new'], active: true, avatars: ['ST', 'UV', 'WX'] },
  { id: '7', name: 'Inactive Users', color: '#f97316', contacts: 178, lastMessaged: '1mo ago', tags: ['inactive'], active: false, avatars: ['YZ', 'AB', 'CD', 'EF'] },
]

const smartSegments: SmartSegment[] = [
  { id: 'engaged', name: 'Highly Engaged', description: 'Opened >80% of messages', members: 234, color: '#22c55e', accentBorder: 'border-green-500/25', icon: <Zap className="w-4 h-4 text-green-400" /> },
  { id: 'dormant', name: 'Dormant Contacts', description: 'No response in 30+ days', members: 178, color: '#f97316', accentBorder: 'border-orange-500/25', icon: <RefreshCw className="w-4 h-4 text-orange-400" /> },
  { id: 'newleads', name: 'New Leads', description: 'Added in last 7 days', members: 56, color: '#3b82f6', accentBorder: 'border-blue-500/25', icon: <Sparkles className="w-4 h-4 text-blue-400" /> },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const cardVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export function ContactGroupsPage() {
  const { goBack, setActiveFeature } = useAppStore()
  const [groups, setGroups] = useState(mockGroups)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(presetColors[0].value)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const totalGroups = groups.length
  const totalContacts = groups.reduce((sum, g) => sum + g.contacts, 0)
  const smartSegmentCount = smartSegments.length

  const getColorObj = (colorValue: string) => presetColors.find(c => c.value === colorValue) || presetColors[0]

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const createGroup = () => {
    if (!newName.trim()) return
    const colorObj = getColorObj(newColor)
    setGroups([
      ...groups,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        color: newColor,
        contacts: Math.floor(Math.random() * 100) + 10,
        lastMessaged: 'Just now',
        tags: [...selectedTags],
        active: true,
        avatars: ['AA', 'BB', 'CC'].slice(0, Math.floor(Math.random() * 3) + 1),
      },
    ])
    setNewName('')
    setNewColor(presetColors[0].value)
    setSelectedTags([])
    setShowCreate(false)
  }

  const toggleActive = (id: string) => {
    setGroups(groups.map(g => g.id === id ? { ...g, active: !g.active } : g))
  }

  const deleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id))
    setDeleteConfirmId(null)
  }

  const duplicateGroup = (group: ContactGroup) => {
    setGroups([
      ...groups,
      {
        ...group,
        id: Date.now().toString(),
        name: `${group.name} (Copy)`,
        lastMessaged: 'Just now',
        active: true,
      },
    ])
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
            <Users className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Contact Groups</h2>
          </div>
          <p className="text-[11px] text-white/50 mt-0.5">Organize contacts for targeted campaigns</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-3 text-center stat-card-purple"
        >
          <p className="text-lg font-bold text-purple-400">{totalGroups}</p>
          <p className="text-[10px] text-white/50">Total Groups</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-xl p-3 text-center stat-card-blue"
        >
          <p className="text-lg font-bold text-blue-400">{totalContacts.toLocaleString()}</p>
          <p className="text-[10px] text-white/50">Total Contacts</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-3 text-center stat-card-green"
        >
          <p className="text-lg font-bold text-green-400">{smartSegmentCount}</p>
          <p className="text-[10px] text-white/50">Smart Segments</p>
        </motion.div>
      </div>

      {/* Create Group Button */}
      <motion.button
        onClick={() => setShowCreate(!showCreate)}
        whileTap={{ scale: 0.95 }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/20 text-purple-400 text-sm font-bold hover:border-purple-500/30 transition-all"
        style={{ boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}
      >
        <Plus className="w-4 h-4" />
        Create Group
      </motion.button>

      {/* Create Group Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-4 border-purple-500/20 overflow-hidden"
            style={{ boxShadow: '0 0 25px rgba(139,92,246,0.08)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80">Create Group</h3>
              <motion.button
                onClick={() => setShowCreate(false)}
                whileTap={{ scale: 0.9 }}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-white/30" />
              </motion.button>
            </div>

            {/* Group Name Input */}
            <div>
              <label className="text-[10px] text-white/50 mb-1 block">Group Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-[10px] text-white/50 mb-1.5 block">Color</label>
              <div className="flex items-center gap-2.5">
                {presetColors.map((c) => (
                  <motion.button
                    key={c.name}
                    onClick={() => setNewColor(c.value)}
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl transition-all ${c.dot}`}
                      style={{
                        opacity: newColor === c.value ? 1 : 0.35,
                        boxShadow: newColor === c.value ? `0 0 12px ${c.value}40` : 'none',
                        transform: newColor === c.value ? 'scale(1.1)' : 'scale(1)',
                      }}
                    />
                    {newColor === c.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tag Selection */}
            <div>
              <label className="text-[10px] text-white/50 mb-1.5 block">Add Contacts by Tag</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <motion.button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedTags.includes(tag)
                        ? tagColors[tag] || 'bg-white/15 text-white/70 border-white/20'
                        : 'bg-white/5 text-white/35 border-white/5'
                    }`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex items-center gap-2.5">
              <motion.button
                onClick={createGroup}
                disabled={!newName.trim()}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save Group
              </motion.button>
              <motion.button
                onClick={() => { setShowCreate(false); setNewName(''); setSelectedTags([]); setNewColor(presetColors[0].value) }}
                whileTap={{ scale: 0.95 }}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {groups.map((group) => {
          const colorObj = getColorObj(group.color)
          return (
            <motion.div
              key={group.id}
              variants={cardVariant}
              className={`glass-card rounded-2xl transition-all ${!group.active ? 'opacity-45' : ''}`}
              whileHover={{ boxShadow: `0 0 20px ${group.color}10` }}
            >
              <div className="p-4 space-y-3">
                {/* Top row: color dot + name + count + toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Animated color dot */}
                    <motion.div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                      animate={{
                        boxShadow: group.active
                          ? [`0 0 0px ${group.color}00`, `0 0 8px ${group.color}60`, `0 0 0px ${group.color}00`]
                          : [`0 0 0px ${group.color}00`]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-bold text-white/95 truncate">{group.name}</h3>
                      <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> {group.contacts} contacts
                      </p>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <motion.button
                    onClick={() => toggleActive(group.id)}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0"
                  >
                    {group.active ? (
                      <ToggleRight className="w-7 h-7 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-white/20" />
                    )}
                  </motion.button>
                </div>

                {/* Avatar stack + last messaged */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-2">
                    {group.avatars.slice(0, 4).map((initials, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-[#0c0c14] flex items-center justify-center text-[7px] font-bold"
                        style={{
                          backgroundColor: `${group.color}25`,
                          color: group.color,
                          zIndex: 4 - idx,
                        }}
                      >
                        {initials}
                      </div>
                    ))}
                    {group.contacts > 4 && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-[#0c0c14] flex items-center justify-center text-[7px] font-bold bg-white/10 text-white/50"
                        style={{ zIndex: 0 }}
                      >
                        +{group.contacts - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-white/30">Last messaged {group.lastMessaged}</span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {group.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[8px] px-1.5 py-0.5 rounded-md border font-bold ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/15 hover:bg-blue-500/15 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[8px] text-blue-400 font-bold">Edit</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveFeature('send-message')}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-green-500/10 border border-green-500/15 hover:bg-green-500/15 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[8px] text-green-400 font-bold">Message</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => duplicateGroup(group)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-purple-500/10 border border-purple-500/15 hover:bg-purple-500/15 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[8px] text-purple-400 font-bold">Duplicate</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteConfirmId(deleteConfirmId === group.id ? null : group.id)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/15 transition-colors hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[8px] text-red-400 font-bold">Delete</span>
                  </motion.button>
                </div>

                {/* Delete Confirmation */}
                <AnimatePresence>
                  {deleteConfirmId === group.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-[11px] text-red-300/80 flex-1">Delete this group?</p>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteGroup(group.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors"
                          style={{ boxShadow: '0 0 15px rgba(239,68,68,0.15)' }}
                        >
                          Confirm
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[10px] font-medium border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-10 h-10 mx-auto text-white/10 mb-2" />
          <p className="text-sm text-white/25">No contact groups found</p>
          <p className="text-xs text-white/15 mt-1">Create your first group to get started</p>
        </div>
      )}

      {/* Gradient Divider */}
      <div className="gradient-divider" />

      {/* Smart Segments Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] font-bold text-purple-400/90 uppercase tracking-wider">Smart Segments</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>

        <div className="space-y-3">
          {smartSegments.map((segment, i) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`glass-card rounded-2xl p-4 border ${segment.accentBorder}`}
              style={{ boxShadow: `0 0 15px ${segment.color}08` }}
              whileHover={{ boxShadow: `0 0 25px ${segment.color}15` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${segment.color}15`,
                      border: `1px solid ${segment.color}20`,
                    }}
                  >
                    {segment.icon}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white/95">{segment.name}</h3>
                    <p className="text-[10px] text-white/50 mt-0.5">{segment.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: segment.color }}>{segment.members}</p>
                  <p className="text-[9px] text-white/30">members</p>
                </div>
              </div>
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-1.5 mt-2.5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-2.5 h-2.5" style={{ color: `${segment.color}80` }} />
                </motion.div>
                <span className="text-[9px] text-white/30">Auto-refreshed</span>
                <span className="text-[9px] text-white/15">•</span>
                <span className="text-[9px] text-white/30">Updated 5m ago</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

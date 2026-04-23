'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Plus, Radio, Edit, Send, Copy, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

interface BroadcastList {
  id: string
  name: string
  members: number
  tags: string[]
  lastUsed: string
  active: boolean
}

const mockLists: BroadcastList[] = [
  { id: '1', name: 'VIP Customers', members: 124, tags: ['vip', 'customer'], lastUsed: '2h ago', active: true },
  { id: '2', name: 'All Customers', members: 847, tags: ['customer'], lastUsed: '1d ago', active: true },
  { id: '3', name: 'Hot Leads', members: 89, tags: ['lead', 'hot'], lastUsed: '3d ago', active: true },
  { id: '4', name: 'Newsletter Subs', members: 342, tags: ['customer', 'lead'], lastUsed: '5d ago', active: false },
  { id: '5', name: 'Wholesale Buyers', members: 56, tags: ['wholesale'], lastUsed: '1w ago', active: true },
  { id: '6', name: 'New Prospects', members: 203, tags: ['prospect'], lastUsed: '2w ago', active: false },
]

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

const availableTags = ['customer', 'vip', 'lead', 'prospect', 'wholesale', 'hot']

export function BroadcastListsPage() {
  const [lists, setLists] = useState(mockLists)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalLists = lists.length
  const totalRecipients = lists.reduce((sum, l) => sum + l.members, 0)
  const activeLists = lists.filter(l => l.active).length

  const filtered = lists.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const createList = () => {
    if (!newName.trim() || selectedTags.length === 0) return
    setLists([
      ...lists,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        members: Math.floor(Math.random() * 100) + 10,
        tags: [...selectedTags],
        lastUsed: 'Just now',
        active: true,
      },
    ])
    setNewName('')
    setSelectedTags([])
    setShowCreate(false)
  }

  const toggleActive = (id: string) => {
    setLists(lists.map(l => l.id === id ? { ...l, active: !l.active } : l))
  }

  const deleteList = (id: string) => {
    setLists(lists.filter(l => l.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const duplicateList = (list: BroadcastList) => {
    setLists([
      ...lists,
      {
        ...list,
        id: Date.now().toString(),
        name: `${list.name} (Copy)`,
        lastUsed: 'Just now',
        active: true,
      },
    ])
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-4 neon-glow-cyan border border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/95">Broadcast Lists</h2>
            <p className="text-[10px] text-white/45">Targeted group messaging</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-cyan">{totalLists}</p>
          <p className="text-[10px] text-white/40">Total Lists</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-blue">{totalRecipients.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Total Recipients</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-green">{activeLists}</p>
          <p className="text-[10px] text-white/40">Active Lists</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search broadcast lists..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/30 transition-colors"
        />
      </div>

      {/* Create New List Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-3 border border-cyan-500/20 neon-glow-cyan overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80">New Broadcast List</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-white/40 mb-1 block">List Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter list name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/40 mb-1.5 block">Add Contacts by Tag</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedTags.includes(tag)
                        ? tagColors[tag]
                        : 'bg-white/5 text-white/35 border-white/5'
                    }`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={createList}
              disabled={!newName.trim() || selectedTags.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create List
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Lists */}
      <div className="space-y-2.5">
        {filtered.map((list, i) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`glass-card rounded-2xl transition-all ${!list.active ? 'opacity-50' : ''} ${
              expandedId === list.id ? 'border-cyan-500/20' : ''
            }`}
          >
            {/* Collapsed View */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-white/90 truncate">{list.name}</h3>
                    <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {list.members} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[9px] text-white/25">{list.lastUsed}</span>
                  {expandedId === list.id ? (
                    <ChevronUp className="w-4 h-4 text-white/20" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/20" />
                  )}
                </div>
              </div>

              {/* Tags Row */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {list.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-[8px] px-1.5 py-0.5 rounded-md border font-bold ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded View */}
            <AnimatePresence>
              {expandedId === list.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {/* Tags Horizontal */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {list.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${tagColors[tag] || 'bg-white/10 text-white/50 border-white/10'}`}
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </span>
                      ))}
                    </div>

                    {/* Member Breakdown Bar */}
                    <div>
                      <p className="text-[10px] text-white/40 mb-1.5">Member Breakdown</p>
                      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
                        {list.tags.map((tag, idx) => {
                          const percentages = list.tags.map((_, ti) => Math.floor(100 / list.tags.length) + (ti === 0 ? 100 - list.tags.length * Math.floor(100 / list.tags.length) : 0))
                          const colors = ['bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500']
                          return (
                            <div
                              key={tag}
                              className={`${colors[idx % colors.length]} transition-all`}
                              style={{ width: `${percentages[idx]}%` }}
                            />
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {list.tags.map((tag, idx) => {
                          const dotColors = ['bg-blue-500', 'bg-amber-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500']
                          return (
                            <span key={tag} className="flex items-center gap-1 text-[8px] text-white/30">
                              <span className={`w-1.5 h-1.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                              {tag}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50">Active</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleActive(list.id) }}
                        className={`w-9 h-5 rounded-full transition-colors relative ${list.active ? 'bg-cyan-500' : 'bg-white/10'}`}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                          style={{ transform: list.active ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button className="flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/15 hover:bg-blue-500/15 transition-colors">
                        <Edit className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[8px] text-blue-400 font-bold">Edit</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 py-2 rounded-xl bg-green-500/10 border border-green-500/15 hover:bg-green-500/15 transition-colors">
                        <Send className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[8px] text-green-400 font-bold">Send</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateList(list) }}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl bg-purple-500/10 border border-purple-500/15 hover:bg-purple-500/15 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[8px] text-purple-400 font-bold">Duplicate</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteList(list.id) }}
                        className="flex flex-col items-center gap-1 py-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/15 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-[8px] text-red-400 font-bold">Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Radio className="w-10 h-10 mx-auto text-white/10 mb-2" />
          <p className="text-sm text-white/25">No broadcast lists found</p>
        </div>
      )}

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg neon-glow-cyan z-30 hover:scale-105 transition-transform"
          style={{ boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

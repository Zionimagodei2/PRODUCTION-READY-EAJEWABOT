'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Plus, Radio, Edit, Send, Copy, Trash2, X, ChevronDown, ChevronUp, ArrowLeft, Loader2, Check } from 'lucide-react'

interface ApiContact {
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

interface BroadcastList {
  id: string
  name: string
  contactIds: string[]
  tags: string[]
  active: boolean
  createdAt: string
}

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

export function BroadcastListsPage() {
  const { goBack } = useAppStore()
  const [contacts, setContacts] = useState<ApiContact[]>([])
  const [lists, setLists] = useState<BroadcastList[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sendingListId, setSendingListId] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/contacts')
      if (!res.ok) throw new Error('Failed to fetch contacts')
      const data: ApiContact[] = await res.json()
      setContacts(data)
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Derive available tags from real contacts
  const availableTags = Array.from(new Set(
    contacts.flatMap(c => c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
  ))

  // Get contacts matching a set of tags
  const getContactsByTags = (tags: string[]) => {
    if (tags.length === 0) return []
    return contacts.filter(c => {
      const contactTags = c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      return tags.some(t => contactTags.includes(t))
    })
  }

  // Get contacts by IDs
  const getContactsByIds = (ids: string[]) => {
    return contacts.filter(c => ids.includes(c.id))
  }

  const totalLists = lists.length
  const totalRecipients = lists.reduce((sum, l) => sum + l.contactIds.length, 0)
  const activeLists = lists.filter(l => l.active).length

  const filtered = lists.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    )
  }

  const selectByTag = (tag: string) => {
    const matchingContactIds = getContactsByTags([tag]).map(c => c.id)
    const newIds = [...new Set([...selectedContactIds, ...matchingContactIds])]
    setSelectedContactIds(newIds)
  }

  const deselectByTag = (tag: string) => {
    const matchingContactIds = new Set(getContactsByTags([tag]).map(c => c.id))
    setSelectedContactIds(prev => prev.filter(id => !matchingContactIds.has(id)))
  }

  const createList = () => {
    if (!newName.trim() || selectedContactIds.length === 0) return
    // Determine tags from selected contacts
    const selectedContacts = getContactsByIds(selectedContactIds)
    const listTags = Array.from(new Set(
      selectedContacts.flatMap(c => c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    ))

    setLists([
      ...lists,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        contactIds: [...selectedContactIds],
        tags: listTags,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ])
    setNewName('')
    setSelectedContactIds([])
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
        active: true,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  const sendBroadcast = async (list: BroadcastList) => {
    setSendingListId(list.id)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Broadcast: ${list.name}`,
          status: 'scheduled',
          total: list.contactIds.length,
          sent: 0,
          delivered: 0,
          replies: 0,
          message: '',
        }),
      })
      if (!res.ok) throw new Error('Failed to create campaign')
      // Update the list as "sent"
      setLists(lists.map(l => l.id === list.id ? { ...l, active: true } : l))
    } catch (err) {
      console.error('Failed to send broadcast:', err)
    } finally {
      setSendingListId(null)
    }
  }

  // Filtered contacts for the create form
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

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
            <Radio className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Broadcast Lists</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Targeted group messaging</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-cyan-400">{totalLists}</p>
          <p className="text-[10px] text-white/40">Total Lists</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{totalRecipients.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">Total Recipients</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-400">{activeLists}</p>
          <p className="text-[10px] text-white/40">Active Lists</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search broadcast lists or contacts..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/30 transition-colors"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400/50 animate-spin mb-3" />
          <p className="text-sm text-white/40">Loading contacts...</p>
        </div>
      )}

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

            {/* Quick add by tag */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-[10px] text-white/40 mb-1.5 block">Quick Add by Tag</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const matchingIds = getContactsByTags([tag]).map(c => c.id)
                    const allSelected = matchingIds.length > 0 && matchingIds.every(id => selectedContactIds.includes(id))
                    return (
                      <button
                        key={tag}
                        onClick={() => allSelected ? deselectByTag(tag) : selectByTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          allSelected
                            ? tagColors[tag] || 'bg-white/15 text-white/70 border-white/20'
                            : 'bg-white/5 text-white/35 border-white/5'
                        }`}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)} ({matchingIds.length})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Select individual contacts */}
            <div>
              <label className="text-[10px] text-white/40 mb-1.5 block">
                Select Contacts ({selectedContactIds.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                      selectedContactIds.includes(contact.id)
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-white/15'
                    }`}>
                      {selectedContactIds.includes(contact.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-white/80 truncate">{contact.name}</p>
                      <p className="text-[9px] text-white/30">{contact.phone}</p>
                    </div>
                    {contact.tags && (
                      <div className="flex gap-1 flex-shrink-0">
                        {contact.tags.split(',').slice(0, 2).map(tag => (
                          <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/25">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
                {contacts.length === 0 && (
                  <p className="text-[11px] text-white/25 text-center py-4">No contacts available. Add contacts first.</p>
                )}
              </div>
            </div>

            <button
              onClick={createList}
              disabled={!newName.trim() || selectedContactIds.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Create List ({selectedContactIds.length} recipients)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Lists */}
      {!isLoading && (
        <div className="space-y-2.5">
          {filtered.map((list, i) => {
            const listContacts = getContactsByIds(list.contactIds)
            return (
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
                        <Radio className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold text-white/90 truncate">{list.name}</h3>
                        <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" /> {list.contactIds.length} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] text-white/25">
                        {new Date(list.createdAt).toLocaleDateString()}
                      </span>
                      {expandedId === list.id ? (
                        <ChevronUp className="w-4 h-4 text-white/20" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                  </div>

                  {/* Tags Row */}
                  {list.tags.length > 0 && (
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
                  )}
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
                        {list.tags.length > 0 && (
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
                        )}

                        {/* Member list preview */}
                        <div>
                          <p className="text-[10px] text-white/40 mb-1.5">Members ({listContacts.length})</p>
                          <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                            {listContacts.slice(0, 10).map(contact => (
                              <div key={contact.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/[0.02]">
                                <div className="w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center text-[7px] font-bold text-cyan-400">
                                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-[10px] text-white/60 truncate">{contact.name}</span>
                                <span className="text-[9px] text-white/25 ml-auto">{contact.phone}</span>
                              </div>
                            ))}
                            {listContacts.length > 10 && (
                              <p className="text-[9px] text-white/25 text-center py-1">
                                +{listContacts.length - 10} more contacts
                              </p>
                            )}
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
                          <button
                            onClick={(e) => { e.stopPropagation(); sendBroadcast(list) }}
                            disabled={sendingListId === list.id}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-green-500/10 border border-green-500/15 hover:bg-green-500/15 transition-colors disabled:opacity-50"
                          >
                            {sendingListId === list.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5 text-green-400" />
                            )}
                            <span className="text-[8px] text-green-400 font-bold">
                              {sendingListId === list.id ? 'Sending' : 'Send'}
                            </span>
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
            )
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Radio className="w-10 h-10 mx-auto text-white/10 mb-2" />
          {lists.length === 0 ? (
            <>
              <p className="text-sm text-white/25">No broadcast lists yet</p>
              <p className="text-xs text-white/15 mt-1">Create your first list to send targeted broadcasts</p>
            </>
          ) : (
            <p className="text-sm text-white/25">No broadcast lists found</p>
          )}
        </div>
      )}

      {/* FAB */}
      {!showCreate && !isLoading && (
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

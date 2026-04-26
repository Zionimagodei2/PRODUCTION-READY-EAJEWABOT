'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Play, Pause, Download, CheckCircle2, ArrowLeft, Search, Plus, X, Trash2,
  Globe, ExternalLink, Bookmark, BookmarkCheck, Loader2, Sparkles, ChevronDown,
  ChevronUp, Filter, MapPin, Link2, AlertCircle, RotateCw, Eye, Smartphone,
  Phone, MessageSquare
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

// --- Types ---
interface DiscoveredGroup {
  id?: string
  name: string
  inviteLink: string
  description: string
  category: string
  members: number
  source: string
  sourceName: string
  saved?: boolean
}

interface ManualGroup {
  id: string
  name: string
  members: number
  addedAt: string
}

interface ExtractedContact {
  name: string
  phone: string
  group: string
}

type SearchMode = 'search' | 'manual'

// --- Component ---
export function GroupExtractorPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  // Mode state
  const [mode, setMode] = useState<SearchMode>('search')

  // Search mode state
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<DiscoveredGroup[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [deepScan, setDeepScan] = useState(false)

  // Manual mode state
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState<ExtractedContact[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [groups, setGroups] = useState<ManualGroup[]>([])
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMembers, setNewGroupMembers] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Saved groups
  const [savedGroups, setSavedGroups] = useState<DiscoveredGroup[]>([])
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [manualSectionOpen, setManualSectionOpen] = useState(false)

  // Load saved groups on mount
  useEffect(() => {
    const loadSavedGroups = async () => {
      try {
        const res = await fetch('/api/group-search?saved=true')
        if (res.ok) {
          const data = await res.json()
          setSavedGroups(data.groups || [])
        }
      } catch {
        // Failed to load saved groups
      }
    }
    loadSavedGroups()
  }, [])

  // --- Search Mode Handlers ---
  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      addToast({ type: 'warning', title: 'Keyword required', message: 'Please enter a search keyword' })
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setHasSearched(true)

    try {
      const res = await fetch('/api/group-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim(),
          deepScan,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.groups || [])

        if (data.groups?.length === 0) {
          addToast({ type: 'info', title: 'No groups found', message: `No WhatsApp groups found for "${keyword}". Try a different keyword.` })
        } else {
          addToast({ type: 'success', title: 'Groups discovered', message: `Found ${data.groups.length} WhatsApp group(s) for "${keyword}"` })
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        addToast({ type: 'error', title: 'Search failed', message: errorData.error || 'Could not search for groups. Try again.' })
      }
    } catch {
      addToast({ type: 'error', title: 'Network error', message: 'Could not connect to the search service' })
    } finally {
      setIsSearching(false)
    }
  }, [keyword, location, deepScan, addToast])

  const handleSaveGroup = useCallback(async (group: DiscoveredGroup, index: number) => {
    if (!group.id) return

    const newSavedState = !group.saved
    try {
      const res = await fetch('/api/group-search', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, saved: newSavedState }),
      })

      if (res.ok) {
        setSearchResults(prev => prev.map((g, i) =>
          i === index ? { ...g, saved: newSavedState } : g
        ))
        if (newSavedState) {
          setSavedGroups(prev => [...prev, { ...group, saved: true }])
          addToast({ type: 'success', title: 'Group saved', message: `${group.name} added to saved groups` })
        } else {
          setSavedGroups(prev => prev.filter(g => g.id !== group.id))
          addToast({ type: 'info', title: 'Unsaved', message: `${group.name} removed from saved groups` })
        }
      }
    } catch {
      addToast({ type: 'error', title: 'Failed', message: 'Could not update group save state' })
    }
  }, [addToast])

  // --- Manual Mode Handlers ---
  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) {
      addToast({ type: 'warning', title: 'Name required', message: 'Please enter a group name' })
      return
    }
    const newGroup: ManualGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      members: parseInt(newGroupMembers) || 0,
      addedAt: new Date().toISOString(),
    }
    setGroups(prev => [...prev, newGroup])
    setNewGroupName('')
    setNewGroupMembers('')
    setShowAddGroup(false)
    addToast({ type: 'success', title: 'Group added', message: `${newGroup.name} has been added` })
  }, [newGroupName, newGroupMembers, addToast])

  const handleRemoveGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    if (selectedGroup === id) setSelectedGroup(null)
    setExtracted(prev => prev.filter(c => {
      const group = groups.find(g => g.id === id)
      return group ? c.group !== group.name : true
    }))
  }, [selectedGroup, groups])

  const handleAddContact = useCallback(() => {
    if (!contactName.trim() || !contactPhone.trim()) {
      addToast({ type: 'warning', title: 'Info required', message: 'Please enter both name and phone number' })
      return
    }
    if (!selectedGroup) {
      addToast({ type: 'warning', title: 'No group selected', message: 'Please select a group first' })
      return
    }
    const group = groups.find(g => g.id === selectedGroup)
    if (!group) return

    const newContact: ExtractedContact = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      group: group.name,
    }
    setExtracted(prev => [...prev, newContact])
    setContactName('')
    setContactPhone('')
    setShowAddContact(false)
    addToast({ type: 'success', title: 'Contact added', message: `${newContact.name} added to ${group.name}` })
  }, [contactName, contactPhone, selectedGroup, groups, addToast])

  const startExtraction = useCallback(() => {
    if (!selectedGroup) {
      addToast({ type: 'warning', title: 'No group selected', message: 'Please select a group to extract from' })
      return
    }
    setExtracting(true)
    setProgress(0)

    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 12
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setExtracting(false)
        const group = groups.find(g => g.id === selectedGroup)
        if (group) {
          const groupContacts = extracted.filter(c => c.group === group.name)
          if (groupContacts.length === 0) {
            addToast({ type: 'info', title: 'No contacts found', message: 'No contacts to extract from this group. Add contacts manually.' })
          } else {
            addToast({ type: 'success', title: 'Extraction complete', message: `${groupContacts.length} contacts found in ${group.name}` })
          }
        }
      }
      setProgress(p)
    }, 350)
  }, [selectedGroup, groups, extracted, addToast])

  // Export functions
  const exportCSV = (data: ExtractedContact[]) => {
    const headers = 'Name,Phone,Group\n'
    const rows = data.map(c => `${c.name},${c.phone},${c.group}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group-contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported', message: `${data.length} contacts exported as CSV` })
  }

  const exportJSON = (data: ExtractedContact[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group-contacts.json'
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported', message: `${data.length} contacts exported as JSON` })
  }

  // Export as VCF (vCard) for saving to phone/cloud contacts
  const exportVCF = (data: ExtractedContact[]) => {
    const vcfContent = data.map(c => {
      const phone = c.phone.replace(/[^\d+]/g, '')
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.name}`,
        `TEL;TYPE=CELL:${phone}`,
        `ORG:${c.group}`,
        'END:VCARD',
      ].join('\n')
    }).join('\n')
    const blob = new Blob([vcfContent], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'whatsapp-contacts.vcf'
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Saved to Phone', message: `${data.length} contacts exported as VCF — open to save to phone/cloud` })
  }

  const filteredExtracted = selectedGroup
    ? extracted.filter(c => {
        const group = groups.find(g => g.id === selectedGroup)
        return group ? c.group === group.name : true
      })
    : extracted

  const displayedGroups = showSavedOnly
    ? searchResults.filter(g => g.saved)
    : searchResults

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white/90">Group Extractor</h2>
          <p className="text-[10px] text-white/40">Discover & extract WhatsApp groups</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setMode('search')}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
            mode === 'search'
              ? 'bg-neon-green/15 text-neon-green border-neon-green/25'
              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
          }`}
          style={mode === 'search' ? { boxShadow: '0 0 12px rgba(34,197,94,0.1)' } : {}}
        >
          <Globe className="w-3.5 h-3.5" /> Search Online
        </motion.button>
        <motion.button
          onClick={() => setMode('manual')}
          whileTap={{ scale: 0.97 }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
            mode === 'manual'
              ? 'bg-neon-blue/15 text-neon-blue border-neon-blue/25'
              : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
          }`}
          style={mode === 'manual' ? { boxShadow: '0 0 12px rgba(59,130,246,0.1)' } : {}}
        >
          <Users className="w-3.5 h-3.5" /> Manual
        </motion.button>
      </div>

      {/* ===================== SEARCH MODE ===================== */}
      <AnimatePresence mode="wait">
        {mode === 'search' && (
          <motion.div
            key="search-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search Card */}
            <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
                  <Globe className="w-5 h-5 text-neon-green" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white/90">Search WhatsApp Groups</h3>
                  <p className="text-[10px] text-white/40">Discover real groups online</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] text-white/30">Deep</label>
                  <button
                    onClick={() => setDeepScan(!deepScan)}
                    className={`w-8 h-4 rounded-full transition-all flex items-center ${
                      deepScan ? 'bg-green-500/40 justify-end' : 'bg-white/10 justify-start'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full transition-all mx-0.5 ${
                      deepScan ? 'bg-neon-green' : 'bg-white/30'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Keyword Input */}
                <div>
                  <label className="text-[11px] text-white/50 font-medium mb-1 block">Search Keyword</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                      placeholder="e.g. Marketing, Tech, Business..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-green-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* Location Input */}
                <div>
                  <label className="text-[11px] text-white/50 font-medium mb-1 block">Location (optional)</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                      placeholder="e.g. Nigeria, India, Brazil..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-green-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={isSearching || !keyword.trim()}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    isSearching
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : keyword.trim()
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-neon-green border border-neon-green/25 hover:from-green-500/25 hover:to-emerald-500/25'
                        : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                  }`}
                  style={!isSearching && keyword.trim() ? { boxShadow: '0 0 20px rgba(34,197,94,0.15)' } : {}}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {deepScan ? 'Deep scanning...' : 'Searching...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {deepScan ? 'Deep Scan Groups' : 'Search Groups'}
                    </>
                  )}
                </motion.button>

                {deepScan && (
                  <p className="text-[9px] text-white/25 text-center">
                    Deep scan scrapes pages for more accurate results but takes longer
                  </p>
                )}
              </div>
            </div>

            {/* Saved Groups Filter */}
            {savedGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    showSavedOnly
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  Saved ({savedGroups.length})
                </motion.button>
                {searchResults.length > 0 && (
                  <span className="text-[10px] text-white/30">
                    {displayedGroups.length} result{displayedGroups.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Search Results */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                        <div className="h-2 bg-white/5 rounded w-full" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {!isSearching && hasSearched && displayedGroups.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-8 text-center"
              >
                <Globe className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/50 font-medium mb-1">No groups found</p>
                <p className="text-[10px] text-white/25 mb-3">
                  Try different keywords or enable deep scan for better results
                </p>
                <motion.button
                  onClick={handleSearch}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/15 transition-colors"
                >
                  <RotateCw className="w-3 h-3" /> Retry Search
                </motion.button>
              </motion.div>
            )}

            {!isSearching && displayedGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white/70">
                    Discovered Groups ({displayedGroups.length})
                  </h4>
                </div>

                <div className="max-h-96 overflow-y-auto no-scrollbar space-y-2">
                  {displayedGroups.map((group, i) => (
                    <motion.div
                      key={group.id || `${group.name}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-xl p-4 hover:bg-white/[0.03] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Group icon */}
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10 flex-shrink-0">
                          <Users className="w-5 h-5 text-neon-green" />
                        </div>

                        {/* Group info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white/90 truncate">{group.name}</h5>
                            {group.members > 0 && (
                              <span className="text-[9px] text-white/30 flex-shrink-0 bg-white/[0.04] px-1.5 py-0.5 rounded">
                                {group.members.toLocaleString()} members
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <p className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{group.description}</p>
                          )}
                          {group.inviteLink && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Link2 className="w-3 h-3 text-neon-cyan" />
                              <a
                                href={group.inviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-neon-cyan/70 truncate font-mono hover:text-neon-cyan transition-colors"
                              >
                                {group.inviteLink.replace('https://', '')}
                              </a>
                            </div>
                          )}
                          {group.sourceName && (
                            <p className="text-[9px] text-white/20 mt-1">
                              Source: {group.sourceName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04] flex-wrap">
                        {group.inviteLink && (
                          <a
                            href={group.inviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-[11px] font-semibold hover:bg-neon-green/15 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Join Group
                          </a>
                        )}
                        {group.inviteLink && (
                          <a
                            href={group.inviteLink.startsWith('https://chat.whatsapp.com') ? group.inviteLink : `https://wa.me/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-semibold hover:bg-green-500/15 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                        {group.id && (
                          <motion.button
                            onClick={() => handleSaveGroup(group, i)}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                              group.saved
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {group.saved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                            {group.saved ? 'Saved' : 'Save'}
                          </motion.button>
                        )}
                        {group.inviteLink && (
                          <motion.button
                            onClick={() => {
                              navigator.clipboard.writeText(group.inviteLink)
                              addToast({ type: 'success', title: 'Copied', message: 'Invite link copied to clipboard' })
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[11px] font-semibold hover:bg-white/10 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Copy Link
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick tips when no search has been made */}
            {!hasSearched && !isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-xl p-5 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/15 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-neon-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/80 mb-1">Discover WhatsApp Groups</h3>
                  <p className="text-[11px] text-white/35 leading-relaxed">
                    Search for WhatsApp group invite links by keyword. Find communities
                    related to your niche and join them directly.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Marketing', 'Tech', 'Business', 'Crypto', 'Education', 'Fitness'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setKeyword(tag) }}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-medium hover:bg-white/10 hover:text-white/60 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Collapsible Manual Section in Search Mode */}
            <div className="glass-card rounded-xl overflow-hidden border border-white/[0.06]">
              <button
                onClick={() => setManualSectionOpen(!manualSectionOpen)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-[11px] font-semibold text-white/40">Manual: Add Groups & Contacts</span>
                </div>
                {manualSectionOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-white/20" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-white/20" />
                )}
              </button>

              <AnimatePresence>
                {manualSectionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ManualGroupSection
                      groups={groups}
                      setGroups={setGroups}
                      selectedGroup={selectedGroup}
                      setSelectedGroup={setSelectedGroup}
                      extracting={extracting}
                      progress={progress}
                      extracted={extracted}
                      setExtracted={setExtracted}
                      showAddGroup={showAddGroup}
                      setShowAddGroup={setShowAddGroup}
                      newGroupName={newGroupName}
                      setNewGroupName={setNewGroupName}
                      newGroupMembers={newGroupMembers}
                      setNewGroupMembers={setNewGroupMembers}
                      showAddContact={showAddContact}
                      setShowAddContact={setShowAddContact}
                      contactName={contactName}
                      setContactName={setContactName}
                      contactPhone={contactPhone}
                      setContactPhone={setContactPhone}
                      handleAddGroup={handleAddGroup}
                      handleRemoveGroup={handleRemoveGroup}
                      handleAddContact={handleAddContact}
                      startExtraction={startExtraction}
                      filteredExtracted={filteredExtracted}
                      exportCSV={exportCSV}
                      exportJSON={exportJSON}
                      exportVCF={exportVCF}
                      addToast={addToast}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== MANUAL MODE ===================== */}
      <AnimatePresence mode="wait">
        {mode === 'manual' && (
          <motion.div
            key="manual-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <ManualGroupSection
              groups={groups}
              setGroups={setGroups}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              extracting={extracting}
              progress={progress}
              extracted={extracted}
              setExtracted={setExtracted}
              showAddGroup={showAddGroup}
              setShowAddGroup={setShowAddGroup}
              newGroupName={newGroupName}
              setNewGroupName={setNewGroupName}
              newGroupMembers={newGroupMembers}
              setNewGroupMembers={setNewGroupMembers}
              showAddContact={showAddContact}
              setShowAddContact={setShowAddContact}
              contactName={contactName}
              setContactName={setContactName}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              handleAddGroup={handleAddGroup}
              handleRemoveGroup={handleRemoveGroup}
              handleAddContact={handleAddContact}
              startExtraction={startExtraction}
              filteredExtracted={filteredExtracted}
              exportCSV={exportCSV}
              exportJSON={exportJSON}
              exportVCF={exportVCF}
              addToast={addToast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Manual Group Section (Reusable) ---
interface ManualGroupSectionProps {
  groups: ManualGroup[]
  setGroups: React.Dispatch<React.SetStateAction<ManualGroup[]>>
  selectedGroup: string | null
  setSelectedGroup: (id: string | null) => void
  extracting: boolean
  progress: number
  extracted: ExtractedContact[]
  setExtracted: React.Dispatch<React.SetStateAction<ExtractedContact[]>>
  showAddGroup: boolean
  setShowAddGroup: (show: boolean) => void
  newGroupName: string
  setNewGroupName: (name: string) => void
  newGroupMembers: string
  setNewGroupMembers: (members: string) => void
  showAddContact: boolean
  setShowAddContact: (show: boolean) => void
  contactName: string
  setContactName: (name: string) => void
  contactPhone: string
  setContactPhone: (phone: string) => void
  handleAddGroup: () => void
  handleRemoveGroup: (id: string) => void
  handleAddContact: () => void
  startExtraction: () => void
  filteredExtracted: ExtractedContact[]
  exportCSV: (data: ExtractedContact[]) => void
  exportJSON: (data: ExtractedContact[]) => void
  exportVCF: (data: ExtractedContact[]) => void
  addToast: (toast: { type: string; title: string; message: string }) => void
}

function ManualGroupSection({
  groups,
  selectedGroup,
  setSelectedGroup,
  extracting,
  progress,
  extracted,
  showAddGroup,
  setShowAddGroup,
  newGroupName,
  setNewGroupName,
  newGroupMembers,
  setNewGroupMembers,
  showAddContact,
  setShowAddContact,
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  handleAddGroup,
  handleRemoveGroup,
  handleAddContact,
  startExtraction,
  filteredExtracted,
  exportCSV,
  exportJSON,
  exportVCF,
  addToast,
}: ManualGroupSectionProps) {
  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Group Selection */}
      <div className="glass-card rounded-xl p-4 neon-glow-blue border border-blue-500/15">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
              <Users className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Your Groups</h3>
              <p className="text-[10px] text-white/40">{groups.length} group{groups.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowAddGroup(true)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/15 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </motion.button>
        </div>

        {groups.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/40 font-medium mb-1">No groups added yet</p>
            <p className="text-[10px] text-white/25 mb-3">Add WhatsApp groups to extract members from</p>
            <motion.button
              onClick={() => setShowAddGroup(true)}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/15 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Group
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border group ${
                  selectedGroup === g.id
                    ? 'bg-blue-500/10 border-blue-500/25 text-white/90'
                    : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5'
                }`}
              >
                <button
                  onClick={() => setSelectedGroup(g.id)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <Users className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span className="truncate">{g.name}</span>
                  <span className="text-[10px] text-white/30 flex-shrink-0">{g.members} members</span>
                </button>
                <button
                  onClick={() => handleRemoveGroup(g.id)}
                  className="text-white/15 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Extraction & Contact Addition */}
        {groups.length > 0 && (
          <div className="flex gap-2">
            <motion.button
              onClick={startExtraction}
              disabled={extracting || !selectedGroup}
              whileTap={{ scale: 0.97 }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                extracting
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : selectedGroup
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/25 hover:bg-neon-blue/25'
                    : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
              }`}
            >
              {extracting ? <><Pause className="w-3.5 h-3.5" /> Extracting...</> : <><Play className="w-3.5 h-3.5" /> Extract</>}
            </motion.button>
            <motion.button
              onClick={() => {
                if (!selectedGroup) {
                  addToast({ type: 'warning', title: 'Select a group', message: 'Please select a group first' })
                  return
                }
                setShowAddContact(true)
              }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/15 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Contact
            </motion.button>
          </div>
        )}
      </div>

      {/* Progress */}
      {(extracting || progress > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 space-y-2"
        >
          <div className="flex justify-between text-xs">
            <span className="text-white/50">{extracting ? 'Scanning group members...' : 'Extraction Complete'}</span>
            <span className="text-neon-blue font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Results */}
      {filteredExtracted.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/70">Extracted Contacts ({filteredExtracted.length})</h4>
            <div className="flex gap-2">
              <button onClick={() => exportCSV(filteredExtracted)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[11px] font-medium hover:bg-neon-blue/20 transition-colors">
                <Download className="w-3 h-3" /> CSV
              </button>
              <button onClick={() => exportJSON(filteredExtracted)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-[11px] font-medium hover:bg-neon-purple/20 transition-colors">
                <Download className="w-3 h-3" /> JSON
              </button>
              <button onClick={() => exportVCF(filteredExtracted)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 text-[11px] font-medium hover:bg-neon-green/20 transition-colors">
                <Smartphone className="w-3 h-3" /> Save to Phone
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto no-scrollbar space-y-2">
            {filteredExtracted.map((contact, i) => (
              <motion.div
                key={`${contact.name}-${contact.phone}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-neon-blue">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80">{contact.name}</p>
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                      className="text-[10px] text-neon-green/70 font-mono hover:text-neon-green transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^\d]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-medium hover:bg-green-500/15 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare className="w-2.5 h-2.5" /> Chat
                  </a>
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-medium hover:bg-blue-500/15 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-2.5 h-2.5" /> Call
                  </a>
                  <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{contact.group}</span>
                  <CheckCircle2 className="w-4 h-4 text-neon-blue" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Group Modal */}
      <AnimatePresence>
        {showAddGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddGroup(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#14141f] border-t border-white/10 rounded-t-3xl p-5 space-y-4"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/95">Add WhatsApp Group</h3>
                  <p className="text-[10px] text-white/40">Enter the group details manually</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Marketing Team"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Approximate Members</label>
                <input
                  type="number"
                  value={newGroupMembers}
                  onChange={(e) => setNewGroupMembers(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowAddGroup(false)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddGroup}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/25 text-blue-300 font-bold text-sm"
                  style={{ boxShadow: '0 0 15px rgba(59,130,246,0.15)' }}
                >
                  Add Group
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddContact(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#14141f] border-t border-white/10 rounded-t-3xl p-5 space-y-4"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/95">Add Contact to Group</h3>
                  <p className="text-[10px] text-white/40">Adding to selected group</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-purple-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 555 0101"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 font-mono focus:outline-none focus:border-purple-500/30 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowAddContact(false)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddContact}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/25 text-purple-300 font-bold text-sm"
                  style={{ boxShadow: '0 0 15px rgba(139,92,246,0.15)' }}
                >
                  Add Contact
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Play, Pause, Download, CheckCircle2, ArrowLeft, Search, Plus, X, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

interface WhatsAppGroup {
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

export function GroupExtractorPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState<ExtractedContact[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // Groups are managed in component state - no mock data
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupMembers, setNewGroupMembers] = useState('')

  // Manual contact addition
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) {
      addToast({ type: 'warning', title: 'Name required', message: 'Please enter a group name' })
      return
    }
    const newGroup: WhatsAppGroup = {
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
  }, [selectedGroup, groups, addToast])

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
        // Show extracted contacts for the selected group only
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

  const exportCSV = () => {
    const headers = 'Name,Phone,Group\n'
    const rows = extracted.map(c => `${c.name},${c.phone},${c.group}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group-contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported', message: `${extracted.length} contacts exported as CSV` })
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(extracted, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group-contacts.json'
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported', message: `${extracted.length} contacts exported as JSON` })
  }

  const filteredExtracted = selectedGroup
    ? extracted.filter(c => {
        const group = groups.find(g => g.id === selectedGroup)
        return group ? c.group === group.name : true
      })
    : extracted

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
          <p className="text-[10px] text-white/40">Extract contacts from WhatsApp groups</p>
        </div>
      </div>

      {/* Group Selection */}
      <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
              <Users className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Your Groups</h3>
              <p className="text-[10px] text-white/40">{groups.length} group{groups.length !== 1 ? 's' : ''} added</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowAddGroup(true)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold hover:bg-green-500/15 transition-colors"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/15 transition-colors"
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
                    ? 'bg-green-500/10 border-green-500/25 text-white/90'
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
                    ? 'bg-neon-green/15 text-neon-green border border-neon-green/25 hover:bg-neon-green/25'
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
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/15 transition-colors"
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
            <span className="text-neon-green font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan"
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
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[11px] font-medium hover:bg-neon-blue/20 transition-colors">
                <Download className="w-3 h-3" /> CSV
              </button>
              <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-[11px] font-medium hover:bg-neon-purple/20 transition-colors">
                <Download className="w-3 h-3" /> JSON
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
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-[10px] font-bold text-neon-green">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80">{contact.name}</p>
                    <p className="text-[10px] text-white/30">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">{contact.group}</span>
                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
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
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
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
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-green-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Approximate Members</label>
                <input
                  type="number"
                  value={newGroupMembers}
                  onChange={(e) => setNewGroupMembers(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-green-500/30 transition-all"
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/25 text-green-300 font-bold text-sm"
                  style={{ boxShadow: '0 0 15px rgba(34,197,94,0.15)' }}
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/95">Add Contact to Group</h3>
                  <p className="text-[10px] text-white/40">
                    Adding to {groups.find(g => g.id === selectedGroup)?.name || 'selected group'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-white/50 font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 555 0101"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 font-mono focus:outline-none focus:border-blue-500/30 transition-all"
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
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/25 text-blue-300 font-bold text-sm"
                  style={{ boxShadow: '0 0 15px rgba(59,130,246,0.15)' }}
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

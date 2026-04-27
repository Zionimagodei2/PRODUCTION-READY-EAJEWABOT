'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  Send, Clock, Users, FileText, Upload, CheckCircle2, AlertCircle, ArrowLeft,
  Hash, ImageIcon, Zap, X, Mic, Smartphone, Calendar, Repeat,
  ChevronDown, Check, CheckCheck, UserPlus, Phone
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  phone: string
  tags: string
  status: string
  company: string
}

interface TagGroup {
  tag: string
  label: string
  count: number
}

interface WhatsAppGroup {
  id: string
  name: string
  members: number
  description: string
}

interface SelectedRecipient {
  id: string
  name: string
  phone: string
  type: 'contact' | 'manual'
}

type RecipientMode = 'contacts' | 'groups' | 'manual'
type ScheduleMode = 'now' | 'scheduled' | 'recurring'
type RecurringType = 'daily' | 'weekly' | 'monthly'

const TEMPLATE_VARIABLES = [
  { key: '{name}', label: 'Name', sample: 'John' },
  { key: '{phone}', label: 'Phone', sample: '+1 234 567 890' },
  { key: '{company}', label: 'Company', sample: 'Acme Inc' },
  { key: '{date}', label: 'Date', sample: new Date().toLocaleDateString() },
]

const SMS_LIMIT = 160

export function SendMessagePage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Message state
  const [message, setMessage] = useState('')
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('contacts')
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [recurringType, setRecurringType] = useState<RecurringType>('daily')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Media attachments
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'document' | 'audio'>('none')
  const [mediaName, setMediaName] = useState('')
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)

  // Recipients
  const [selectedContacts, setSelectedContacts] = useState<SelectedRecipient[]>([])
  const [manualPhones, setManualPhones] = useState('')
  const [contactsList, setContactsList] = useState<Contact[]>([])
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  // Data from DB
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [waGroups, setWaGroups] = useState<WhatsAppGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const { waConnected } = useAppStore()

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/contacts')
        if (res.ok) {
          const contacts: Contact[] = await res.json()
          setContactsList(contacts)
          setTotalContacts(contacts.length)

          const tagMap = new Map<string, number>()
          contacts.forEach((c) => {
            if (c.tags) {
              const tags = c.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
              tags.forEach((tag) => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
              })
            }
          })

          const groups: TagGroup[] = Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({
              tag,
              label: tag.charAt(0).toUpperCase() + tag.slice(1),
              count,
            }))

          setTagGroups(groups)
          if (groups.length > 0) setSelectedTag(groups[0].tag)
        }
      } catch {
        addToast({ type: 'error', title: 'Failed to load contacts', message: 'Could not fetch contact data' })
      } finally {
        setLoading(false)
      }
    }
    fetchContacts()
  }, [])

  // Fetch WhatsApp groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!waConnected) {
        setWaGroups([])
        setLoadingGroups(false)
        return
      }
      try {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-groups' }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.groups && Array.isArray(data.groups)) {
            const groups: WhatsAppGroup[] = data.groups.map((g: { id?: string; name?: string; members?: number; description?: string; subject?: string; size?: number; desc?: string }) => ({
              id: g.id || '',
              name: g.name || g.subject || 'Unknown Group',
              members: g.members || g.size || 0,
              description: g.description || g.desc || '',
            }))
            setWaGroups(groups)
            if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0].id)
          }
        }
      } catch {
        setWaGroups([])
      } finally {
        setLoadingGroups(false)
      }
    }
    fetchGroups()
  }, [waConnected])

  // Character count & SMS segments
  const charCount = message.length
  const smsSegments = charCount === 0 ? 0 : Math.ceil(charCount / SMS_LIMIT)
  const charColor = charCount === 0 ? 'text-white/25' : charCount <= 130 ? 'text-green-400' : charCount <= SMS_LIMIT ? 'text-amber-400' : 'text-red-400'

  // Preview message with variables replaced
  const previewMessage = useMemo(() => {
    let preview = message
    for (const v of TEMPLATE_VARIABLES) {
      preview = preview.replaceAll(v.key, v.sample)
    }
    return preview
  }, [message])

  // Filtered contacts for picker
  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contactsList
    const q = contactSearch.toLowerCase()
    return contactsList.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [contactsList, contactSearch])

  const getSelectedCount = () => {
    if (recipientMode === 'contacts') {
      if (selectedContacts.length > 0) return selectedContacts.length
      if (selectedTag === 'all') return totalContacts
      return tagGroups.find((g) => g.tag === selectedTag)?.count ?? 0
    }
    if (recipientMode === 'groups') {
      return waGroups.find((g) => g.id === selectedGroup)?.members ?? 0
    }
    if (recipientMode === 'manual') {
      return manualPhones.split(/[,\n]/).filter(p => p.trim().length > 0).length
    }
    return 0
  }

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) {
      setMessage(prev => prev + variable)
      return
    }
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.slice(0, start) + variable + message.slice(end)
    setMessage(newMessage)
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      setMediaType('image')
      setMediaName(file.name)
      const reader = new FileReader()
      reader.onload = (ev) => setMediaPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('audio/')) {
      setMediaType('audio')
      setMediaName(file.name)
      setMediaPreview(null)
    } else {
      setMediaType('document')
      setMediaName(file.name)
      setMediaPreview(null)
    }
  }

  const removeAttachment = () => {
    setMediaType('none')
    setMediaName('')
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleContact = (contact: Contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(r => r.id === contact.id)
      if (exists) {
        return prev.filter(r => r.id !== contact.id)
      }
      return [...prev, { id: contact.id, name: contact.name, phone: contact.phone, type: 'contact' as const }]
    })
  }

  const handleSend = async () => {
    if (!message.trim()) {
      addToast({ type: 'warning', title: 'Empty Message', message: 'Please type a message before sending' })
      return
    }

    setSending(true)

    try {
      let recipientCount = getSelectedCount()

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Campaign - ${new Date().toLocaleDateString()}`,
          status: scheduleMode === 'now' ? 'active' : 'scheduled',
          total: recipientCount,
          message: message,
        }),
      })

      if (!res.ok) throw new Error('Failed to create campaign')

      setSending(false)
      setSent(true)
      addToast({
        type: 'success',
        title: 'Campaign Created!',
        message: `Campaign queued for ${recipientCount} recipients`,
        duration: 4000,
      })
      setTimeout(() => setSent(false), 3000)
    } catch {
      setSending(false)
      addToast({ type: 'error', title: 'Send Failed', message: 'Could not create campaign. Please try again.' })
    }
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
            <Send className="w-5 h-5 text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Send Message</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Compose & deliver messages</p>
        </div>
      </div>

      {/* Recipients Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Recipients</span>
          {!loading && (
            <span className="text-[10px] text-white/30 ml-auto">{totalContacts} total contacts</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'contacts' as RecipientMode, label: 'Contacts', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'groups' as RecipientMode, label: 'Groups', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'manual' as RecipientMode, label: 'Phone #', icon: <Phone className="w-3.5 h-3.5" /> },
          ].map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setRecipientMode(type.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 border ${
                recipientMode === type.id
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={recipientMode === type.id ? { boxShadow: '0 0 15px rgba(34,197,94,0.15)' } : undefined}
            >
              {type.icon}
              <span className="truncate">{type.label}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {recipientMode === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {/* Tag selector */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/20 transition-all"
              >
                <option value="all" className="bg-[#14141f] text-white/80">All Contacts ({totalContacts})</option>
                {tagGroups.map((group) => (
                  <option key={group.tag} value={group.tag} className="bg-[#14141f] text-white/80">
                    {group.label} ({group.count} contacts)
                  </option>
                ))}
              </select>

              {/* Individual contact picker */}
              <div>
                <motion.button
                  onClick={() => setShowContactPicker(!showContactPicker)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:bg-white/[0.06] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-green-400/50" />
                  <span>Select individual contacts</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showContactPicker ? 'rotate-180' : ''}`} />
                </motion.button>
                <AnimatePresence>
                  {showContactPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Search contacts..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 placeholder:text-white/25 focus:outline-none focus:border-green-500/20 transition-all"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                          {filteredContacts.slice(0, 20).map(contact => (
                            <button
                              key={contact.id}
                              onClick={() => toggleContact(contact)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                                selectedContacts.find(r => r.id === contact.id)
                                  ? 'bg-green-500/10 border border-green-500/20'
                                  : 'bg-white/[0.02] hover:bg-white/[0.04] border border-transparent'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                selectedContacts.find(r => r.id === contact.id)
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-white/15'
                              }`}>
                                {selectedContacts.find(r => r.id === contact.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-white/70 truncate">{contact.name}</p>
                                <p className="text-[9px] text-white/30">{contact.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected contacts chips */}
              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedContacts.map(r => (
                    <motion.div
                      key={r.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <span className="text-[10px] font-medium text-green-400">{r.name}</span>
                      <button onClick={() => toggleContact({ id: r.id, name: r.name, phone: r.phone } as Contact)}>
                        <X className="w-2.5 h-2.5 text-green-400/50 hover:text-green-400" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {recipientMode === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {!waConnected ? (
                <div className="text-center py-4 text-xs text-white/30">
                  Connect WhatsApp to access your groups.
                </div>
              ) : loadingGroups ? (
                <div className="text-center py-4 text-xs text-white/40">
                  Loading WhatsApp groups...
                </div>
              ) : waGroups.length > 0 ? (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/20 transition-all"
                >
                  {waGroups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-[#14141f] text-white/80">
                      {group.name} ({group.members} members)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4 text-xs text-white/30">
                  No WhatsApp groups found.
                </div>
              )}
            </motion.div>
          )}

          {recipientMode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2"
            >
              <textarea
                value={manualPhones}
                onChange={(e) => setManualPhones(e.target.value)}
                placeholder="Enter phone numbers, one per line or comma-separated&#10;e.g. +1234567890, +0987654321"
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/20 transition-all resize-none"
              />
              <p className="text-[10px] text-white/25">
                {manualPhones.split(/[,\n]/).filter(p => p.trim().length > 0).length} numbers detected
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show selected count */}
        {!loading && getSelectedCount() > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-3 h-3 text-green-400/50" />
            <span className="text-[10px] text-white/40">
              {getSelectedCount().toLocaleString()} recipients will receive this message
            </span>
          </div>
        )}
      </motion.div>

      {/* Message Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-green-400/70" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Message</span>
          </div>
          {/* Character count & SMS segments */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-semibold ${charColor}`}>
              {charCount}
            </span>
            {smsSegments > 0 && (
              <span className="text-[9px] text-white/25">
                ({smsSegments} SMS)
              </span>
            )}
          </div>
        </div>

        {/* Template Variables */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <motion.button
              key={v.key}
              onClick={() => insertVariable(v.key)}
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/[0.06] border border-green-500/15 text-[10px] font-semibold text-green-400/70 hover:bg-green-500/10 hover:text-green-400 transition-all"
            >
              <span className="text-green-400/50 font-mono">{v.key}</span>
              <span className="text-white/25">{v.label}</span>
            </motion.button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here... Use {name} for personalization"
          rows={5}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/20 transition-all resize-none"
        />

        {/* Character count bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                charCount === 0 ? 'bg-white/10' :
                charCount <= 130 ? 'bg-green-500/50' :
                charCount <= SMS_LIMIT ? 'bg-amber-500/50' :
                'bg-red-500/50'
              }`}
              style={{ width: `${Math.min((charCount / SMS_LIMIT) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/20">
            <span>0</span>
            <span>{SMS_LIMIT}</span>
          </div>
        </div>
      </motion.div>

      {/* Media Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-green-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Media (Optional)</span>
        </div>

        {/* Media type buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'image' as const, label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, color: 'green' },
            { type: 'document' as const, label: 'Document', icon: <FileText className="w-3.5 h-3.5" />, color: 'blue' },
            { type: 'audio' as const, label: 'Audio', icon: <Mic className="w-3.5 h-3.5" />, color: 'purple' },
          ].map((item) => (
            <motion.button
              key={item.type}
              onClick={() => {
                setMediaType(item.type)
                // Create a hidden file input trigger
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = item.type === 'image' ? 'image/*' : item.type === 'audio' ? 'audio/*' : '*'
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  const file = target.files?.[0]
                  if (file) {
                    setMediaName(file.name)
                    if (item.type === 'image') {
                      const reader = new FileReader()
                      reader.onload = (ev) => setMediaPreview(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    } else {
                      setMediaPreview(null)
                    }
                  }
                }
                input.click()
              }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 border ${
                mediaType === item.type
                  ? `bg-${item.color}-500/15 border-${item.color}-500/30 text-${item.color}-400`
                  : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={mediaType === item.type ? {
                background: item.color === 'green' ? 'rgba(34,197,94,0.15)' : item.color === 'blue' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                borderColor: item.color === 'green' ? 'rgba(34,197,94,0.3)' : item.color === 'blue' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)',
                color: item.color === 'green' ? '#4ade80' : item.color === 'blue' ? '#60a5fa' : '#c084fc',
              } : undefined}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
        </div>

        {/* Current attachment display */}
        <AnimatePresence>
          {mediaType !== 'none' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {/* Image thumbnail */}
                {mediaType === 'image' && mediaPreview ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : mediaType === 'image' ? (
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 text-green-400/40" />
                  </div>
                ) : mediaType === 'document' ? (
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-400/40" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-purple-400/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{mediaName || `Attach ${mediaType}`}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">
                    {mediaType === 'image' ? 'Image' : mediaType === 'audio' ? 'Audio' : 'Document'} attached
                  </p>
                  {mediaType === 'audio' && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="w-0.5 rounded-full bg-purple-400/30" style={{ height: `${4 + Math.random() * 10}px` }} />
                      ))}
                    </div>
                  )}
                </div>
                <motion.button
                  onClick={removeAttachment}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-red-400/60" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload area when no attachment */}
        {mediaType === 'none' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-white/[0.06] border-dashed rounded-xl p-4 flex items-center gap-3 hover:border-green-500/20 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/[0.06] flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-400/40" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/50">Add image, audio, or document</p>
              <p className="text-[10px] text-white/20">Max 16MB</p>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,audio/*,.pdf,.doc,.docx,.txt" />
      </motion.div>

      {/* Message Preview - WhatsApp Phone Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-green-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Preview</span>
        </div>

        {/* Phone Mockup */}
        <div className="mx-auto w-[260px] rounded-3xl bg-[#0b141a] border border-white/[0.08] overflow-hidden shadow-xl" style={{ boxShadow: '0 0 30px rgba(0,0,0,0.4), 0 0 60px rgba(34,197,94,0.05)' }}>
          {/* Phone status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#1f2c34]">
            <span className="text-[8px] text-white/40">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-white/20" />
              <div className="w-3 h-2 rounded-sm bg-white/20" />
              <div className="w-4 h-2 rounded-sm bg-white/30" />
            </div>
          </div>
          {/* Chat header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1f2c34]">
            <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-green-400/60" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-white/80">John</p>
              <p className="text-[7px] text-white/30">online</p>
            </div>
          </div>
          {/* Chat body */}
          <div className="px-3 py-3 min-h-[120px] space-y-2" style={{ background: 'linear-gradient(180deg, #0b141a 0%, #0d1a22 100%)' }}>
            {/* Previous message (received) */}
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg rounded-tl-none px-2.5 py-1.5 bg-[#1f2c34]">
                <p className="text-[9px] text-white/70">Hi, I&apos;m interested in your services</p>
                <p className="text-[7px] text-white/25 text-right mt-0.5">9:40 AM</p>
              </div>
            </div>
            {/* Current message preview (sent) */}
            {(previewMessage || mediaType !== 'none') && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg rounded-tr-none px-2.5 py-1.5 bg-[#005c4b]">
                  {/* Image preview */}
                  {mediaType === 'image' && mediaPreview && (
                    <div className="mb-1 rounded overflow-hidden">
                      <img src={mediaPreview} alt="" className="w-full h-16 object-cover" />
                    </div>
                  )}
                  {mediaType === 'document' && (
                    <div className="mb-1 flex items-center gap-1 p-1 rounded bg-white/5">
                      <FileText className="w-3 h-3 text-white/40" />
                      <span className="text-[7px] text-white/40">{mediaName || 'Document'}</span>
                    </div>
                  )}
                  {mediaType === 'audio' && (
                    <div className="mb-1 flex items-center gap-1 p-1">
                      <Mic className="w-3 h-3 text-white/40" />
                      <div className="flex items-center gap-px">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="w-px bg-white/20 rounded-full" style={{ height: `${3 + Math.random() * 6}px` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {previewMessage && (
                    <p className="text-[9px] text-white/90 break-words">{previewMessage}</p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <p className="text-[7px] text-white/30">9:41 AM</p>
                    <CheckCheck className="w-2.5 h-2.5 text-blue-400/60" />
                  </div>
                </div>
              </div>
            )}
            {!previewMessage && mediaType === 'none' && (
              <div className="flex items-center justify-center h-20">
                <p className="text-[9px] text-white/15">Start typing to see preview...</p>
              </div>
            )}
          </div>
          {/* Input bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1f2c34]">
            <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5">
              <p className="text-[8px] text-white/20">Type a message</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center">
              <Send className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Schedule Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Schedule</span>
        </div>

        {/* Schedule mode selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'now' as ScheduleMode, label: 'Send Now', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'scheduled' as ScheduleMode, label: 'Schedule', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'recurring' as ScheduleMode, label: 'Repeat', icon: <Repeat className="w-3.5 h-3.5" /> },
          ].map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setScheduleMode(mode.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 border ${
                scheduleMode === mode.id
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={scheduleMode === mode.id ? { boxShadow: '0 0 15px rgba(34,197,94,0.15)' } : undefined}
            >
              {mode.icon}
              {mode.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {scheduleMode === 'scheduled' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 overflow-hidden"
            >
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-green-500/30 transition-all"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-green-500/30 transition-all"
              />
            </motion.div>
          )}
          {scheduleMode === 'recurring' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-green-500/30 transition-all"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-green-500/30 transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'daily' as RecurringType, label: 'Daily' },
                  { id: 'weekly' as RecurringType, label: 'Weekly' },
                  { id: 'monthly' as RecurringType, label: 'Monthly' },
                ].map((rt) => (
                  <motion.button
                    key={rt.id}
                    onClick={() => setRecurringType(rt.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-xl text-[10px] font-semibold transition-all border ${
                      recurringType === rt.id
                        ? 'bg-green-500/15 text-green-400 border-green-500/25'
                        : 'bg-white/[0.03] text-white/35 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {rt.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Send Button */}
      <motion.button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
          sent
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25'
            : sending
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              : message.trim()
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-green-500/25'
                : 'bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed'
        }`}
        style={!sent && !sending && message.trim() ? { boxShadow: '0 0 20px rgba(34,197,94,0.2), 0 0 40px rgba(34,197,94,0.1)' } : undefined}
      >
        {sent ? <><CheckCircle2 className="w-4 h-4" /> Campaign Queued!</>
         : sending ? <><AlertCircle className="w-4 h-4 animate-pulse" /> Sending...</>
         : scheduleMode === 'now' ? <><Send className="w-4 h-4" /> Send Campaign</>
         : <><Clock className="w-4 h-4" /> Schedule Campaign</>}
      </motion.button>
    </div>
  )
}

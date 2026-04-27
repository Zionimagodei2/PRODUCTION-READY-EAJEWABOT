'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type FeaturePage, type TabId } from '@/store/app-store'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  Search, Send, MessageSquare, Bot, Calendar, Users,
  BarChart3, FileText, FileCode, Sparkles, Radio,
  Link2, Settings, Database, Megaphone, ArrowRight,
  UserPlus, Clock, TrendingUp, Activity, Phone, Brain,
  ShieldCheck, Upload, QrCode, Timer, MessageCircle,
  GitBranch, Webhook
} from 'lucide-react'

interface SearchItem {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  category: 'Features' | 'Campaigns' | 'Contacts' | 'Settings'
  categoryColor: string
  action: () => void
}

// Static feature items (these are app features, not user data)
const featureItems: Omit<SearchItem, 'action'>[] = [
  { id: 'feat-inbox', icon: <MessageCircle className="w-4 h-4" />, title: 'Inbox', subtitle: 'All conversations', category: 'Features', categoryColor: '#22c55e' },
  { id: 'feat-send-message', icon: <Send className="w-4 h-4" />, title: 'Send Message', subtitle: 'Bulk campaigns & schedules', category: 'Features', categoryColor: '#3b82f6' },
  { id: 'feat-auto-reply', icon: <MessageSquare className="w-4 h-4" />, title: 'Auto Reply', subtitle: 'Smart responses', category: 'Features', categoryColor: '#3b82f6' },
  { id: 'feat-chatbot', icon: <Bot className="w-4 h-4" />, title: 'Chatbot', subtitle: 'AI-powered conversations', category: 'Features', categoryColor: '#8b5cf6' },
  { id: 'feat-scheduler', icon: <Calendar className="w-4 h-4" />, title: 'Scheduler', subtitle: 'Plan messages ahead', category: 'Features', categoryColor: '#8b5cf6' },
  { id: 'feat-group-extractor', icon: <Users className="w-4 h-4" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', category: 'Features', categoryColor: '#22c55e' },
  { id: 'feat-lead-scraper', icon: <Search className="w-4 h-4" />, title: 'Lead Scraper', subtitle: 'Find new prospects', category: 'Features', categoryColor: '#22c55e' },
  { id: 'feat-number-validator', icon: <ShieldCheck className="w-4 h-4" />, title: 'Number Validator', subtitle: 'Verify WhatsApp numbers', category: 'Features', categoryColor: '#22c55e' },
  { id: 'feat-number-generator', icon: <Phone className="w-4 h-4" />, title: 'Number Generator', subtitle: 'Bulk phone number generation', category: 'Features', categoryColor: '#8b5cf6' },
  { id: 'feat-link-generator', icon: <Link2 className="w-4 h-4" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', category: 'Features', categoryColor: '#f97316' },
  { id: 'feat-analytics', icon: <BarChart3 className="w-4 h-4" />, title: 'Analytics', subtitle: 'Track performance & metrics', category: 'Features', categoryColor: '#ec4899' },
  { id: 'feat-campaign-reports', icon: <FileText className="w-4 h-4" />, title: 'Campaign Reports', subtitle: 'Detailed delivery reports', category: 'Features', categoryColor: '#ef4444' },
  { id: 'feat-templates', icon: <FileCode className="w-4 h-4" />, title: 'Templates', subtitle: 'Reusable message templates', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-ai-chat', icon: <Sparkles className="w-4 h-4" />, title: 'AI Assistant', subtitle: 'Smart automation helper', category: 'Features', categoryColor: '#f59e0b' },
  { id: 'feat-personality-agent', icon: <Brain className="w-4 h-4" />, title: 'AI Twin', subtitle: 'Auto-reply in your style', category: 'Features', categoryColor: '#f97316' },
  { id: 'feat-broadcast-lists', icon: <Radio className="w-4 h-4" />, title: 'Broadcast Lists', subtitle: 'Targeted group messaging', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-data-export', icon: <Database className="w-4 h-4" />, title: 'Data Export', subtitle: 'Export your data in various formats', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-campaign-wizard', icon: <Sparkles className="w-4 h-4" />, title: 'Campaign Wizard', subtitle: 'Step-by-step campaign builder', category: 'Features', categoryColor: '#3b82f6' },
  { id: 'feat-contact-import', icon: <Upload className="w-4 h-4" />, title: 'Contact Import', subtitle: 'Import contacts from CSV', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-qr-code', icon: <QrCode className="w-4 h-4" />, title: 'QR Code', subtitle: 'Generate WhatsApp QR codes', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-response-time', icon: <Timer className="w-4 h-4" />, title: 'Response Time', subtitle: 'Track response performance', category: 'Features', categoryColor: '#8b5cf6' },
  { id: 'feat-flow-builder', icon: <GitBranch className="w-4 h-4" />, title: 'Flow Builder', subtitle: 'Design conversation flows', category: 'Features', categoryColor: '#06b6d4' },
  { id: 'feat-webhook-manager', icon: <Webhook className="w-4 h-4" />, title: 'Webhook Manager', subtitle: 'Manage API webhooks & events', category: 'Features', categoryColor: '#f97316' },
]

// Static settings items
const settingsItems: Omit<SearchItem, 'action'>[] = [
  { id: 'set-profile', icon: <Users className="w-4 h-4" />, title: 'Profile Settings', subtitle: 'Manage your account', category: 'Settings', categoryColor: '#64748b' },
  { id: 'set-notifications', icon: <Activity className="w-4 h-4" />, title: 'Notification Preferences', subtitle: 'Configure alerts', category: 'Settings', categoryColor: '#64748b' },
  { id: 'set-schedule', icon: <Clock className="w-4 h-4" />, title: 'Schedule Settings', subtitle: 'Time zone & defaults', category: 'Settings', categoryColor: '#64748b' },
  { id: 'set-billing', icon: <TrendingUp className="w-4 h-4" />, title: 'Billing & Plan', subtitle: 'Manage subscription', category: 'Settings', categoryColor: '#64748b' },
  { id: 'set-general', icon: <Settings className="w-4 h-4" />, title: 'General Settings', subtitle: 'App preferences', category: 'Settings', categoryColor: '#64748b' },
]

export function QuickSearchModal() {
  const { searchOpen, setSearchOpen, setActiveFeature, setActiveTab, setSelectedCampaignId, setSelectedContactId } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dynamicItems, setDynamicItems] = useState<Omit<SearchItem, 'action'>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Fetch real campaigns and contacts from API when modal opens
  useEffect(() => {
    if (!searchOpen) return
    
    async function fetchDynamicData() {
      const items: Omit<SearchItem, 'action'>[] = []
      
      try {
        const [campRes, contRes] = await Promise.all([
          fetch('/api/campaigns'),
          fetch('/api/contacts'),
        ])
        
        if (campRes.ok) {
          const campaigns = await campRes.json()
          for (const c of campaigns) {
            items.push({
              id: `camp-${c.id}`,
              icon: <Megaphone className="w-4 h-4" />,
              title: c.name,
              subtitle: `${c.sent} sent · ${c.status}`,
              category: 'Campaigns',
              categoryColor: '#3b82f6',
            })
          }
        }
        
        if (contRes.ok) {
          const contacts = await contRes.json()
          for (const c of contacts) {
            const tags = c.tags ? c.tags.split(',').filter(Boolean) : []
            const tagStr = tags.length > 0 ? ` · ${tags[0]}` : ''
            items.push({
              id: `cont-${c.id}`,
              icon: <UserPlus className="w-4 h-4" />,
              title: c.name,
              subtitle: `${c.phone}${tagStr}`,
              category: 'Contacts',
              categoryColor: '#22c55e',
            })
          }
        }
      } catch {
        // Failed to fetch dynamic data, keep static items only
      }
      
      setDynamicItems(items)
    }
    
    fetchDynamicData()
  }, [searchOpen])

  // Build full search item list
  const allSearchItems: Omit<SearchItem, 'action'>[] = [
    ...featureItems,
    ...dynamicItems,
    ...settingsItems,
  ]

  // Popular items shown when query is empty (features only, no user data)
  const popularItems = featureItems.slice(0, 6)

  const handleClose = useCallback(() => {
    setSearchOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [setSearchOpen])

  // Reset state when opening
  useEffect(() => {
    if (searchOpen) {
      queueMicrotask(() => {
        setQuery('')
        setSelectedIndex(0)
      })
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  // Prevent body scroll when open
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [searchOpen])

  // Get navigation action for a search item
  const getNavAction = useCallback((itemId: string): (() => void) => {
    const featureMap: Record<string, FeaturePage> = {
      'feat-inbox': 'inbox',
      'feat-send-message': 'send-message',
      'feat-auto-reply': 'auto-reply',
      'feat-chatbot': 'chatbot',
      'feat-scheduler': 'scheduler',
      'feat-group-extractor': 'group-extractor',
      'feat-lead-scraper': 'lead-scraper',
      'feat-number-validator': 'number-validator',
      'feat-number-generator': 'number-generator',
      'feat-link-generator': 'link-generator',
      'feat-analytics': 'analytics',
      'feat-campaign-reports': 'campaign-reports',
      'feat-templates': 'message-templates',
      'feat-ai-chat': 'ai-chat',
      'feat-personality-agent': 'personality-agent',
      'feat-broadcast-lists': 'broadcast-lists',
      'feat-data-export': 'data-export',
      'feat-campaign-wizard': 'campaign-wizard',
      'feat-contact-import': 'contact-import',
      'feat-qr-code': 'qr-code',
      'feat-response-time': 'response-time',
      'feat-flow-builder': 'flow-builder',
      'feat-webhook-manager': 'webhook-manager',
    }

    const tabMap: Record<string, TabId> = {
      'set-profile': 'settings',
      'set-notifications': 'settings',
      'set-schedule': 'settings',
      'set-billing': 'settings',
      'set-general': 'settings',
    }

    // Feature navigation
    if (featureMap[itemId]) {
      return () => setActiveFeature(featureMap[itemId])
    }

    // Settings navigation
    if (tabMap[itemId]) {
      return () => setActiveTab(tabMap[itemId])
    }

    // Campaign navigation (dynamic items with camp-{id})
    if (itemId.startsWith('camp-')) {
      const campaignId = itemId.replace('camp-', '')
      return () => {
        setSelectedCampaignId(campaignId)
        setActiveFeature('campaign-detail')
      }
    }

    // Contact navigation (dynamic items with cont-{id})
    if (itemId.startsWith('cont-')) {
      const contactId = itemId.replace('cont-', '')
      return () => {
        setSelectedContactId(contactId)
        setActiveFeature('contact-detail')
      }
    }

    return () => {}
  }, [setActiveFeature, setActiveTab, setSelectedCampaignId, setSelectedContactId])

  // Filter search results
  const filteredResults = query.trim()
    ? allSearchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : popularItems

  // Group results by category
  const groupedResults = filteredResults.reduce<Record<string, Omit<SearchItem, 'action'>[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const flatResults = filteredResults

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatResults[selectedIndex]
      if (item) {
        const action = getNavAction(item.id)
        action()
        handleClose()
      }
      return
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Reset selected index when query changes
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedIndex(0)
    })
  }, [query])

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl border border-white/10"
            style={{
              background: 'rgba(12, 12, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 60px rgba(59,130,246,0.08), 0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search features, campaigns, contacts, settings..."
                className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none font-medium"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/40 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto no-scrollbar p-2">
              {flatResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-8 h-8 text-white/15 mb-3" />
                  <p className="text-sm text-white/40 font-medium">No results found</p>
                  <p className="text-xs text-white/25 mt-1">Try a different search term</p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {category}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="text-[10px] text-white/20 font-medium">{items.length}</span>
                    </div>
                    {items.map((item) => {
                      const globalIndex = flatResults.indexOf(item)
                      const isSelected = globalIndex === selectedIndex
                      const navAction = getNavAction(item.id)

                      return (
                        <motion.button
                          key={item.id}
                          data-index={globalIndex}
                          onClick={() => {
                            navAction()
                            handleClose()
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-white/[0.08]'
                              : 'hover:bg-white/[0.04]'
                          }`}
                          style={
                            isSelected
                              ? {
                                  boxShadow: `0 0 20px ${item.categoryColor}10`,
                                  borderLeft: `2px solid ${item.categoryColor}50`,
                                }
                              : undefined
                          }
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${item.categoryColor}12`,
                              border: `1px solid ${item.categoryColor}20`,
                            }}
                          >
                            <div style={{ color: item.categoryColor }}>{item.icon}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-semibold truncate ${isSelected ? 'text-white/95' : 'text-white/75'}`}>
                              {item.title}
                            </p>
                            <p className="text-[10px] text-white/35 truncate mt-0.5">{item.subtitle}</p>
                          </div>
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex-shrink-0"
                            style={{
                              backgroundColor: `${item.categoryColor}15`,
                              color: `${item.categoryColor}`,
                              border: `1px solid ${item.categoryColor}20`,
                            }}
                          >
                            {category === 'Features' ? 'Feature' : category === 'Campaigns' ? 'Campaign' : category === 'Contacts' ? 'Contact' : 'Setting'}
                          </span>
                          {isSelected && (
                            <ArrowRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-white/25">
                  <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/25">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1 text-[10px] text-white/25">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono">esc</kbd>
                  Close
                </span>
              </div>
              <span className="text-[10px] text-white/15 font-medium">EAJE Search</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

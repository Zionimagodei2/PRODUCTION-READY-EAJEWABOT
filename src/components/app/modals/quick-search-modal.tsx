'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, type FeaturePage, type TabId } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Send, MessageSquare, Bot, Calendar, Users,
  BarChart3, FileText, FileCode, Sparkles, Radio,
  Link2, Settings, Database, Megaphone, ArrowRight,
  UserPlus, Clock, TrendingUp, Activity, Phone, Brain
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

const popularItems: SearchItem[] = [
  {
    id: 'pop-send-message',
    icon: <Send className="w-4 h-4" />,
    title: 'Send Message',
    subtitle: 'Bulk campaigns & schedules',
    category: 'Features',
    categoryColor: '#3b82f6',
    action: () => {},
  },
  {
    id: 'pop-auto-reply',
    icon: <MessageSquare className="w-4 h-4" />,
    title: 'Auto Reply',
    subtitle: 'Smart responses',
    category: 'Features',
    categoryColor: '#3b82f6',
    action: () => {},
  },
  {
    id: 'pop-ai-chat',
    icon: <Sparkles className="w-4 h-4" />,
    title: 'AI Assistant',
    subtitle: 'Smart automation helper',
    category: 'Features',
    categoryColor: '#f59e0b',
    action: () => {},
  },
  {
    id: 'pop-campaign-reports',
    icon: <FileText className="w-4 h-4" />,
    title: 'Campaign Reports',
    subtitle: 'Detailed delivery reports',
    category: 'Features',
    categoryColor: '#ef4444',
    action: () => {},
  },
  {
    id: 'pop-analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    title: 'Analytics',
    subtitle: 'Track performance & metrics',
    category: 'Features',
    categoryColor: '#ec4899',
    action: () => {},
  },
  {
    id: 'pop-data-export',
    icon: <Database className="w-4 h-4" />,
    title: 'Data Export',
    subtitle: 'Export your data in various formats',
    category: 'Features',
    categoryColor: '#06b6d4',
    action: () => {},
  },
]

const allSearchItems: SearchItem[] = [
  // Features
  { id: 'feat-send-message', icon: <Send className="w-4 h-4" />, title: 'Send Message', subtitle: 'Bulk campaigns & schedules', category: 'Features', categoryColor: '#3b82f6', action: () => {} },
  { id: 'feat-auto-reply', icon: <MessageSquare className="w-4 h-4" />, title: 'Auto Reply', subtitle: 'Smart responses', category: 'Features', categoryColor: '#3b82f6', action: () => {} },
  { id: 'feat-chatbot', icon: <Bot className="w-4 h-4" />, title: 'Chatbot', subtitle: 'AI-powered conversations', category: 'Features', categoryColor: '#8b5cf6', action: () => {} },
  { id: 'feat-scheduler', icon: <Calendar className="w-4 h-4" />, title: 'Scheduler', subtitle: 'Plan messages ahead', category: 'Features', categoryColor: '#8b5cf6', action: () => {} },
  { id: 'feat-group-extractor', icon: <Users className="w-4 h-4" />, title: 'Group Extractor', subtitle: 'Extract contacts from groups', category: 'Features', categoryColor: '#22c55e', action: () => {} },
  { id: 'feat-lead-scraper', icon: <Search className="w-4 h-4" />, title: 'Lead Scraper', subtitle: 'Find new prospects', category: 'Features', categoryColor: '#22c55e', action: () => {} },
  { id: 'feat-link-generator', icon: <Link2 className="w-4 h-4" />, title: 'Link Generator', subtitle: 'Create WhatsApp links', category: 'Features', categoryColor: '#f97316', action: () => {} },
  { id: 'feat-analytics', icon: <BarChart3 className="w-4 h-4" />, title: 'Analytics', subtitle: 'Track performance & metrics', category: 'Features', categoryColor: '#ec4899', action: () => {} },
  { id: 'feat-campaign-reports', icon: <FileText className="w-4 h-4" />, title: 'Campaign Reports', subtitle: 'Detailed delivery reports', category: 'Features', categoryColor: '#ef4444', action: () => {} },
  { id: 'feat-templates', icon: <FileCode className="w-4 h-4" />, title: 'Templates', subtitle: 'Reusable message templates', category: 'Features', categoryColor: '#06b6d4', action: () => {} },
  { id: 'feat-ai-chat', icon: <Sparkles className="w-4 h-4" />, title: 'AI Assistant', subtitle: 'Smart automation helper', category: 'Features', categoryColor: '#f59e0b', action: () => {} },
  { id: 'feat-personality-agent', icon: <Brain className="w-4 h-4" />, title: 'AI Twin', subtitle: 'Auto-reply in your style', category: 'Features', categoryColor: '#f97316', action: () => {} },
  { id: 'feat-broadcast-lists', icon: <Radio className="w-4 h-4" />, title: 'Broadcast Lists', subtitle: 'Targeted group messaging', category: 'Features', categoryColor: '#06b6d4', action: () => {} },
  { id: 'feat-data-export', icon: <Database className="w-4 h-4" />, title: 'Data Export', subtitle: 'Export your data in various formats', category: 'Features', categoryColor: '#06b6d4', action: () => {} },
  // Campaigns
  { id: 'camp-product-launch', icon: <Megaphone className="w-4 h-4" />, title: 'Product Launch Promo', subtitle: '452 sent · 89% delivery rate', category: 'Campaigns', categoryColor: '#3b82f6', action: () => {} },
  { id: 'camp-flash-sale', icon: <Megaphone className="w-4 h-4" />, title: 'Flash Sale Alert', subtitle: '1,247 sent · 92% delivery rate', category: 'Campaigns', categoryColor: '#3b82f6', action: () => {} },
  { id: 'camp-welcome-series', icon: <Megaphone className="w-4 h-4" />, title: 'Welcome Series', subtitle: '312 sent · 95% delivery rate', category: 'Campaigns', categoryColor: '#3b82f6', action: () => {} },
  { id: 'camp-monthly-digest', icon: <Megaphone className="w-4 h-4" />, title: 'Monthly Digest', subtitle: '856 sent · 87% delivery rate', category: 'Campaigns', categoryColor: '#3b82f6', action: () => {} },
  // Contacts
  { id: 'cont-john', icon: <UserPlus className="w-4 h-4" />, title: 'John Doe', subtitle: '+1 234 567 890 · VIP Customer', category: 'Contacts', categoryColor: '#22c55e', action: () => {} },
  { id: 'cont-sarah', icon: <UserPlus className="w-4 h-4" />, title: 'Sarah Miller', subtitle: '+44 7911 123456 · Active Lead', category: 'Contacts', categoryColor: '#22c55e', action: () => {} },
  { id: 'cont-mike', icon: <UserPlus className="w-4 h-4" />, title: 'Mike Johnson', subtitle: '+1 555 123 4567 · New Contact', category: 'Contacts', categoryColor: '#22c55e', action: () => {} },
  { id: 'cont-emma', icon: <Phone className="w-4 h-4" />, title: 'Emma Wilson', subtitle: '+61 412 345 678 · Prospect', category: 'Contacts', categoryColor: '#22c55e', action: () => {} },
  // Settings
  { id: 'set-profile', icon: <Users className="w-4 h-4" />, title: 'Profile Settings', subtitle: 'Manage your account', category: 'Settings', categoryColor: '#64748b', action: () => {} },
  { id: 'set-notifications', icon: <Activity className="w-4 h-4" />, title: 'Notification Preferences', subtitle: 'Configure alerts', category: 'Settings', categoryColor: '#64748b', action: () => {} },
  { id: 'set-schedule', icon: <Clock className="w-4 h-4" />, title: 'Schedule Settings', subtitle: 'Time zone & defaults', category: 'Settings', categoryColor: '#64748b', action: () => {} },
  { id: 'set-billing', icon: <TrendingUp className="w-4 h-4" />, title: 'Billing & Plan', subtitle: 'Manage subscription', category: 'Settings', categoryColor: '#64748b', action: () => {} },
  { id: 'set-general', icon: <Settings className="w-4 h-4" />, title: 'General Settings', subtitle: 'App preferences', category: 'Settings', categoryColor: '#64748b', action: () => {} },
]

export function QuickSearchModal() {
  const { searchOpen, setSearchOpen, setActiveFeature, setActiveTab } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Close on Escape
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
      // Auto-focus with a small delay for animation
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
  const getNavAction = useCallback((item: SearchItem): (() => void) => {
    const featureMap: Record<string, FeaturePage> = {
      'feat-send-message': 'send-message',
      'feat-auto-reply': 'auto-reply',
      'feat-chatbot': 'chatbot',
      'feat-scheduler': 'scheduler',
      'feat-group-extractor': 'group-extractor',
      'feat-lead-scraper': 'lead-scraper',
      'feat-link-generator': 'link-generator',
      'feat-analytics': 'analytics',
      'feat-campaign-reports': 'campaign-reports',
      'feat-templates': 'message-templates',
      'feat-ai-chat': 'ai-chat',
      'feat-personality-agent': 'personality-agent',
      'feat-broadcast-lists': 'broadcast-lists',
      'feat-data-export': 'data-export',
    }

    const tabMap: Record<string, TabId> = {
      'set-profile': 'settings',
      'set-notifications': 'settings',
      'set-schedule': 'settings',
      'set-billing': 'settings',
      'set-general': 'settings',
    }

    const campaignMap: Record<string, { feature: FeaturePage; id: string }> = {
      'camp-product-launch': { feature: 'campaign-detail', id: '1' },
      'camp-flash-sale': { feature: 'campaign-detail', id: '2' },
      'camp-welcome-series': { feature: 'campaign-detail', id: '3' },
      'camp-monthly-digest': { feature: 'campaign-detail', id: '4' },
    }

    if (featureMap[item.id]) {
      return () => setActiveFeature(featureMap[item.id])
    }
    if (tabMap[item.id]) {
      return () => setActiveTab(tabMap[item.id])
    }
    if (campaignMap[item.id]) {
      return () => {
        const { feature } = campaignMap[item.id]
        setActiveFeature(feature)
      }
    }
    // For contact items and popular items, try to resolve
    if (item.id.startsWith('cont-')) {
      return () => setActiveFeature('contact-detail')
    }
    if (item.id.startsWith('pop-')) {
      const popToFeature: Record<string, FeaturePage> = {
        'pop-send-message': 'send-message',
        'pop-auto-reply': 'auto-reply',
        'pop-ai-chat': 'ai-chat',
        'pop-campaign-reports': 'campaign-reports',
        'pop-analytics': 'analytics',
        'pop-data-export': 'data-export',
      }
      if (popToFeature[item.id]) {
        return () => setActiveFeature(popToFeature[item.id])
      }
    }
    return () => {}
  }, [setActiveFeature, setActiveTab])

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
  const groupedResults = filteredResults.reduce<Record<string, SearchItem[]>>((acc, item) => {
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
        const action = getNavAction(item)
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
                      const navAction = getNavAction(item)

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

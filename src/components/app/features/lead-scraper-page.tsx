'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ArrowLeft, MapPin, Building2, Phone, Star, Download, Plus,
  CheckCircle2, AlertCircle, Globe, ExternalLink, Zap, BarChart3,
  Shield, Eye, EyeOff, Save, MessageSquare, Users, Link2, Clock,
  ChevronDown, ChevronUp, Send, RotateCw, Hash
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

interface LeadResult {
  business: string
  phone: string
  category: string
  rating: number
  address: string
  description: string
  source: string
  sourceName: string
  whatsappLink?: string
  hasWhatsApp?: boolean
}

interface RecentSearch {
  id: string
  keyword: string
  location: string
  resultCount: number
  phoneCount: number
  whatsappCount: number
  mode: string
  deepScan: boolean
  sourceBreakdown: Record<string, number>
  createdAt: string
}

type ScrapeStage = 'idle' | 'searching' | 'scraping' | 'extracting' | 'saving' | 'done'

const STAGE_INFO: Record<ScrapeStage, { label: string; icon: React.ReactNode; color: string }> = {
  idle: { label: 'Ready', icon: <Search className="w-3.5 h-3.5" />, color: 'text-white/40' },
  searching: { label: 'Searching web...', icon: <Globe className="w-3.5 h-3.5 animate-pulse" />, color: 'text-blue-400' },
  scraping: { label: 'Scraping pages...', icon: <Eye className="w-3.5 h-3.5 animate-pulse" />, color: 'text-amber-400' },
  extracting: { label: 'Extracting phones...', icon: <Phone className="w-3.5 h-3.5 animate-pulse" />, color: 'text-neon-green' },
  saving: { label: 'Saving results...', icon: <Save className="w-3.5 h-3.5 animate-pulse" />, color: 'text-purple-400' },
  done: { label: 'Complete', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-green-400' },
}

// Source badge colors based on domain
function getSourceBadge(sourceName: string): { label: string; color: string; bg: string } {
  const domain = sourceName.toLowerCase()
  if (domain.includes('google')) return { label: 'Google', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
  if (domain.includes('yelp')) return { label: 'Yelp', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  if (domain.includes('facebook') || domain.includes('fb.')) return { label: 'Facebook', color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' }
  if (domain.includes('instagram')) return { label: 'Instagram', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' }
  if (domain.includes('linkedin')) return { label: 'LinkedIn', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' }
  if (domain.includes('tripadvisor')) return { label: 'TripAdvisor', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
  if (domain.includes('yellowpages') || domain.includes('yp.')) return { label: 'YellowPages', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
  if (domain.includes('bbb')) return { label: 'BBB', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' }
  if (domain.includes('foursquare')) return { label: 'Foursquare', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  if (domain.includes('zomato')) return { label: 'Zomato', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/20' }
  const shortName = sourceName.split('.')[0].charAt(0).toUpperCase() + sourceName.split('.')[0].slice(1)
  return { label: shortName, color: 'text-white/50', bg: 'bg-white/5 border-white/10' }
}

function getSourceBadgeByKey(key: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    google: { label: 'Google', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    yelp: { label: 'Yelp', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    yellowpages: { label: 'YellowPages', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    tripadvisor: { label: 'TripAdvisor', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    facebook: { label: 'Facebook', color: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/20' },
  }
  return map[key] || { label: key, color: 'text-white/50', bg: 'bg-white/5 border-white/10' }
}

export function LeadScraperPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  const [scraping, setScraping] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [deepScan, setDeepScan] = useState(true)
  const [stealthMode, setStealthMode] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [results, setResults] = useState<LeadResult[]>([])
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sourceCount, setSourceCount] = useState(0)
  const [stage, setStage] = useState<ScrapeStage>('idle')
  const [whatsappLinks, setWhatsappLinks] = useState<string[]>([])
  const [groupLinks, setGroupLinks] = useState<string[]>([])
  const [phoneCount, setPhoneCount] = useState(0)
  const [whatsappCount, setWhatsappCount] = useState(0)
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({})
  const [autoSavedCount, setAutoSavedCount] = useState(0)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [showRecent, setShowRecent] = useState(true)
  const [showWALinks, setShowWALinks] = useState(false)

  // Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await fetch('/api/leads')
        if (res.ok) {
          const data = await res.json()
          setRecentSearches(data.searches || [])
        }
      } catch {
        // Failed to load recent searches
      }
    }
    loadRecent()
  }, [])

  const startScrape = useCallback(async () => {
    if (!keyword.trim()) return
    setScraping(true)
    setResults([])
    setError(null)
    setSourceCount(0)
    setWhatsappLinks([])
    setGroupLinks([])
    setPhoneCount(0)
    setWhatsappCount(0)
    setAutoSavedCount(0)
    setSourceBreakdown({})
    setShowRecent(false)

    // Progress stages
    setStage('searching')
    const stageTimer = setInterval(() => {
      setStage(prev => {
        if (prev === 'searching') return 'scraping'
        if (prev === 'scraping') return 'extracting'
        return prev
      })
    }, 3000)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim(),
          deepScan,
          stealthMode,
          autoSave,
        }),
      })

      clearInterval(stageTimer)

      if (res.ok) {
        setStage('saving')
        const data = await res.json()
        setResults(data.leads || [])
        setSourceCount(data.sources || 0)
        setWhatsappLinks(data.whatsappLinks || [])
        setGroupLinks(data.groupLinks || [])
        setPhoneCount(data.phoneCount || 0)
        setWhatsappCount(data.whatsappCount || 0)
        setSourceBreakdown(data.sourceBreakdown || {})
        setAutoSavedCount(data.autoSavedCount || 0)
        setStage('done')

        if (data.leads?.length > 0) {
          const msg = autoSave && data.autoSavedCount > 0
            ? `Found ${data.leads.length} leads • ${data.autoSavedCount} auto-saved to contacts`
            : `Found ${data.leads.length} leads from ${data.sources || 0} sources`
          addToast({ type: 'success', title: msg })
        } else {
          setError('No leads found. Try a different keyword or location.')
        }

        // Refresh recent searches
        try {
          const recentRes = await fetch('/api/leads')
          if (recentRes.ok) {
            const recentData = await recentRes.json()
            setRecentSearches(recentData.searches || [])
          }
        } catch {
          // Failed to refresh recent searches
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to search leads. Please try again.')
        setStage('idle')
        addToast({ type: 'error', title: 'Lead search failed' })
      }
    } catch {
      clearInterval(stageTimer)
      setError('Network error. Please check your connection and try again.')
      setStage('idle')
      addToast({ type: 'error', title: 'Network error' })
    } finally {
      setScraping(false)
    }
  }, [keyword, location, deepScan, stealthMode, autoSave, addToast])

  const toggleSave = (business: string) => {
    setSavedLeads(prev => {
      const next = new Set(prev)
      if (next.has(business)) next.delete(business)
      else next.add(business)
      return next
    })
  }

  const saveAllToContacts = async () => {
    const leadsWithPhone = results.filter(r => r.phone)
    if (leadsWithPhone.length === 0) return

    let saved = 0
    for (const lead of leadsWithPhone) {
      try {
        await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lead.business,
            phone: lead.phone,
            company: lead.business,
            location: lead.address || location,
            tags: `${keyword},lead-scraper`,
            status: 'active',
          }),
        })
        saved++
      } catch {
        // Failed to save individual contact
      }
    }
    addToast({ type: 'success', title: `Saved ${saved} contacts` })
    setSavedLeads(new Set(leadsWithPhone.map(l => l.business)))
  }

  const exportAllWithPhones = () => {
    const leadsWithPhone = results.filter(r => r.phone)
    if (leadsWithPhone.length === 0) return
    const headers = 'Business,Phone,Category,Rating,Address,HasWhatsApp,WhatsAppLink,Source,SourceName\n'
    const rows = leadsWithPhone.map(l =>
      `"${l.business}","${l.phone}","${l.category}",${l.rating},"${l.address}",${l.hasWhatsApp ? 'Yes' : 'No'},"${l.whatsappLink || ''}","${l.source}","${l.sourceName}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-phones-${keyword}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: `Exported ${leadsWithPhone.length} leads with phones` })
  }

  const exportLeads = () => {
    const leads = results.filter(r => savedLeads.has(r.business))
    if (leads.length === 0) return
    const headers = 'Business,Phone,Category,Rating,Address,HasWhatsApp,WhatsAppLink,Source,SourceName\n'
    const rows = leads.map(l =>
      `"${l.business}","${l.phone}","${l.category}",${l.rating},"${l.address}",${l.hasWhatsApp ? 'Yes' : 'No'},"${l.whatsappLink || ''}","${l.source}","${l.sourceName}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${keyword}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: `Exported ${leads.length} leads` })
  }

  const exportAllLeads = () => {
    if (results.length === 0) return
    const headers = 'Business,Phone,Category,Rating,Address,HasWhatsApp,WhatsAppLink,Source,SourceName\n'
    const rows = results.map(l =>
      `"${l.business}","${l.phone}","${l.category}",${l.rating},"${l.address}",${l.hasWhatsApp ? 'Yes' : 'No'},"${l.whatsappLink || ''}","${l.source}","${l.sourceName}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${keyword}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: `Exported ${results.length} leads` })
  }

  const loadSearch = (search: RecentSearch) => {
    setKeyword(search.keyword)
    setLocation(search.location)
    setShowRecent(false)
  }

  const speedLabel = stealthMode ? 'Stealth' : deepScan ? 'Normal' : 'Fast'
  const speedColor = stealthMode ? 'text-amber-400' : deepScan ? 'text-blue-400' : 'text-green-400'
  const speedBg = stealthMode ? 'bg-amber-500/10 border-amber-500/20' : deepScan ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white/90">Lead Scraper</h2>
          <p className="text-[10px] text-white/40">Multi-source • Stealth • Real data</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${speedBg}`}>
            <Zap className={`w-3 h-3 ${speedColor}`} />
            <span className={`text-[9px] font-medium ${speedColor}`}>{speedLabel}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
            <Globe className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-medium text-green-400">Live</span>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
            <Search className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Search Leads</h3>
            <p className="text-[10px] text-white/40">Search Google, Yelp, YellowPages & more</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Business Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') startScrape() }}
                placeholder="e.g. Restaurant, Gym, Salon..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Location</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') startScrape() }}
                placeholder="City or area..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
              />
            </div>
          </div>

          {/* Toggles Row */}
          <div className="space-y-2">
            {/* Deep Scan Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <div>
                  <p className="text-[11px] font-medium text-white/70">Deep Scan</p>
                  <p className="text-[9px] text-white/30">Scrape pages for phones & addresses</p>
                </div>
              </div>
              <button
                onClick={() => setDeepScan(!deepScan)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                  deepScan ? 'bg-blue-500/30 border border-blue-500/40' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                  deepScan ? 'left-5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'left-0.5 bg-white/30'
                }`} />
              </button>
            </div>

            {/* Stealth Mode Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <p className="text-[11px] font-medium text-white/70">Stealth Mode</p>
                  <p className="text-[9px] text-white/30">Random delays, slower but safer</p>
                </div>
              </div>
              <button
                onClick={() => setStealthMode(!stealthMode)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                  stealthMode ? 'bg-amber-500/30 border border-amber-500/40' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                  stealthMode ? 'left-5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'left-0.5 bg-white/30'
                }`} />
              </button>
            </div>

            {/* Auto-Save Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <p className="text-[11px] font-medium text-white/70">Auto-Save</p>
                  <p className="text-[9px] text-white/30">Save leads with phones to contacts</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                  autoSave ? 'bg-purple-500/30 border border-purple-500/40' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                  autoSave ? 'left-5 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'left-0.5 bg-white/30'
                }`} />
              </button>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={startScrape}
            disabled={scraping || !keyword}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              scraping
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : keyword
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/25 hover:bg-neon-green/25'
                  : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
            }`}
          >
            {scraping ? (
              <>
                <Search className="w-4 h-4 animate-pulse" />
                {STAGE_INFO[stage].label}
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" /> Find Real Leads
              </>
            )}
          </button>

          {/* Progress Stages */}
          {scraping && (
            <div className="flex items-center gap-1.5">
              {(['searching', 'scraping', 'extracting', 'saving'] as ScrapeStage[]).map((s, i) => {
                const stageOrder = ['searching', 'scraping', 'extracting', 'saving']
                const currentIdx = stageOrder.indexOf(stage)
                const isActive = stage === s
                const isDone = currentIdx > i
                return (
                  <div key={s} className="flex items-center gap-1.5 flex-1">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all ${
                      isActive
                        ? `${STAGE_INFO[s].color} bg-white/5 border-white/10`
                        : isDone
                          ? 'text-green-400 bg-green-500/5 border-green-500/10'
                          : 'text-white/20 bg-white/[0.02] border-white/5'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : STAGE_INFO[s].icon}
                      <span className="text-[8px] font-medium">{STAGE_INFO[s].label.replace('...', '')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-red-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Search Error</p>
              <p className="text-xs text-white/40 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Searches */}
      <AnimatePresence>
        {showRecent && recentSearches.length > 0 && !scraping && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center gap-2 w-full"
            >
              <Clock className="w-3 h-3 text-white/30" />
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Recent Searches</span>
              {showRecent ? <ChevronUp className="w-3 h-3 text-white/20 ml-auto" /> : <ChevronDown className="w-3 h-3 text-white/20 ml-auto" />}
            </button>
            <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
              {recentSearches.slice(0, 5).map((search) => (
                <button
                  key={search.id}
                  onClick={() => loadSearch(search)}
                  className="glass-card rounded-lg p-2.5 flex items-center gap-3 w-full hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center bg-white/5 flex-shrink-0">
                    <Search className="w-3 h-3 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/70 truncate">{search.keyword}{search.location ? ` in ${search.location}` : ''}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-white/30">{search.resultCount} leads</span>
                      {search.phoneCount > 0 && <span className="text-[8px] text-neon-green/60">{search.phoneCount} phones</span>}
                      <span className="text-[8px] text-white/20">{new Date(search.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded border ${
                    search.mode === 'stealth' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400' :
                    search.deepScan ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' :
                    'bg-white/5 border-white/10 text-white/30'
                  }`}>
                    {search.mode}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white/70">
                {results.length} leads found
              </h4>
              {sourceCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15">
                  from {sourceCount} sources
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${speedBg} ${speedColor}`}>
                {speedLabel}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-card rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-white/90">{phoneCount}</p>
              <p className="text-[8px] text-white/30 flex items-center justify-center gap-1">
                <Phone className="w-2.5 h-2.5" /> with phone
              </p>
            </div>
            <div className="glass-card rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-neon-green">{whatsappCount}</p>
              <p className="text-[8px] text-white/30 flex items-center justify-center gap-1">
                <MessageSquare className="w-2.5 h-2.5" /> with WhatsApp
              </p>
            </div>
            <div className="glass-card rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-purple-400">{autoSavedCount}</p>
              <p className="text-[8px] text-white/30 flex items-center justify-center gap-1">
                <Save className="w-2.5 h-2.5" /> auto-saved
              </p>
            </div>
          </div>

          {/* Source Breakdown Chart */}
          {Object.keys(sourceBreakdown).length > 0 && (
            <div className="glass-card rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="w-3 h-3 text-white/30" />
                <span className="text-[10px] font-semibold text-white/40">Source Breakdown</span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(sourceBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => {
                    const total = Object.values(sourceBreakdown).reduce((a, b) => a + b, 0)
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    const badge = getSourceBadgeByKey(source)
                    return (
                      <div key={source} className="flex items-center gap-2">
                        <span className={`text-[9px] font-medium ${badge.color} w-20 truncate`}>{badge.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-neon-green/60 to-neon-cyan/60"
                          />
                        </div>
                        <span className="text-[8px] text-white/30 w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <button
              onClick={saveAllToContacts}
              disabled={results.filter(r => r.phone).length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Users className="w-3 h-3" /> Save All to Contacts
            </button>
            <button
              onClick={exportAllWithPhones}
              disabled={results.filter(r => r.phone).length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon-green/10 text-neon-green border border-neon-green/20 text-[10px] font-medium hover:bg-neon-green/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" /> Export with Phones
            </button>
            <button
              onClick={exportAllLeads}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-white/5 text-white/40 border border-white/5 text-[10px] hover:bg-white/10 transition-colors"
            >
              <Download className="w-3 h-3" /> All
            </button>
            {savedLeads.size > 0 && (
              <button
                onClick={exportLeads}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[10px] font-medium hover:bg-neon-blue/20 transition-colors"
              >
                <Download className="w-3 h-3" /> Saved ({savedLeads.size})
              </button>
            )}
          </div>

          {/* WhatsApp Links Discovery */}
          {(whatsappLinks.length > 0 || groupLinks.length > 0) && (
            <div className="glass-card rounded-xl p-3 border border-green-500/10">
              <button
                onClick={() => setShowWALinks(!showWALinks)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[11px] font-semibold text-white/70">WhatsApp Discovery</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15">
                    {whatsappLinks.length + groupLinks.length} links
                  </span>
                </div>
                {showWALinks ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
              </button>

              <AnimatePresence>
                {showWALinks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                      {whatsappLinks.map((link, i) => (
                        <div key={`wa-${i}`} className="flex items-center gap-2 p-1.5 rounded-md bg-white/[0.02]">
                          <Phone className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-400/80 font-mono truncate hover:text-green-300 transition-colors">
                            {link}
                          </a>
                          <ExternalLink className="w-2 h-2 text-white/20 flex-shrink-0" />
                        </div>
                      ))}
                      {groupLinks.map((link, i) => (
                        <div key={`grp-${i}`} className="flex items-center gap-2 p-1.5 rounded-md bg-white/[0.02]">
                          <Users className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-purple-400/80 font-mono truncate hover:text-purple-300 transition-colors">
                            {link}
                          </a>
                          <span className="text-[7px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10 flex-shrink-0">Group</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Source Attribution Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from(new Set(results.map(r => r.sourceName))).slice(0, 8).map((source) => {
              const badge = getSourceBadge(source)
              const count = results.filter(r => r.sourceName === source).length
              return (
                <span key={source} className={`text-[9px] px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color} font-medium`}>
                  {badge.label} ({count})
                </span>
              )
            })}
          </div>

          {/* Results List */}
          <div className="max-h-[32rem] overflow-y-auto no-scrollbar space-y-2">
            {results.map((r, i) => {
              const badge = getSourceBadge(r.sourceName)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.5) }}
                  className="glass-card rounded-lg p-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Business Name + Source Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-white/80 truncate">{r.business}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color} flex-shrink-0`}>
                          {badge.label}
                        </span>
                        {r.rating > 0 && (
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            <span className="text-[9px] text-amber-400">{r.rating}</span>
                          </div>
                        )}
                      </div>

                      {/* Phone with WhatsApp indicator */}
                      {r.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-2.5 h-2.5 text-neon-green/60" />
                          <a
                            href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}
                            className="text-[10px] text-neon-green/80 font-mono hover:text-neon-green transition-colors"
                          >
                            {r.phone}
                          </a>
                          {r.hasWhatsApp && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15 flex items-center gap-0.5">
                              <MessageSquare className="w-2 h-2" /> WhatsApp
                            </span>
                          )}
                          <a
                            href={`https://wa.me/${r.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15 text-[8px] font-medium hover:bg-green-500/15 transition-colors"
                          >
                            <MessageSquare className="w-2 h-2" /> Chat
                          </a>
                          <a
                            href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 text-[8px] font-medium hover:bg-blue-500/15 transition-colors"
                          >
                            <Phone className="w-2 h-2" /> Call
                          </a>
                        </div>
                      )}

                      {/* WhatsApp direct link */}
                      {r.whatsappLink && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Link2 className="w-2.5 h-2.5 text-green-400/60" />
                          <a href={r.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-400/70 font-mono hover:text-green-300 transition-colors truncate">
                            {r.whatsappLink}
                          </a>
                        </div>
                      )}

                      {/* Category + Address */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/15">{r.category}</span>
                        {r.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-white/20 flex items-center gap-0.5 hover:text-white/40 transition-colors"
                          >
                            <MapPin className="w-2 h-2" /> {r.address}
                          </a>
                        )}
                      </div>

                      {/* Description */}
                      {r.description && (
                        <p className="text-[9px] text-white/25 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                      )}

                      {/* Source Link */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="w-2.5 h-2.5 text-white/15" />
                        <a href={r.source} target="_blank" rel="noopener noreferrer" className="text-[9px] text-white/20 hover:text-white/40 transition-colors truncate flex items-center gap-1">
                          {r.sourceName}
                          <ExternalLink className="w-2 h-2 flex-shrink-0" />
                        </a>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => toggleSave(r.business)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border flex-shrink-0 ml-2 ${
                        savedLeads.has(r.business)
                          ? 'bg-neon-green/15 border-neon-green/25 text-neon-green'
                          : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10 hover:text-white/40'
                      }`}
                    >
                      {savedLeads.has(r.business) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom Stats */}
          <div className="glass-card rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/30">{phoneCount} with phone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-green-400/50" />
                <span className="text-[9px] text-white/30">{whatsappCount} with WhatsApp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/30">{results.filter(r => r.address).length} with address</span>
              </div>
            </div>
            <span className="text-[8px] text-white/15">{deepScan ? 'Deep Scan' : 'Quick Search'}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, MapPin, Building2, Phone, Star, Download, Plus, CheckCircle2, AlertCircle, Globe, ExternalLink, Zap, BarChart3 } from 'lucide-react'
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
  // Default: use first part of domain
  const shortName = sourceName.split('.')[0].charAt(0).toUpperCase() + sourceName.split('.')[0].slice(1)
  return { label: shortName, color: 'text-white/50', bg: 'bg-white/5 border-white/10' }
}

export function LeadScraperPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [scraping, setScraping] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [deepScan, setDeepScan] = useState(false)
  const [results, setResults] = useState<LeadResult[]>([])
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sourceCount, setSourceCount] = useState(0)
  const [scrapeProgress, setScrapeProgress] = useState('')

  const startScrape = async () => {
    if (!keyword.trim()) return
    setScraping(true)
    setResults([])
    setError(null)
    setSourceCount(0)
    setScrapeProgress(deepScan ? 'Searching the web...' : 'Searching...')

    try {
      const res = await fetch('/api/leads', {
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
        setResults(data.leads || [])
        setSourceCount(data.sources || 0)

        if (data.leads?.length > 0) {
          addToast({ type: 'success', title: `Found ${data.leads.length} real leads from ${data.sources || 0} sources` })
        } else {
          setError('No leads found. Try a different keyword or location.')
        }
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to search leads. Please try again.')
        addToast({ type: 'error', title: 'Lead search failed' })
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      addToast({ type: 'error', title: 'Network error' })
    } finally {
      setScraping(false)
      setScrapeProgress('')
    }
  }

  const toggleSave = (business: string) => {
    setSavedLeads(prev => {
      const next = new Set(prev)
      if (next.has(business)) next.delete(business)
      else next.add(business)
      return next
    })
  }

  const exportLeads = () => {
    const leads = results.filter(r => savedLeads.has(r.business))
    if (leads.length === 0) return
    const headers = 'Business,Phone,Category,Rating,Address,Description,Source,SourceName\n'
    const rows = leads.map(l =>
      `"${l.business}","${l.phone}","${l.category}",${l.rating},"${l.address}","${l.description}","${l.source}","${l.sourceName}"`
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
    const headers = 'Business,Phone,Category,Rating,Address,Description,Source,SourceName\n'
    const rows = results.map(l =>
      `"${l.business}","${l.phone}","${l.category}",${l.rating},"${l.address}","${l.description}","${l.source}","${l.sourceName}"`
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

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white/90">Lead Scraper</h2>
          <p className="text-[10px] text-white/40">Real web search • Find actual businesses</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
          <Globe className="w-3 h-3 text-green-400" />
          <span className="text-[9px] font-medium text-green-400">Web Search</span>
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
            <p className="text-[10px] text-white/40">Search the web for real businesses</p>
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
                placeholder="City or area..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
              />
            </div>
          </div>

          {/* Deep Scan Toggle */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <p className="text-[11px] font-medium text-white/70">Deep Scan</p>
                <p className="text-[9px] text-white/30">Scrape pages for phone & address</p>
              </div>
            </div>
            <button
              onClick={() => setDeepScan(!deepScan)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                deepScan ? 'bg-amber-500/30 border border-amber-500/40' : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                deepScan ? 'left-5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'left-0.5 bg-white/30'
              }`} />
            </button>
          </div>

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
                {scrapeProgress || 'Searching...'}
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" /> Find Real Leads
              </>
            )}
          </button>
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
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <button
                  onClick={exportAllLeads}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-white/40 border border-white/5 text-[10px] hover:bg-white/10 hover:text-white/60 transition-colors"
                >
                  <Download className="w-2.5 h-2.5" /> All
                </button>
              )}
              {savedLeads.size > 0 && (
                <button onClick={exportLeads} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[11px] font-medium hover:bg-neon-blue/20 transition-colors">
                  <Download className="w-3 h-3" /> Saved ({savedLeads.size})
                </button>
              )}
            </div>
          </div>

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
          <div className="max-h-[28rem] overflow-y-auto no-scrollbar space-y-2">
            {results.map((r, i) => {
              const badge = getSourceBadge(r.sourceName)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
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

                      {/* Phone */}
                      {r.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-2.5 h-2.5 text-neon-green/60" />
                          <span className="text-[10px] text-neon-green/80 font-mono">{r.phone}</span>
                        </div>
                      )}

                      {/* Category + Address */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/15">{r.category}</span>
                        {r.address && (
                          <span className="text-[9px] text-white/20 flex items-center gap-0.5">
                            <MapPin className="w-2 h-2" /> {r.address}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {r.description && (
                        <p className="text-[9px] text-white/25 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                      )}

                      {/* Source Link */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Building2 className="w-2.5 h-2.5 text-white/15" />
                        <a
                          href={r.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-white/20 hover:text-white/40 transition-colors truncate flex items-center gap-1"
                        >
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
                <BarChart3 className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/30">{results.filter(r => r.phone).length} with phone</span>
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

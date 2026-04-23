'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, MapPin, Building2, Phone, Star, Download, Plus, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function LeadScraperPage() {
  const { goBack } = useAppStore()
  const [scraping, setScraping] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<{business: string; phone: string; category: string; rating: number; address: string}[]>([])
  const [savedLeads, setSavedLeads] = useState<Set<string>>(new Set())

  const mockResults = [
    { business: 'Tech Solutions Inc', phone: '+1 555 0201', category: 'Technology', rating: 4.8, address: '123 Innovation Drive' },
    { business: 'Green Market Co', phone: '+44 7700 900002', category: 'Retail', rating: 4.2, address: '45 Market Street' },
    { business: 'Digital Agency Pro', phone: '+1 555 0203', category: 'Marketing', rating: 4.6, address: '78 Creative Lane' },
    { business: 'Fresh Bites Restaurant', phone: '+1 555 0204', category: 'Food & Dining', rating: 4.4, address: '90 Main Avenue' },
    { business: 'FitZone Gym', phone: '+1 555 0205', category: 'Fitness', rating: 4.7, address: '200 Health Blvd' },
    { business: 'StyleHub Salon', phone: '+1 555 0206', category: 'Beauty', rating: 4.5, address: '55 Fashion Way' },
  ]

  const startScrape = () => {
    setScraping(true)
    setResults([])
    setTimeout(() => {
      setScraping(false)
      setResults(mockResults)
    }, 2500)
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
    const headers = 'Business,Phone,Category,Rating,Address\n'
    const rows = leads.map(l => `${l.business},${l.phone},${l.category},${l.rating},${l.address}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white/90">Lead Scraper</h2>
          <p className="text-[10px] text-white/40">Find new prospects by keyword and location</p>
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
            <p className="text-[10px] text-white/40">Discover businesses matching your criteria</p>
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
            {scraping ? <><Search className="w-4 h-4 animate-pulse" /> Searching...</> : <><Search className="w-4 h-4" /> Find Leads</>}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/70">Found {results.length} leads</h4>
            {savedLeads.size > 0 && (
              <button onClick={exportLeads} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[11px] font-medium hover:bg-neon-blue/20 transition-colors">
                <Download className="w-3 h-3" /> Export ({savedLeads.size})
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto no-scrollbar space-y-2">
            {results.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-lg p-3 flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white/80">{r.business}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-[9px] text-amber-400">{r.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {r.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/15">{r.category}</span>
                    <span className="text-[9px] text-white/20 flex items-center gap-0.5">
                      <MapPin className="w-2 h-2" /> {r.address}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSave(r.business)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${
                    savedLeads.has(r.business)
                      ? 'bg-neon-green/15 border-neon-green/25 text-neon-green'
                      : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10 hover:text-white/40'
                  }`}
                >
                  {savedLeads.has(r.business) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

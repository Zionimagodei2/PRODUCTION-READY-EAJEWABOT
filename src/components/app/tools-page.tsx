'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Link2, Play, Pause, Download, Copy, CheckCircle2, AlertCircle, ExternalLink, Sparkles, Zap, ShieldCheck, QrCode, ChevronRight, Globe, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

// Group Extractor Sub-component
export function GroupExtractor() {
  const { setActiveFeature } = useAppStore()
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState<{name: string; phone: string; group: string}[]>([])

  const startExtraction = async () => {
    setExtracting(true)
    setProgress(0)
    setExtracted([])
    
    try {
      const res = await fetch('/api/contacts?limit=50')
      if (res.ok) {
        const contacts = await res.json()
        // Simulate progress while loading
        let p = 0
        const progressInterval = setInterval(() => {
          p = Math.min(p + Math.random() * 20, 90)
          setProgress(p)
        }, 300)
        
        clearInterval(progressInterval)
        setProgress(100)
        setExtracted(contacts.map((c: { name: string; phone: string; tags: string }) => ({
          name: c.name,
          phone: c.phone,
          group: c.tags?.split(',')[0]?.trim() || 'Uncategorized',
        })))
      }
    } catch {
      // Failed to extract
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Groups Online - Primary CTA */}
      <motion.button
        onClick={() => setActiveFeature('group-extractor')}
        whileTap={{ scale: 0.98 }}
        className="w-full glass-card rounded-xl p-4 neon-glow-green border border-green-500/15 hover:bg-white/[0.03] transition-all text-left"
        style={{ boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
            <Globe className="w-5 h-5 text-neon-green" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white/90">Search Groups Online</h3>
              <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white">NEW</span>
            </div>
            <p className="text-[10px] text-white/40">Discover real WhatsApp groups by keyword</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20" />
        </div>
        <p className="text-[9px] text-white/25 leading-tight">Find and join WhatsApp communities with real invite links. Search by keyword and location.</p>
      </motion.button>

      <div className="gradient-divider" />

      {/* Traditional Group Extractor */}
      <div className="glass-card rounded-xl p-4 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
            <Users className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Extract from Your Groups</h3>
            <p className="text-[10px] text-white/40">Pull members from groups you belong to</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">Export group contacts as CSV or JSON for your CRM.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Select Group</label>
            <select className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-blue/40 transition-all duration-200">
              <option>All WhatsApp Groups</option>
              <option>Contacts by Tag</option>
            </select>
          </div>

          <button
            onClick={startExtraction}
            disabled={extracting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              extracting 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                : 'bg-neon-blue/15 text-neon-blue border border-neon-blue/25 hover:bg-neon-blue/25'
            }`}
          >
            {extracting ? <><Pause className="w-4 h-4" /> Extracting...</> : <><Play className="w-4 h-4" /> Start Extraction</>}
          </button>

          {(extracting || progress > 0) && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/30">
                <span>{extracting ? 'Scanning group members...' : 'Complete'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {extracted.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white/50">Extracted Contacts ({extracted.length})</h4>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-[10px] hover:bg-neon-blue/20 transition-colors">
                <Download className="w-3 h-3" /> Export CSV
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-[10px] hover:bg-neon-purple/20 transition-colors">
                <Download className="w-3 h-3" /> Export JSON
              </button>
            </div>
          </div>
          {extracted.map((contact, i) => (
            <motion.div
              key={`${contact.name}-${contact.phone}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-white/80">{contact.name}</p>
                <p className="text-[10px] text-white/30">{contact.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/15">{contact.group}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Lead Scraper Sub-component
export function LeadScraper() {
  const [scraping, setScraping] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<{
    business: string; phone: string; category: string; rating: number;
    address: string; hasWhatsApp?: boolean; sourceName: string
  }[]>([])
  const [phoneCount, setPhoneCount] = useState(0)
  const [whatsappCount, setWhatsappCount] = useState(0)
  const [scrapeStage, setScrapeStage] = useState('')

  const startScrape = async () => {
    if (!keyword.trim()) return
    setScraping(true)
    setResults([])
    setScrapeStage('Searching...')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), location: location.trim(), deepScan: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setResults((data.leads || []).map((l: {
          business: string; phone: string; category: string; rating: number;
          address: string; hasWhatsApp?: boolean; sourceName: string
        }) => ({
          business: l.business,
          phone: l.phone,
          category: l.category,
          rating: l.rating || 0,
          address: l.address || '',
          hasWhatsApp: l.hasWhatsApp || false,
          sourceName: l.sourceName || '',
        })))
        setPhoneCount(data.phoneCount || 0)
        setWhatsappCount(data.whatsappCount || 0)
        setScrapeStage('')
      }
    } catch {
      // Search failed
    } finally {
      setScraping(false)
      setScrapeStage('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
            <Search className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Lead Scraper</h3>
            <p className="text-[10px] text-white/40">Multi-source • Deep Scan enabled</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">Search Google, Yelp, YellowPages & more. Deep scan scrapes pages for phones & WhatsApp links.</p>
          </div>
          <span className="pro-badge">PRO</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Search Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startScrape() }}
              placeholder="e.g. Restaurant, Gym, Salon..."
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40 transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startScrape() }}
              placeholder="City or area..."
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40 transition-all duration-200"
            />
          </div>
          <button
            onClick={startScrape}
            disabled={scraping || !keyword.trim()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              scraping 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                : 'bg-neon-green/15 text-neon-green border border-neon-green/25 hover:bg-neon-green/25'
            }`}
          >
            {scraping ? <><AlertCircle className="w-4 h-4 animate-pulse" /> {scrapeStage || 'Searching...'}</> : <><Search className="w-4 h-4" /> Deep Scan Leads</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white/50">Found {results.length} leads</h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/15">
                {phoneCount} phones
              </span>
              {whatsappCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15">
                  {whatsappCount} WhatsApp
                </span>
              )}
            </div>
          </div>
          {results.map((r, i) => (
            <motion.div
              key={`${r.business}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-white/80 truncate">{r.business}</p>
                  {r.hasWhatsApp && (
                    <span className="text-[7px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10">WA</span>
                  )}
                </div>
                <p className="text-[10px] text-white/30">{r.phone || 'No phone'}</p>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/15 flex-shrink-0">{r.category}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Link Generator Sub-component
export function LinkGenerator() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)

  const generateLink = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const encodedMsg = encodeURIComponent(message)
    setGeneratedLink(`https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-orange border border-orange-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10">
            <Link2 className="w-5 h-5 text-neon-orange" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">WhatsApp Link Generator</h3>
            <p className="text-[10px] text-white/40">Create click-to-chat links</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">Generate wa.me links with pre-filled messages to streamline customer conversations.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Phone Number (with country code)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40 transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Pre-filled Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'd like to know more about..."
              rows={3}
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40 resize-none transition-all duration-200"
            />
          </div>
          <button
            onClick={generateLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neon-orange/15 text-neon-orange border border-neon-orange/25 hover:bg-neon-orange/25 text-sm font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" /> Generate Link
          </button>
        </div>
      </div>

      {generatedLink && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          <h4 className="text-xs font-semibold text-white/50">Generated Link</h4>
          <div className="bg-white/5 rounded-lg p-3 text-xs text-neon-cyan break-all font-mono">
            {generatedLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon-blue/15 text-neon-blue border border-neon-blue/25 text-xs font-medium hover:bg-neon-blue/25 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={generatedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neon-green/15 text-neon-green border border-neon-green/25 text-xs font-medium hover:bg-neon-green/25 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Test
            </a>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function ToolsPage() {
  const [activeTool, setActiveTool] = useState<'extractor' | 'scraper' | 'generator'>('extractor')
  const { setActiveFeature } = useAppStore()

  const quickAccessItems = [
    { title: 'WhatsApp Link', description: 'Create wa.me links', icon: <Link2 className="w-4 h-4" />, accentColor: '#06b6d4', accentBg: 'bg-cyan-500/10', accentText: 'text-cyan-400', feature: 'link-generator' as const },
    { title: 'Validate Numbers', description: 'Verify WA numbers', icon: <ShieldCheck className="w-4 h-4" />, accentColor: '#22c55e', accentBg: 'bg-green-500/10', accentText: 'text-green-400', feature: 'number-validator' as const },
    { title: 'QR Code', description: 'Generate QR codes', icon: <QrCode className="w-4 h-4" />, accentColor: '#06b6d4', accentBg: 'bg-cyan-500/10', accentText: 'text-cyan-400', feature: 'qr-code' as const },
  ]

  const tools = [
    { 
      id: 'extractor' as const, 
      label: 'Group Extractor', 
      icon: <Users className="w-4 h-4" />,
      description: 'Pull contacts from WhatsApp groups',
      color: '#22c55e',
      orbColor: 'rgba(34,197,94,0.15)',
      bgClass: 'from-green-500/[0.06]',
      borderClass: 'border-green-500/20',
    },
    { 
      id: 'scraper' as const, 
      label: 'Lead Scraper', 
      icon: <Search className="w-4 h-4" />,
      description: 'Find leads from multiple sources',
      color: '#8b5cf6',
      orbColor: 'rgba(139,92,246,0.15)',
      bgClass: 'from-purple-500/[0.06]',
      borderClass: 'border-purple-500/20',
    },
    { 
      id: 'generator' as const, 
      label: 'Link Generator', 
      icon: <Link2 className="w-4 h-4" />,
      description: 'Create click-to-chat links',
      color: '#f97316',
      orbColor: 'rgba(249,115,22,0.15)',
      bgClass: 'from-orange-500/[0.06]',
      borderClass: 'border-orange-500/20',
    },
  ]

  const activeToolData = tools.find(t => t.id === activeTool)

  // Tool preview cards - shown when no tool is active or as visual entry points
  const toolPreviewCards = [
    {
      id: 'extractor' as const,
      title: 'Group Extractor',
      description: 'Extract contacts from WhatsApp groups you belong to. Export as CSV or JSON for your CRM.',
      icon: <Users className="w-6 h-6" />,
      color: '#22c55e',
      features: ['Search Groups Online', 'Bulk Extract', 'CSV Export'],
      badge: 'NEW',
    },
    {
      id: 'scraper' as const,
      title: 'Lead Scraper',
      description: 'Find business leads from Google, Yelp, YellowPages and more. Deep scan for WhatsApp numbers.',
      icon: <Search className="w-6 h-6" />,
      color: '#8b5cf6',
      features: ['Multi-Source', 'Deep Scan', 'WhatsApp Detection'],
      badge: 'PRO',
    },
    {
      id: 'generator' as const,
      title: 'Link Generator',
      description: 'Generate WhatsApp click-to-chat links with pre-filled messages. Perfect for marketing campaigns.',
      icon: <Link2 className="w-6 h-6" />,
      color: '#f97316',
      features: ['Custom Messages', 'QR Codes', 'Copy & Share'],
      badge: null,
    },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Quick Access Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Quick Access</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {quickAccessItems.map((item) => (
            <motion.button
              key={item.feature}
              onClick={() => setActiveFeature(item.feature)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="glass-card flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-200 border border-white/[0.08] min-w-[140px]"
              style={{ boxShadow: `0 0 12px ${item.accentColor}08` }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.accentBg}`}>
                <div className={item.accentText}>{item.icon}</div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-white/80">{item.title}</p>
                <p className="text-[9px] text-white/30">{item.description}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/15" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="gradient-divider" />

      {/* Tool Preview Cards - Visual cards for each tool */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Power Tools</span>
        </div>
        {toolPreviewCards.map((card, i) => (
          <motion.button
            key={card.id}
            onClick={() => setActiveTool(card.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full glass-card rounded-2xl p-4 text-left transition-all duration-200 border hover:shadow-lg group ${
              activeTool === card.id ? `${card.borderClass} hover:shadow-lg` : 'border-white/[0.08] hover:border-white/[0.12]'
            }`}
            style={activeTool === card.id ? { 
              boxShadow: `0 0 20px ${card.color}15`,
              borderColor: `${card.color}30`,
            } : {}}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`,
                  boxShadow: `0 0 16px ${card.color}15`
                }}
              >
                <div style={{ color: card.color, filter: `drop-shadow(0 0 4px ${card.color}40)` }}>{card.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white/90">{card.title}</h3>
                  {card.badge && (
                    <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      card.badge === 'NEW' 
                        ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white badge-pulse' 
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/45 mt-0.5 leading-snug">{card.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  {card.features.map((feature) => (
                    <span key={feature} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.06]">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/15 flex-shrink-0 mt-1 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="gradient-divider" />

      {/* Tool Tabs - Enhanced with icons */}
      <div className="flex gap-2">
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${
              activeTool === tool.id
                ? 'hover:scale-[1.02]'
                : 'bg-white/5 text-white/40 border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1]'
            }`}
            style={activeTool === tool.id ? {
              backgroundColor: `${tool.color}18`,
              color: tool.color,
              borderColor: `${tool.color}30`,
              boxShadow: `0 0 16px ${tool.color}12`,
            } : {}}
          >
            <div className="transition-transform duration-200" style={{
              transform: activeTool === tool.id ? 'scale(1.1)' : 'scale(1)',
            }}>
              {tool.icon}
            </div>
            {tool.label}
          </motion.button>
        ))}
      </div>

      {/* Active tool content with animated transitions and gradient orbs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative"
        >
          {/* Animated gradient orb background */}
          {activeToolData && (
            <div 
              className="glow-orb w-32 h-32 -top-8 -right-8"
              style={{ background: activeToolData.orbColor }}
            />
          )}
          {activeTool === 'extractor' && <GroupExtractor />}
          {activeTool === 'scraper' && <LeadScraper />}
          {activeTool === 'generator' && <LinkGenerator />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

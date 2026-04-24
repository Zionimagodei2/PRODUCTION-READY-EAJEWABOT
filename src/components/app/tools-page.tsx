'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Link2, Play, Pause, Download, Copy, CheckCircle2, AlertCircle, ExternalLink, Clock, Sparkles, Zap, ShieldCheck, QrCode, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

// Group Extractor Sub-component
export function GroupExtractor() {
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
      <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
            <Users className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Group Extractor</h3>
            <p className="text-[10px] text-white/40">Extract contacts from WhatsApp groups</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">Pull all members from any group you belong to and export them as CSV or JSON for your CRM.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Select Group</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-green/40">
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
                : 'bg-neon-green/15 text-neon-green border border-neon-green/25 hover:bg-neon-green/25'
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
                  className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan"
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
              key={i}
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
  const [results, setResults] = useState<{business: string; phone: string; category: string}[]>([])

  const [location, setLocation] = useState('')

  const startScrape = async () => {
    if (!keyword.trim()) return
    setScraping(true)
    setResults([])
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), location: location.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setResults((data.leads || []).map((l: { business: string; phone: string; category: string }) => ({
          business: l.business,
          phone: l.phone,
          category: l.category,
        })))
      }
    } catch {
      // Search failed
    } finally {
      setScraping(false)
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
            <p className="text-[10px] text-white/40">Find new prospects by keyword</p>
            <p className="text-[9px] text-white/20 mt-0.5 leading-tight">Search for businesses by category and location to discover fresh leads with verified phone numbers.</p>
          </div>
          <span className="pro-badge">PRO</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Search Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Restaurant, Gym, Salon..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
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
            {scraping ? <><AlertCircle className="w-4 h-4 animate-pulse" /> Searching...</> : <><Search className="w-4 h-4" /> Find Leads</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-white/50">Found {results.length} leads</h4>
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-white/80">{r.business}</p>
                <p className="text-[10px] text-white/30">{r.phone}</p>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/15">{r.category}</span>
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
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Pre-filled Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'd like to know more about..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-orange/40 resize-none"
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
    { title: 'WhatsApp Link', icon: <Link2 className="w-4 h-4" />, accentColor: '#06b6d4', accentBg: 'bg-cyan-500/10', accentText: 'text-cyan-400', feature: 'link-generator' as const },
    { title: 'Validate Numbers', icon: <ShieldCheck className="w-4 h-4" />, accentColor: '#22c55e', accentBg: 'bg-green-500/10', accentText: 'text-green-400', feature: 'number-validator' as const },
    { title: 'QR Code', icon: <QrCode className="w-4 h-4" />, accentColor: '#06b6d4', accentBg: 'bg-cyan-500/10', accentText: 'text-cyan-400', feature: 'qr-code' as const },
  ]

  const recentlyUsed = [
    { id: 'extractor' as const, label: 'Group Extractor', icon: <Users className="w-3 h-3" />, time: '2h ago', color: '#22c55e' },
    { id: 'generator' as const, label: 'Link Generator', icon: <Link2 className="w-3 h-3" />, time: '5h ago', color: '#f97316' },
  ]

  const tools = [
    { id: 'extractor' as const, label: 'Group Extractor', color: 'neon-green', orbColor: 'rgba(34,197,94,0.15)' },
    { id: 'scraper' as const, label: 'Lead Scraper', color: 'neon-green', orbColor: 'rgba(139,92,246,0.15)' },
    { id: 'generator' as const, label: 'Link Generator', color: 'neon-orange', orbColor: 'rgba(249,115,22,0.15)' },
  ]

  const activeToolData = tools.find(t => t.id === activeTool)

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
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Quick Access</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {quickAccessItems.map((item) => (
            <motion.button
              key={item.feature}
              onClick={() => setActiveFeature(item.feature)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              className="glass-card flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all border border-white/[0.06] min-w-[140px]"
              style={{ boxShadow: `0 0 12px ${item.accentColor}08` }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.accentBg}`}>
                <div className={item.accentText}>{item.icon}</div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-semibold text-white/80">{item.title}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/15" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="gradient-divider" />

      {/* Recently Used Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3 h-3 text-white/30" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Recently Used</span>
        </div>
        <div className="flex gap-2">
          {recentlyUsed.map((tool) => (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
              style={{ boxShadow: `0 0 12px ${tool.color}08` }}
            >
              <div style={{ color: tool.color }}>{tool.icon}</div>
              <div className="text-left">
                <p className="text-[10px] font-semibold text-white/70">{tool.label}</p>
                <p className="text-[8px] text-white/25">{tool.time}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tool Tabs */}
      <div className="flex gap-2">
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
              activeTool === tool.id
                ? `bg-${tool.color}/15 text-${tool.color} border-${tool.color}/25`
                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
            }`}
            style={activeTool === tool.id ? {
              backgroundColor: tool.color === 'neon-green' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
              color: tool.color === 'neon-green' ? '#22c55e' : '#f97316',
              borderColor: tool.color === 'neon-green' ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)',
              boxShadow: tool.color === 'neon-green' ? '0 0 12px rgba(34,197,94,0.1)' : '0 0 12px rgba(249,115,22,0.1)',
            } : {}}
          >
            {tool.label}
          </motion.button>
        ))}
      </div>

      {/* Active tool content with animated transitions and gradient orbs */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTool}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
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

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Link2, Play, Pause, Download, Copy, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

// Group Extractor Sub-component
export function GroupExtractor() {
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState<{name: string; phone: string; group: string}[]>([])

  const mockResults = [
    { name: 'Alice Martin', phone: '+1 555 0101', group: 'Marketing Team' },
    { name: 'Bob Chen', phone: '+86 139 0013 9000', group: 'Marketing Team' },
    { name: 'Carol White', phone: '+44 7700 900001', group: 'Sales Group' },
    { name: 'Dan Lopez', phone: '+34 612 345 678', group: 'Sales Group' },
    { name: 'Eva Kim', phone: '+82 10 1234 5678', group: 'Support Chat' },
  ]

  const startExtraction = () => {
    setExtracting(true)
    setProgress(0)
    setExtracted([])
    
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setExtracting(false)
        setExtracted(mockResults)
      }
      setProgress(p)
    }, 400)
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
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Select Group</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-green/40">
              <option>Marketing Team (45 members)</option>
              <option>Sales Group (32 members)</option>
              <option>Support Chat (28 members)</option>
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

  const mockResults = [
    { business: 'Tech Solutions Inc', phone: '+1 555 0201', category: 'Technology' },
    { business: 'Green Market Co', phone: '+44 7700 900002', category: 'Retail' },
    { business: 'Digital Agency Pro', phone: '+1 555 0203', category: 'Marketing' },
  ]

  const startScrape = () => {
    setScraping(true)
    setTimeout(() => {
      setScraping(false)
      setResults(mockResults)
    }, 2500)
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
          </div>
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
              placeholder="City or area..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-green/40"
            />
          </div>
          <button
            onClick={startScrape}
            disabled={scraping}
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

  const tools = [
    { id: 'extractor' as const, label: 'Group Extractor', color: 'neon-green' },
    { id: 'scraper' as const, label: 'Lead Scraper', color: 'neon-green' },
    { id: 'generator' as const, label: 'Link Generator', color: 'neon-orange' },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Tool Tabs */}
      <div className="flex gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
              activeTool === tool.id
                ? `bg-${tool.color}/15 text-${tool.color} border-${tool.color}/25`
                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
            }`}
            style={activeTool === tool.id ? {
              backgroundColor: tool.color === 'neon-green' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
              color: tool.color === 'neon-green' ? '#22c55e' : '#f97316',
              borderColor: tool.color === 'neon-green' ? 'rgba(34,197,94,0.25)' : 'rgba(249,115,22,0.25)',
            } : {}}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {/* Active tool content */}
      {activeTool === 'extractor' && <GroupExtractor />}
      {activeTool === 'scraper' && <LeadScraper />}
      {activeTool === 'generator' && <LinkGenerator />}
    </div>
  )
}

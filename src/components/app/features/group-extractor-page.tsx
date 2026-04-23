'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Play, Pause, Download, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function GroupExtractorPage() {
  const { goBack } = useAppStore()
  const [extracting, setExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState<{name: string; phone: string; group: string}[]>([])
  const [selectedGroup, setSelectedGroup] = useState('marketing')

  const groups = [
    { id: 'marketing', name: 'Marketing Team', members: 45 },
    { id: 'sales', name: 'Sales Group', members: 32 },
    { id: 'support', name: 'Support Chat', members: 28 },
    { id: 'dev', name: 'Dev Team', members: 18 },
    { id: 'partners', name: 'Partners & Vendors', members: 53 },
  ]

  const mockResults = [
    { name: 'Alice Martin', phone: '+1 555 0101', group: 'Marketing Team' },
    { name: 'Bob Chen', phone: '+86 139 0013 9000', group: 'Marketing Team' },
    { name: 'Carol White', phone: '+44 7700 900001', group: 'Marketing Team' },
    { name: 'Dan Lopez', phone: '+34 612 345 678', group: 'Marketing Team' },
    { name: 'Eva Kim', phone: '+82 10 1234 5678', group: 'Marketing Team' },
    { name: 'Frank Okafor', phone: '+234 801 234 5678', group: 'Marketing Team' },
    { name: 'Grace Singh', phone: '+91 98765 43210', group: 'Marketing Team' },
    { name: 'Hassan Ali', phone: '+971 50 123 4567', group: 'Marketing Team' },
  ]

  const startExtraction = () => {
    setExtracting(true)
    setProgress(0)
    setExtracted([])
    
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 12
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setExtracting(false)
        setExtracted(mockResults)
      }
      setProgress(p)
    }, 350)
  }

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
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(extracted, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'group-contacts.json'
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
          <h2 className="text-lg font-bold text-white/90">Group Extractor</h2>
          <p className="text-[10px] text-white/40">Extract contacts from WhatsApp groups</p>
        </div>
      </div>

      {/* Group Selection */}
      <div className="glass-card rounded-xl p-4 neon-glow-green border border-green-500/15">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
            <Users className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Select Group</h3>
            <p className="text-[10px] text-white/40">Choose a group to extract members from</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border ${
                selectedGroup === g.id
                  ? 'bg-green-500/10 border-green-500/25 text-white/90'
                  : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-white/30" />
                <span>{g.name}</span>
              </div>
              <span className="text-[10px] text-white/30">{g.members} members</span>
            </button>
          ))}
        </div>

        <button
          onClick={startExtraction}
          disabled={extracting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            extracting 
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
              : 'bg-neon-green/15 text-neon-green border border-neon-green/25 hover:bg-neon-green/25'
          }`}
        >
          {extracting ? <><Pause className="w-4 h-4" /> Extracting...</> : <><Play className="w-4 h-4" /> Start Extraction</>}
        </button>
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
      {extracted.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white/70">Extracted Contacts ({extracted.length})</h4>
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
            {extracted.map((contact, i) => (
              <motion.div
                key={i}
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
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

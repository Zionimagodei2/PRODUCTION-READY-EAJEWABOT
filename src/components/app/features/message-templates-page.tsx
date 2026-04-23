'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Trash2, Copy, Star, Edit, CheckCircle2, X } from 'lucide-react'

interface Template {
  id: string
  name: string
  category: string
  content: string
  starred: boolean
  usageCount: number
}

const mockTemplates: Template[] = [
  { id: '1', name: 'Welcome Message', category: 'greeting', content: 'Hello {name}! 👋 Welcome to our business. How can we help you today?', starred: true, usageCount: 234 },
  { id: '2', name: 'Order Confirmation', category: 'transaction', content: 'Hi {name}, your order #{order_id} has been confirmed! Estimated delivery: {date}.', starred: true, usageCount: 189 },
  { id: '3', name: 'Flash Sale Alert', category: 'marketing', content: '🔥 FLASH SALE! {discount}% off on {product}! Use code {code} at checkout. Ends in {time}!', starred: false, usageCount: 156 },
  { id: '4', name: 'Follow-up', category: 'follow-up', content: 'Hi {name}, just checking in! Did you get a chance to review our last proposal?', starred: false, usageCount: 98 },
  { id: '5', name: 'Thank You', category: 'greeting', content: 'Thank you for your purchase, {name}! 🎉 We appreciate your business. Here\'s a {discount}% discount on your next order: {code}', starred: true, usageCount: 312 },
  { id: '6', name: 'Appointment Reminder', category: 'transaction', content: 'Reminder: Your appointment is scheduled for {date} at {time}. Reply YES to confirm or NO to reschedule.', starred: false, usageCount: 67 },
]

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  greeting: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/15' },
  transaction: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/15' },
  marketing: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/15' },
  'follow-up': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/15' },
}

export function MessageTemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || t.category === filterCat
    return matchSearch && matchCat
  })

  const toggleStar = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, starred: !t.starred } : t))
  }

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const copyTemplate = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categories = Array.from(new Set(templates.map(t => t.category)))

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header Card */}
      <div className="glass-card rounded-2xl p-4 neon-glow-blue border border-blue-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white/95">Message Templates</h2>
            <p className="text-[10px] text-white/45">{templates.length} templates • {templates.filter(t => t.starred).length} starred</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/30 transition-colors"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterCat(null)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${
            !filterCat ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'bg-white/5 text-white/35 border-white/5'
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const colors = categoryColors[cat] || { bg: 'bg-white/10', text: 'text-white/50', border: 'border-white/10' }
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${
                filterCat === cat ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-white/5 text-white/35 border-white/5'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Create Template Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-3 border border-blue-500/20 neon-glow-blue overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80">New Template</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <input placeholder="Template name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/30" />
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-blue-500/30">
              <option value="greeting">Greeting</option>
              <option value="transaction">Transaction</option>
              <option value="marketing">Marketing</option>
              <option value="follow-up">Follow-up</option>
            </select>
            <textarea placeholder="Template content... Use {name}, {date}, etc." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/30 resize-none" />
            <p className="text-[9px] text-white/20">Variables: {`{name}`}, {`{date}`}, {`{order_id}`}, {`{discount}`}, {`{product}`}, {`{code}`}, {`{time}`}</p>
            <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Save Template
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template List */}
      <div className="space-y-2.5">
        {filtered.map((template, i) => {
          const catColors = categoryColors[template.category] || { bg: 'bg-white/10', text: 'text-white/50', border: 'border-white/10' }
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-4 space-y-2.5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button onClick={() => toggleStar(template.id)} className="flex-shrink-0">
                    <Star className={`w-4 h-4 transition-colors ${template.starred ? 'text-amber-400 fill-amber-400' : 'text-white/15 hover:text-white/30'}`} />
                  </button>
                  <h3 className="text-[13px] font-bold text-white/90 truncate">{template.name}</h3>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${catColors.bg} ${catColors.text} ${catColors.border} flex-shrink-0 ml-2`}>
                  {template.category}
                </span>
              </div>
              
              <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{template.content}</p>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] text-white/20">Used {template.usageCount} times</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyTemplate(template.id, template.content)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {copiedId === template.id 
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 
                      : <Copy className="w-3.5 h-3.5 text-white/20 hover:text-white/40" />
                    }
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <Edit className="w-3.5 h-3.5 text-white/20 hover:text-white/40" />
                  </button>
                  <button onClick={() => deleteTemplate(template.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400/30 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto text-white/10 mb-2" />
          <p className="text-sm text-white/25">No templates found</p>
        </div>
      )}

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg z-30 hover:scale-105 transition-transform"
          style={{ boxShadow: '0 0 25px rgba(59,130,246,0.3)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

function Search({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Clock, Users, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react'

export function SendMessagePage() {
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState<'list' | 'csv' | 'group'>('list')
  const [schedule, setSchedule] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    }, 2000)
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-blue border border-blue-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10">
            <Send className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90">Send Message</h2>
            <p className="text-[10px] text-white/40">Bulk campaigns & scheduled sending</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Recipients</label>
        <div className="flex gap-2">
          {[
            { id: 'list' as const, label: 'Contact List', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'csv' as const, label: 'CSV Import', icon: <Upload className="w-3.5 h-3.5" /> },
            { id: 'group' as const, label: 'Group', icon: <Users className="w-3.5 h-3.5" /> },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setRecipientType(type.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                recipientType === type.id
                  ? 'bg-neon-blue/15 text-neon-blue border-neon-blue/25'
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        {recipientType === 'list' && (
          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-neon-blue/40">
            <option>All Customers (847 contacts)</option>
            <option>VIP Customers (124 contacts)</option>
            <option>Leads (342 contacts)</option>
          </select>
        )}
        {recipientType === 'csv' && (
          <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-neon-blue/30 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto text-white/20 mb-2" />
            <p className="text-xs text-white/40">Drop CSV file or click to upload</p>
            <p className="text-[10px] text-white/20 mt-1">Supports .csv, .xlsx</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here... Use {name} for personalization"
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40 resize-none"
        />
        <div className="flex justify-between text-[10px] text-white/20">
          <span>Use {`{name}`} for personalization</span>
          <span>{message.length} chars</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Media (Optional)</label>
        <div className="border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-neon-blue/20 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white/30" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/50">Add image, video, or document</p>
            <p className="text-[10px] text-white/20">Max 16MB</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/70">Schedule Send</span>
          </div>
          <button
            onClick={() => setSchedule(!schedule)}
            className={`w-9 h-5 rounded-full transition-colors relative ${schedule ? 'bg-neon-blue' : 'bg-white/10'}`}
          >
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ transform: schedule ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
        {schedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-2"
          >
            <input type="date" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-neon-blue/40" />
            <input type="time" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-neon-blue/40" />
          </motion.div>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
          sent 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' 
            : sending 
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
              : message.trim()
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg neon-glow-blue hover:opacity-90'
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
        }`}
      >
        {sent ? <><CheckCircle2 className="w-4 h-4" /> Campaign Queued!</> 
         : sending ? <><AlertCircle className="w-4 h-4 animate-pulse" /> Sending...</>
         : <><Send className="w-4 h-4" /> Send Campaign</>}
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Clock, Users, FileText, Upload, CheckCircle2, AlertCircle, ArrowLeft, Hash, ImageIcon, Zap } from 'lucide-react'

export function SendMessagePage() {
  const { goBack } = useAppStore()
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
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Send Message</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Bulk campaigns & scheduled sending</p>
        </div>
      </div>

      {/* Recipients Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Recipients</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'list' as const, label: 'Contact List', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'csv' as const, label: 'CSV Import', icon: <Upload className="w-3.5 h-3.5" /> },
            { id: 'group' as const, label: 'Group', icon: <Users className="w-3.5 h-3.5" /> },
          ].map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setRecipientType(type.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] font-semibold transition-all duration-200 border ${
                recipientType === type.id
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={recipientType === type.id ? { boxShadow: '0 0 15px rgba(59,130,246,0.15)' } : undefined}
            >
              {type.icon}
              <span className="truncate">{type.label}</span>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {recipientType === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all">
                <option>All Customers (847 contacts)</option>
                <option>VIP Customers (124 contacts)</option>
                <option>Leads (342 contacts)</option>
              </select>
            </motion.div>
          )}
          {recipientType === 'csv' && (
            <motion.div
              key="csv"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center hover:border-blue-500/30 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 mx-auto text-white/20 mb-2" />
              <p className="text-xs text-white/40">Drop CSV file or click to upload</p>
              <p className="text-[10px] text-white/20 mt-1">Supports .csv, .xlsx</p>
            </motion.div>
          )}
          {recipientType === 'group' && (
            <motion.div
              key="group"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all">
                <option>Marketing Team (45 members)</option>
                <option>Support Team (32 members)</option>
                <option>Sales Team (28 members)</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Message Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-blue-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Message</span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here... Use {name} for personalization"
          rows={5}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
        />
        <div className="flex justify-between text-[10px] text-white/25">
          <span>Use {`{name}`} for personalization</span>
          <span className={message.length > 500 ? 'text-red-400' : ''}>{message.length} chars</span>
        </div>
      </motion.div>

      {/* Media Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-4 h-4 text-blue-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Media (Optional)</span>
        </div>
        <div className="border border-white/[0.06] border-dashed rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/20 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-blue-500/[0.06] flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400/40" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/50">Add image, video, or document</p>
            <p className="text-[10px] text-white/20">Max 16MB</p>
          </div>
        </div>
      </motion.div>

      {/* Schedule Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400/70" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Schedule Send</span>
          </div>
          <motion.button
            onClick={() => setSchedule(!schedule)}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-5.5 rounded-full transition-colors relative ${schedule ? 'bg-blue-500' : 'bg-white/10'}`}
            style={schedule ? { boxShadow: '0 0 12px rgba(59,130,246,0.3)' } : undefined}
          >
            <div className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all"
              style={{ transform: schedule ? 'translateX(20px)' : 'translateX(2px)', width: '18px', height: '18px' }}
            />
          </motion.button>
        </div>
        <AnimatePresence>
          {schedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 overflow-hidden"
            >
              <input type="date" className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-blue-500/30 transition-all" />
              <input type="time" className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-blue-500/30 transition-all" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Send Button */}
      <motion.button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        whileTap={{ scale: 0.97 }}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
          sent 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' 
            : sending 
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
              : message.trim()
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-blue-500/25'
                : 'bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed'
        }`}
        style={!sent && !sending && message.trim() ? { boxShadow: '0 0 20px rgba(59,130,246,0.2), 0 0 40px rgba(59,130,246,0.1)' } : undefined}
      >
        {sent ? <><CheckCircle2 className="w-4 h-4" /> Campaign Queued!</> 
         : sending ? <><AlertCircle className="w-4 h-4 animate-pulse" /> Sending...</>
         : <><Send className="w-4 h-4" /> Send Campaign</>}
      </motion.button>
    </div>
  )
}

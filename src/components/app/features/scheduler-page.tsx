'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, AlertCircle, Repeat, Edit, ArrowLeft, Zap, Hash } from 'lucide-react'

interface ScheduledMessage {
  id: string
  message: string
  recipients: string
  date: string
  time: string
  recurring: 'none' | 'daily' | 'weekly' | 'monthly'
  status: 'pending' | 'sent' | 'failed'
}

export function SchedulerPage() {
  const { goBack } = useAppStore()
  const [messages, setMessages] = useState<ScheduledMessage[]>([
    { id: '1', message: 'Good morning! Here are today\'s deals...', recipients: 'All Customers (847)', date: '2024-01-20', time: '09:00', recurring: 'daily', status: 'pending' },
    { id: '2', message: 'Weekly newsletter with product updates', recipients: 'Newsletter Subs (342)', date: '2024-01-22', time: '10:00', recurring: 'weekly', status: 'pending' },
    { id: '3', message: 'Happy hour starts now! 50% off all items', recipients: 'VIP Customers (124)', date: '2024-01-18', time: '17:00', recurring: 'none', status: 'sent' },
    { id: '4', message: 'Flash sale ending in 2 hours!', recipients: 'All Customers (847)', date: '2024-01-17', time: '22:00', recurring: 'none', status: 'failed' },
  ])

  const [showCreate, setShowCreate] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [newRecipients, setNewRecipients] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newRecurring, setNewRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')

  const createSchedule = () => {
    if (!newMsg.trim() || !newDate || !newTime) return
    setMessages([{
      id: Date.now().toString(),
      message: newMsg.trim(),
      recipients: newRecipients || 'All Customers',
      date: newDate,
      time: newTime,
      recurring: newRecurring,
      status: 'pending',
    }, ...messages])
    setNewMsg('')
    setNewRecipients('')
    setNewDate('')
    setNewTime('')
    setNewRecurring('none')
    setShowCreate(false)
  }

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id))
  }

  const statusConfig = {
    pending: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
    sent: { color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertCircle className="w-3 h-3" /> },
  }

  const recurringLabels = { none: 'One-time', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

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
            <CalendarIcon className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Message Scheduler</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Plan and schedule your messages</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { value: messages.filter(m => m.status === 'pending').length, label: 'Pending', color: '#f59e0b', icon: <Clock className="w-4 h-4" /> },
          { value: messages.filter(m => m.status === 'sent').length, label: 'Sent', color: '#22c55e', icon: <CheckCircle2 className="w-4 h-4" /> },
          { value: messages.filter(m => m.recurring !== 'none').length, label: 'Recurring', color: '#8b5cf6', icon: <Repeat className="w-4 h-4" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-3 text-center card-hover-lift"
            style={{ borderLeft: `2px solid ${stat.color}` }}
          >
            <div
              className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1.5"
              style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-lg font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[9px] text-white/40 font-semibold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-4 space-y-4 border border-purple-500/20 overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(139,92,246,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400/70" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Schedule Message</span>
            </div>
            <textarea
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Your message..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
            />
            <input
              value={newRecipients}
              onChange={(e) => setNewRecipients(e.target.value)}
              placeholder="Recipients (e.g. All Customers)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-purple-500/30 transition-all" />
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-purple-500/30 transition-all" />
            </div>
            <div>
              <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Recurrence</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(recurringLabels) as Array<keyof typeof recurringLabels>).map((key) => (
                  <motion.button
                    key={key}
                    onClick={() => setNewRecurring(key)}
                    whileTap={{ scale: 0.95 }}
                    className={`py-2 rounded-xl text-[9px] font-semibold border transition-all duration-200 ${
                      newRecurring === key ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    {recurringLabels[key]}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button 
                onClick={createSchedule} 
                whileTap={{ scale: 0.97 }}
                className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl py-2.5 text-sm font-bold hover:bg-purple-500/25 transition-colors"
                style={{ boxShadow: '0 0 15px rgba(139,92,246,0.1)' }}
              >
                Schedule
              </motion.button>
              <motion.button 
                onClick={() => setShowCreate(false)} 
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Messages */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-purple-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Scheduled Messages</span>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>
        <div className="space-y-2.5">
          {messages.map((msg, i) => {
            const config = statusConfig[msg.status]
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 space-y-2.5 card-hover-lift"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] text-white/65 flex-1 line-clamp-2 pr-2 leading-relaxed">{msg.message}</p>
                  <span 
                    className="text-[8px] px-2 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${config.color}10`,
                      color: config.color,
                      borderColor: `${config.color}20`,
                    }}
                  >
                    {config.icon} {msg.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> {msg.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {msg.time}
                  </span>
                  {msg.recurring !== 'none' && (
                    <span className="flex items-center gap-1 text-purple-400/70">
                      <Repeat className="w-3 h-3" /> {msg.recurring}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                  <span className="text-[10px] text-white/20">{msg.recipients}</span>
                  <div className="flex gap-1">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <Edit className="w-3 h-3 text-white/20" />
                    </motion.button>
                    <motion.button 
                      onClick={() => deleteMessage(msg.id)} 
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white/20 hover:text-red-400" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg z-30 animate-fab-pulse"
          style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.15)' }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Plus, Trash2, CheckCircle2, AlertCircle, Repeat, Edit } from 'lucide-react'

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
    pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
    sent: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertCircle className="w-3 h-3" /> },
  }

  const recurringLabels = { none: 'One-time', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="glass-card rounded-xl p-4 neon-glow-purple border border-purple-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10">
            <CalendarIcon className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white/90">Message Scheduler</h2>
            <p className="text-[10px] text-white/40">Plan and schedule your messages</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{messages.filter(m => m.status === 'pending').length}</p>
          <p className="text-[10px] text-white/40">Pending</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{messages.filter(m => m.status === 'sent').length}</p>
          <p className="text-[10px] text-white/40">Sent</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neon-purple">{messages.filter(m => m.recurring !== 'none').length}</p>
          <p className="text-[10px] text-white/40">Recurring</p>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card rounded-xl p-4 space-y-3 border border-neon-purple/20 neon-glow-purple overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-white/80">Schedule Message</h3>
          <textarea
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Your message..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-purple/40 resize-none"
          />
          <input
            value={newRecipients}
            onChange={(e) => setNewRecipients(e.target.value)}
            placeholder="Recipients (e.g. All Customers)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-purple/40"
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-neon-purple/40" />
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-neon-purple/40" />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1.5 block">Recurrence</label>
            <div className="flex gap-1.5">
              {(Object.keys(recurringLabels) as Array<keyof typeof recurringLabels>).map((key) => (
                <button
                  key={key}
                  onClick={() => setNewRecurring(key)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                    newRecurring === key ? 'bg-neon-purple/15 text-neon-purple border-neon-purple/25' : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {recurringLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createSchedule} className="flex-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-lg py-2 text-sm font-medium hover:bg-neon-purple/30 transition-colors">Schedule</button>
            <button onClick={() => setShowCreate(false)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50 hover:bg-white/10 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Scheduled Messages */}
      <div className="space-y-2.5">
        {messages.map((msg, i) => {
          const config = statusConfig[msg.status]
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs text-white/70 flex-1 line-clamp-2 pr-2">{msg.message}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border flex items-center gap-1 flex-shrink-0`}>
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
                  <span className="flex items-center gap-1 text-neon-purple">
                    <Repeat className="w-3 h-3" /> {msg.recurring}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-white/20">{msg.recipients}</span>
                <div className="flex gap-1.5">
                  <button className="p-1 rounded hover:bg-white/5 transition-colors">
                    <Edit className="w-3 h-3 text-white/20 hover:text-white/50" />
                  </button>
                  <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3 h-3 text-red-400/40 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {!showCreate && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCreate(true)}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg neon-glow-purple z-30 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCircle2, AlertCircle, Info, MessageSquare } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'message'
  title: string
  description: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = []

const typeConfig = {
  success: { icon: <CheckCircle2 className="w-4 h-4" />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.15)' },
  warning: { icon: <AlertCircle className="w-4 h-4" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.15)' },
  info: { icon: <Info className="w-4 h-4" />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.15)' },
  message: { icon: <MessageSquare className="w-4 h-4" />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.15)' },
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(true)}
        title="Notifications"
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 flex-shrink-0"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-white/50" />
        {mounted && unreadCount > 0 && (
          <div
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center badge-pulse"
          >
            <span className="text-[8px] font-bold text-white">{unreadCount}</span>
          </div>
        )}
      </button>

      {/* Notification Panel - rendered via portal to escape header containing block */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center"
              onClick={close}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg rounded-t-3xl bg-[#0d0d14] border-t border-white/10 max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-2 flex-shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white/95">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400">{unreadCount} new</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-blue-400 font-semibold hover:text-blue-300">
                        Mark all read
                      </button>
                    )}
                    <button onClick={close} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <X className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="overflow-y-auto flex-1 px-3 py-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-10 h-10 mx-auto text-white/10 mb-2" />
                      <p className="text-sm text-white/30">No notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.map((notif, i) => {
                        const config = typeConfig[notif.type]
                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors ${
                              notif.read ? 'bg-white/[0.02]' : 'bg-white/[0.04]'
                            } hover:bg-white/[0.06]`}
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
                            >
                              <div style={{ color: config.color }}>{config.icon}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[12px] font-bold text-white/90 truncate">{notif.title}</h4>
                                {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                              </div>
                              <p className="text-[11px] text-white/45 mt-0.5 line-clamp-2">{notif.description}</p>
                              <p className="text-[9px] text-white/20 mt-1">{notif.time}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-white/5 flex-shrink-0">
                    <button onClick={clearAll} className="w-full py-2 rounded-xl text-xs text-white/30 font-medium hover:text-white/50 hover:bg-white/5 transition-colors">
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

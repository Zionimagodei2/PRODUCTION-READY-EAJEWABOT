'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { WifiOff, Wifi } from 'lucide-react'
import { useToastStore } from '@/store/toast-store'

type OnlineStatus = 'offline' | 'back-online' | 'online'

export function OfflineIndicator() {
  const [status, setStatus] = useState<OnlineStatus>('online')
  const [visible, setVisible] = useState(false)
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    // Set initial state from navigator.onLine
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueMicrotask(() => {
        setStatus('offline')
        setVisible(true)
      })
    }

    const handleOffline = () => {
      setStatus('offline')
      setVisible(true)
      addToast({
        type: 'warning',
        title: "You're offline",
        message: 'Check your internet connection. Some features may be unavailable.',
        duration: 5000,
      })
    }

    const handleOnline = () => {
      setStatus('back-online')
      addToast({
        type: 'success',
        title: 'Back online!',
        message: 'Your internet connection has been restored.',
        duration: 3000,
      })

      // Show "Back online!" briefly, then dismiss
      const dismissTimer = setTimeout(() => {
        setVisible(false)
      }, 2000)

      const resetTimer = setTimeout(() => {
        setStatus('online')
      }, 2500)

      return () => {
        clearTimeout(dismissTimer)
        clearTimeout(resetTimer)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [addToast])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none"
        >
          <div
            className={`mt-2 px-4 py-2 rounded-xl flex items-center gap-2 border backdrop-blur-md pointer-events-auto ${
              status === 'offline'
                ? 'bg-red-950/80 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2),0_0_40px_rgba(239,68,68,0.1)]'
                : 'bg-green-950/80 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2),0_0_40px_rgba(34,197,94,0.1)]'
            }`}
          >
            {status === 'offline' ? (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-300">
                  You&apos;re offline
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-300">
                  Back online!
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

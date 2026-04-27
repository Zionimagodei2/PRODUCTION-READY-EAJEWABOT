'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { Download, X, Smartphone, Bell, Camera, MapPin, Check, ChevronRight } from 'lucide-react'
import { usePWAInstall, usePermission } from '@/lib/permissions'
import { useToastStore } from '@/store/toast-store'

export function PWAInstallBanner() {
  const { isInstallable, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)
  const { addToast } = useToastStore()

  // Check if banner was previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed')
    if (wasDismissed) queueMicrotask(() => setDismissed(true))
  }, [])

  if (!isInstallable || dismissed) return null

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      addToast({ message: 'App installed successfully!', type: 'success' })
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-4 right-4 z-50 max-w-lg mx-auto"
      >
        <div className="glass-card-inset rounded-2xl p-4 border border-blue-500/20" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white/95">Install EAJE WhatsBot</h3>
              <p className="text-[11px] text-white/50 mt-0.5">Get faster access & work offline</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3 h-3" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4 text-white/30" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function PermissionPrompt() {
  const notificationPerm = usePermission('notifications')
  const [showPrompt, setShowPrompt] = useState(false)
  const [step, setStep] = useState(0)
  const { addToast } = useToastStore()

  useEffect(() => {
    // Show permission prompt after a delay if notifications aren't granted
    const timer = setTimeout(() => {
      if (!notificationPerm.granted && !notificationPerm.denied) {
        const asked = localStorage.getItem('permissions-asked')
        if (!asked) setShowPrompt(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [notificationPerm.granted, notificationPerm.denied])

  const handleGrant = async () => {
    const granted = await notificationPerm.request()
    if (granted) {
      addToast({ message: 'Notifications enabled!', type: 'success' })
    }
    if (step < 1) {
      setStep(step + 1)
    } else {
      setShowPrompt(false)
      localStorage.setItem('permissions-asked', 'true')
    }
  }

  const handleSkip = () => {
    if (step < 1) {
      setStep(step + 1)
    } else {
      setShowPrompt(false)
      localStorage.setItem('permissions-asked', 'true')
    }
  }

  const permissions = [
    { icon: <Bell className="w-5 h-5 text-blue-400" />, title: 'Notifications', desc: 'Get real-time alerts for messages and campaigns', color: 'blue' },
    { icon: <Camera className="w-5 h-5 text-green-400" />, title: 'Camera Access', desc: 'Scan QR codes and share media', color: 'green' },
  ]

  if (!showPrompt) return null

  const current = permissions[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-lg p-4 pb-8"
        >
          <div className="glass-card-inset rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Permissions ({step + 1}/{permissions.length})</span>
              </div>
              <button onClick={handleSkip} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-${current.color}-500/10 border border-${current.color}-500/20 flex items-center justify-center`}>
                {current.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white/95">{current.title}</h3>
                <p className="text-sm text-white/50 mt-0.5">{current.desc}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {permissions.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-500' : i < step ? 'w-4 bg-green-500' : 'w-4 bg-white/10'}`} />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleGrant}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Allow
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

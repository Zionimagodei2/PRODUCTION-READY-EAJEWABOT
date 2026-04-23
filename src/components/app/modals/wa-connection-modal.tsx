'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { X, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Smartphone, QrCode } from 'lucide-react'

export function WaConnectionModal() {
  const { waConnected, setWaConnected } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'disconnected' | 'pairing' | 'connected'>(
    waConnected ? 'connected' : 'disconnected'
  )
  const [pairingProgress, setPairingProgress] = useState(0)

  const startPairing = () => {
    setStep('pairing')
    setPairingProgress(0)
    
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 20
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setWaConnected(true)
        setStep('connected')
      }
      setPairingProgress(p)
    }, 500)
  }

  const disconnect = () => {
    setWaConnected(false)
    setStep('disconnected')
  }

  return (
    <>
      {/* Connection Status Button - shown in header area */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
          waConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${waConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-400'}`} />
        {waConnected ? 'Connected' : 'Offline'}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center"
            onClick={() => setIsOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-t-3xl bg-[#0d0d14] border-t border-white/10 p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />

              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              {/* Disconnected State */}
              {step === 'disconnected' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <WifiOff className="w-10 h-10 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">WhatsApp Disconnected</h3>
                    <p className="text-sm text-white/40 mt-1">Connect your WhatsApp Business account to start using automation features</p>
                  </div>
                  <button
                    onClick={startPairing}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
                    style={{ boxShadow: '0 0 25px rgba(34,197,94,0.3)' }}
                  >
                    <Smartphone className="w-4 h-4" /> Pair Device
                  </button>
                </div>
              )}

              {/* Pairing State */}
              {step === 'pairing' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto relative">
                    <QrCode className="w-10 h-10 text-blue-400" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute -top-1 -right-1"
                    >
                      <RefreshCw className="w-4 h-4 text-neon-blue" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">Pairing Device</h3>
                    <p className="text-sm text-white/40 mt-1">Open WhatsApp &gt; Linked Devices &gt; Link a device</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Establishing connection...</span>
                      <span>{Math.round(pairingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                        animate={{ width: `${pairingProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Connected State */}
              {step === 'connected' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">WhatsApp Connected</h3>
                    <p className="text-sm text-white/40 mt-1">Your Business API is active and ready to send messages</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Phone Number</span>
                      <span className="text-white/80 font-semibold">+1 (555) 123-4567</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Business Name</span>
                      <span className="text-white/80 font-semibold">EAJE Enterprise</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">API Tier</span>
                      <span className="text-emerald-400 font-semibold">Pro</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Daily Limit</span>
                      <span className="text-white/80 font-semibold">10,000 messages</span>
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/15 font-bold text-sm hover:bg-red-500/15 transition-colors"
                  >
                    <WifiOff className="w-4 h-4" /> Disconnect
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

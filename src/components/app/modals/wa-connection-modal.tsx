'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { X, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Smartphone, QrCode, Phone, Copy, Loader2 } from 'lucide-react'

type Step = 'disconnected' | 'loading' | 'qr' | 'pairing-code' | 'connected'

export function WaConnectionModal() {
  const { waConnected, setWaConnected } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>(waConnected ? 'connected' : 'disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  // Poll WhatsApp status when modal is open
  useEffect(() => {
    if (!isOpen) return
    
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setWaConnected(true)
            setStep('connected')
          } else if (data.status === 'qr' && data.qr) {
            setQrCode(data.qr)
            if (step === 'loading' || step === 'disconnected') setStep('qr')
          }
        }
      } catch {}
    }

    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, close, setWaConnected, step])

  const startSession = async () => {
    setIsLoading(true)
    setError(null)
    setStep('loading')
    
    try {
      // Start the WhatsApp session
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      const data = await res.json()
      
      if (data.status === 'authenticated') {
        setWaConnected(true)
        setStep('connected')
      } else if (data.status === 'qr') {
        // Fetch the QR code
        const qrRes = await fetch('/api/whatsapp')
        const qrData = await qrRes.json()
        if (qrData.qr) {
          setQrCode(qrData.qr)
          setStep('qr')
        }
      }
    } catch {
      setError('Failed to start session. Make sure the WhatsApp service is running.')
      setStep('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const requestPairingCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number with country code (e.g., 2348012345678)')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pairing-code', phoneNumber: phoneNumber.replace(/\D/g, '') })
      })
      const data = await res.json()
      
      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode)
        setStep('pairing-code')
      } else {
        setError(data.error || 'Failed to get pairing code')
      }
    } catch {
      setError('Failed to request pairing code')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      })
    } catch {}
    setWaConnected(false)
    setStep('disconnected')
    setQrCode(null)
    setPairingCode(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Connection Status Button */}
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
            onClick={close}
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
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Disconnected State */}
              {step === 'disconnected' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                    <WifiOff className="w-10 h-10 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">WhatsApp Disconnected</h3>
                    <p className="text-sm text-white/40 mt-1">Connect your WhatsApp to start using automation features</p>
                  </div>
                  <button
                    onClick={startSession}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ boxShadow: '0 0 25px rgba(34,197,94,0.3)' }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                    {isLoading ? 'Starting...' : 'Connect WhatsApp'}
                  </button>
                </div>
              )}

              {/* Loading State */}
              {step === 'loading' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">Connecting...</h3>
                    <p className="text-sm text-white/40 mt-1">Starting WhatsApp service and generating QR code</p>
                  </div>
                </div>
              )}

              {/* QR Code State */}
              {step === 'qr' && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                    <QrCode className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">Scan QR Code</h3>
                    <p className="text-sm text-white/40 mt-1">Open WhatsApp → Linked Devices → Link a device</p>
                  </div>

                  {/* QR Code Display */}
                  {qrCode && (
                    <div className="bg-white rounded-2xl p-4 mx-auto w-fit">
                      <canvas id="qr-canvas" ref={(el) => {
                        if (el && qrCode) {
                          import('qrcode').then(QRCode => {
                            QRCode.toCanvas(el, qrCode, { width: 200, margin: 1 })
                          })
                        }
                      }} />
                    </div>
                  )}

                  <p className="text-[10px] text-white/25">QR code refreshes automatically. Waiting for scan...</p>

                  {/* Pairing Code Alternative */}
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-xs text-white/30 mb-3">Or use a pairing code instead:</p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Country code + number (e.g. 2348012345678)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/30"
                      />
                      <button
                        onClick={requestPairingCode}
                        disabled={isLoading || !phoneNumber}
                        className="px-4 py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/25 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pairing Code State */}
              {step === 'pairing-code' && pairingCode && (
                <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                    <Smartphone className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/95">Enter Pairing Code</h3>
                    <p className="text-sm text-white/40 mt-1">Enter this code on your WhatsApp to link your device</p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {pairingCode.split('').map((char, i) => (
                      <div key={i} className="w-10 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold text-white/90">
                        {char}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => copyToClipboard(pairingCode)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>

                  <p className="text-[10px] text-white/25">Waiting for device to link...</p>
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
                    <p className="text-sm text-white/40 mt-1">Your WhatsApp is active and ready to send messages</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Status</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Service</span>
                      <span className="text-white/80 font-semibold">Baileys WhatsApp Web</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Features</span>
                      <span className="text-white/80 font-semibold">Send, Groups, Validation</span>
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

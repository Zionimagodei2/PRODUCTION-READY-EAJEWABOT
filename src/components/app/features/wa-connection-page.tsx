'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from '@/lib/framer-shim'
import { useAppStore } from '@/store/app-store'
import { ArrowLeft, Wifi, WifiOff, CheckCircle2, AlertCircle, Smartphone, QrCode, Phone, Copy, Loader2, RefreshCw } from 'lucide-react'

type Step = 'disconnected' | 'loading' | 'qr' | 'pairing-code' | 'connected' | 'error'

const CONNECTION_TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 3_000
const MAX_POLL_ATTEMPTS = 20
const MAX_CONSECUTIVE_ERRORS = 3

export function WaConnectionPage() {
  const { waConnected, setWaConnected, goBack } = useAppStore()
  const [step, setStep] = useState<Step>(waConnected ? 'connected' : 'disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const pollCountRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  const cleanup = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (connectionTimerRef.current) { clearTimeout(connectionTimerRef.current); connectionTimerRef.current = null }
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null }
    pollCountRef.current = 0
    consecutiveErrorsRef.current = 0
  }, [])

  const handleError = useCallback((message: string) => {
    if (!isMountedRef.current) return
    setError(message)
    setStep('error')
    setIsLoading(false)
    cleanup()
  }, [cleanup])

  // Poll WhatsApp status
  useEffect(() => {
    pollCountRef.current = 0
    consecutiveErrorsRef.current = 0

    const checkStatus = async () => {
      if (!isMountedRef.current) return
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        handleError('Connection timed out. Please try again.')
        return
      }
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        handleError('Lost connection to WhatsApp service. Please try again.')
        return
      }

      abortControllerRef.current = new AbortController()
      const { signal } = abortControllerRef.current

      try {
        const res = await fetch('/api/whatsapp', { signal })
        if (!isMountedRef.current || signal.aborted) return
        if (res.ok) {
          const data = await res.json()
          if (!isMountedRef.current || signal.aborted) return
          consecutiveErrorsRef.current = 0

          if (data.authenticated) {
            setWaConnected(true)
            setStep('connected')
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
            if (connectionTimerRef.current) { clearTimeout(connectionTimerRef.current); connectionTimerRef.current = null }
          } else if (data.status === 'qr' && data.qr) {
            setQrCode(data.qr)
            setStep((prev) => (prev === 'loading' || prev === 'disconnected' || prev === 'error') ? 'qr' : prev)
          }
        } else {
          consecutiveErrorsRef.current++
        }
      } catch (err) {
        if (!isMountedRef.current) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        consecutiveErrorsRef.current++
      }
      pollCountRef.current++
    }

    checkStatus()
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)
    connectionTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return
      setStep((currentStep) => {
        if (currentStep !== 'connected') { handleError('Connection timed out. Please try again.'); return 'error' }
        return currentStep
      })
    }, CONNECTION_TIMEOUT_MS)

    return () => { cleanup() }
  }, [setWaConnected, handleError, cleanup])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const startSession = async () => {
    setIsLoading(true)
    setError(null)
    setStep('loading')
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
        signal: controller.signal
      })
      const data = await res.json()

      if (data.error && !data.status) {
        setError(data.error || 'Failed to start session.')
        setStep('error')
        setIsLoading(false)
        return
      }

      if (data.status === 'authenticated') {
        setWaConnected(true)
        setStep('connected')
      } else if (data.status === 'qr') {
        const qrController = new AbortController()
        abortControllerRef.current = qrController
        const qrRes = await fetch('/api/whatsapp', { signal: qrController.signal })
        const qrData = await qrRes.json()
        if (qrData.qr) { setQrCode(qrData.qr); setStep('qr') }
        else if (qrData.error) { setError(qrData.error); setStep('error') }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Failed to start session. Make sure the WhatsApp service is running.')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const requestPairingCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number with country code')
      return
    }
    setIsLoading(true)
    setError(null)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pairing-code', phoneNumber: phoneNumber.replace(/\D/g, '') }),
        signal: controller.signal
      })
      const data = await res.json()
      if (data.success && data.pairingCode) { setPairingCode(data.pairingCode); setStep('pairing-code') }
      else { setError(data.error || 'Failed to get pairing code.') }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Failed to request pairing code.')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try { await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }) } catch {}
    setWaConnected(false)
    setStep('disconnected')
    setQrCode(null)
    setPairingCode(null)
    setError(null)
  }

  const retry = () => {
    setError(null)
    setStep('disconnected')
    setQrCode(null)
    setPairingCode(null)
    pollCountRef.current = 0
    consecutiveErrorsRef.current = 0
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white/95 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-400" />
            WhatsApp Connection
          </h1>
          <p className="text-[11px] text-white/40">Manage your WhatsApp link</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`glass-card rounded-2xl p-4 border ${
        waConnected ? 'border-emerald-500/20' : step === 'error' ? 'border-red-500/20' : 'border-amber-500/15'
      }`} style={{
        background: waConnected
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))'
          : step === 'error'
          ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.01))'
      }}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            waConnected ? 'bg-emerald-500/15' : step === 'error' ? 'bg-red-500/15' : 'bg-amber-500/10'
          }`}>
            {waConnected ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> 
             : step === 'error' ? <AlertCircle className="w-6 h-6 text-red-400" />
             : isLoading ? <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
             : <WifiOff className="w-6 h-6 text-amber-400" />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white/90">
              {waConnected ? 'Connected & Active' 
               : step === 'error' ? 'Connection Failed' 
               : isLoading ? 'Connecting...'
               : 'Not Connected'}
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {waConnected ? 'Your WhatsApp is ready for automation'
               : step === 'error' ? error || 'Something went wrong'
               : isLoading ? 'Starting WhatsApp service...'
               : 'Connect to start using automation features'}
            </p>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${waConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
      </div>

      {/* Error Display */}
      {error && step !== 'error' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Disconnected State */}
      {step === 'disconnected' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <Wifi className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white/95">Connect WhatsApp</h3>
              <p className="text-xs text-white/40 mt-1">Link your WhatsApp Business to start sending messages and automations</p>
            </div>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {isLoading ? 'Starting...' : 'Connect WhatsApp'}
            </button>
          </div>

          {/* Pairing Code Alternative */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">Pairing Code Method</h4>
            </div>
            <p className="text-[11px] text-white/35">Enter your phone number to receive a pairing code instead of scanning QR</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234 801 234 5678"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/30"
              />
              <button
                onClick={requestPairingCode}
                disabled={isLoading || !phoneNumber}
                className="px-4 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {step === 'error' && (
        <div className="glass-card rounded-2xl p-5 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white/95">Connection Failed</h3>
            <p className="text-xs text-white/40 mt-1">Something went wrong while connecting to WhatsApp</p>
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={retry}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 border border-white/10 font-bold text-sm hover:bg-white/10 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {step === 'loading' && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white/95">Connecting...</h3>
            <p className="text-xs text-white/40 mt-1">Starting WhatsApp service and generating QR code</p>
          </div>
        </div>
      )}

      {/* QR Code State */}
      {step === 'qr' && (
        <div className="glass-card rounded-2xl p-5 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <QrCode className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white/95">Scan QR Code</h3>
            <p className="text-xs text-white/40 mt-1">Open WhatsApp → Linked Devices → Link a device</p>
          </div>

          {qrCode && (
            <div className="bg-white rounded-2xl p-4 mx-auto w-fit">
              <canvas id="qr-canvas" ref={(el) => {
                if (el && qrCode) {
                  import('qrcode').then(QRCode => {
                    QRCode.toCanvas(el, qrCode, { width: 200, margin: 1 })
                  }).catch(() => {})
                }
              }} />
            </div>
          )}

          <p className="text-[10px] text-white/25">QR code refreshes automatically. Waiting for scan...</p>

          <div className="border-t border-white/5 pt-4">
            <p className="text-[11px] text-white/30 mb-2">Or use a pairing code instead:</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+234 801 234 5678"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/30"
              />
              <button
                onClick={requestPairingCode}
                disabled={isLoading || !phoneNumber}
                className="px-4 py-2 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/25 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pairing Code State */}
      {step === 'pairing-code' && pairingCode && (
        <div className="glass-card rounded-2xl p-5 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Smartphone className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white/95">Enter Pairing Code</h3>
            <p className="text-xs text-white/40 mt-1">Enter this code on your WhatsApp to link your device</p>
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
        </div>
      )}

      {/* Connected State */}
      {step === 'connected' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white/95">WhatsApp Connected</h3>
              <p className="text-xs text-white/40 mt-1">Your WhatsApp is active and ready to send messages</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-left space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/15 font-bold text-sm hover:bg-red-500/15 transition-colors"
            >
              <WifiOff className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

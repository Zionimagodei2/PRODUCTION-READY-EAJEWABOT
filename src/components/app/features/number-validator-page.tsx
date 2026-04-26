'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import {
  ArrowLeft, ShieldCheck, CheckCircle2, XCircle, Clipboard,
  Trash2, Download, Loader2, AlertTriangle, Phone, Globe, Signal,
  Upload, Search, Send, Clock, History, FileText, Zap,
  ChevronDown, ChevronUp, Filter
} from 'lucide-react'

interface ValidationResult {
  number: string
  valid: boolean
  reason?: string
  country?: string
  flag?: string
  format?: string
  hasWhatsApp?: boolean
  risk?: 'high' | 'medium' | 'low'
  carrier?: string
}

interface ValidationSummary {
  total: number
  valid: number
  invalid: number
  withWhatsApp: number
}

interface ValidationSession {
  id: string
  date: string
  total: number
  validCount: number
  results: ValidationResult[]
}

type ViewMode = 'batch' | 'single'

export function NumberValidatorPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [viewMode, setViewMode] = useState<ViewMode>('batch')
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deepScan, setDeepScan] = useState(false)
  const [summary, setSummary] = useState<ValidationSummary | null>(null)

  // Single number check
  const [singleInput, setSingleInput] = useState('')
  const [singleResult, setSingleResult] = useState<ValidationResult | null>(null)
  const [isCheckingSingle, setIsCheckingSingle] = useState(false)

  // Filter
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'whatsapp'>('all')

  // History
  const [history, setHistory] = useState<ValidationSession[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validCount = results.filter((r) => r.valid).length
  const invalidCount = results.filter((r) => !r.valid).length
  const whatsappCount = results.filter((r) => r.hasWhatsApp).length
  const totalCount = results.length

  const filteredResults = results.filter((r) => {
    if (filter === 'valid') return r.valid
    if (filter === 'invalid') return !r.valid
    if (filter === 'whatsapp') return r.hasWhatsApp === true
    return true
  })

  const addToHistory = useCallback((sessionResults: ValidationResult[]) => {
    const session: ValidationSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: sessionResults.length,
      validCount: sessionResults.filter(r => r.valid).length,
      results: sessionResults,
    }
    setHistory(prev => [session, ...prev].slice(0, 5))
  }, [])

  const handleValidate = useCallback(async () => {
    const numbers = input
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (numbers.length === 0) {
      addToast({ type: 'warning', title: 'No numbers', message: 'Please enter at least one phone number' })
      return
    }

    setIsValidating(true)
    setProgress(0)
    setResults([])
    setSummary(null)

    // Simulate progress while waiting for API
    let current = 0
    const progressInterval = setInterval(() => {
      current = Math.min(current + Math.random() * 15, 90)
      setProgress(Math.round(current))
    }, 200)

    try {
      const response = await fetch('/api/validate-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers, deepScan }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Validation request failed')
      }

      const data = await response.json()
      setResults(data.results)
      setSummary(data.summary || null)
      addToHistory(data.results)
      setIsValidating(false)

      const vCount = data.results.filter((r: ValidationResult) => r.valid).length
      const iCount = data.results.filter((r: ValidationResult) => !r.valid).length
      addToast({
        type: 'success',
        title: 'Validation Complete',
        message: `${vCount} valid, ${iCount} invalid`,
      })
    } catch (error) {
      clearInterval(progressInterval)
      setIsValidating(false)
      setProgress(0)
      addToast({
        type: 'error',
        title: 'Validation Failed',
        message: error instanceof Error ? error.message : 'Could not validate numbers',
      })
    }
  }, [input, deepScan, addToast, addToHistory])

  const handleSingleCheck = useCallback(async () => {
    const trimmed = singleInput.trim()
    if (!trimmed) {
      addToast({ type: 'warning', title: 'No number', message: 'Please enter a phone number' })
      return
    }

    setIsCheckingSingle(true)
    setSingleResult(null)

    try {
      const response = await fetch('/api/validate-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: [trimmed], deepScan: true }),
      })

      if (!response.ok) {
        throw new Error('Validation failed')
      }

      const data = await response.json()
      if (data.results && data.results.length > 0) {
        setSingleResult(data.results[0])
      }
    } catch {
      addToast({ type: 'error', title: 'Check Failed', message: 'Could not validate number' })
    } finally {
      setIsCheckingSingle(false)
    }
  }, [singleInput, addToast])

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
      addToast({ type: 'success', title: 'Pasted', message: 'Content pasted from clipboard' })
    } catch {
      addToast({ type: 'error', title: 'Paste Failed', message: 'Could not access clipboard' })
    }
  }, [addToast])

  const handleClearAll = useCallback(() => {
    setInput('')
    setResults([])
    setProgress(0)
    setSummary(null)
    setFilter('all')
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      addToast({ type: 'error', title: 'Invalid File', message: 'Please upload a CSV or TXT file' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (file.name.endsWith('.csv')) {
        // Parse CSV - extract first column or any column that looks like phone numbers
        const lines = text.split('\n').filter(l => l.trim())
        const numbers: string[] = []
        for (const line of lines) {
          const columns = line.split(',').map(c => c.trim().replace(/"/g, ''))
          for (const col of columns) {
            if (/^[\+]?[\d\s\-\(\)]{7,}$/.test(col)) {
              numbers.push(col)
              break
            }
          }
        }
        setInput(numbers.join('\n'))
        addToast({ type: 'success', title: 'File Loaded', message: `${numbers.length} numbers found in file` })
      } else {
        setInput(text)
        const count = text.split('\n').filter(l => l.trim()).length
        addToast({ type: 'success', title: 'File Loaded', message: `${count} lines loaded` })
      }
    }
    reader.readAsText(file)
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [addToast])

  const handleExport = useCallback(
    (type: 'valid' | 'invalid' | 'all') => {
      let filtered: ValidationResult[]
      let filename: string

      if (type === 'valid') {
        filtered = results.filter((r) => r.valid)
        filename = 'valid-numbers'
      } else if (type === 'invalid') {
        filtered = results.filter((r) => !r.valid)
        filename = 'invalid-numbers'
      } else {
        filtered = results
        filename = 'all-numbers'
      }

      if (filtered.length === 0) {
        addToast({ type: 'warning', title: 'No data', message: `No ${type} numbers to export` })
        return
      }

      const headers = 'Number,Valid,Country,Format,WhatsApp,Risk,Carrier'
      const rows = filtered.map((r) =>
        `"${r.number}","${r.valid ? 'Yes' : 'No'}","${r.country || ''}","${r.format || ''}","${r.hasWhatsApp ? 'Yes' : 'No'}","${r.risk || ''}","${r.carrier || ''}"`
      )
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ type: 'success', title: 'Exported', message: `${filtered.length} numbers exported` })
    },
    [results, addToast]
  )

  const handleSendMessage = useCallback((number: string) => {
    // Navigate to send-message feature with number pre-filled
    addToast({ type: 'info', title: 'Compose Message', message: `Opening message composer for ${number}` })
  }, [addToast])

  const handleLoadHistory = useCallback((session: ValidationSession) => {
    setResults(session.results)
    setSummary({
      total: session.total,
      valid: session.validCount,
      invalid: session.total - session.validCount,
      withWhatsApp: session.results.filter(r => r.hasWhatsApp).length,
    })
    setShowHistory(false)
    addToast({ type: 'info', title: 'History Loaded', message: `${session.total} results from ${new Date(session.date).toLocaleString()}` })
  }, [addToast])

  const riskBadgeColor = (risk?: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/15 text-green-400 border-green-500/20'
      case 'medium': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
      case 'high': return 'bg-red-500/15 text-red-400 border-red-500/20'
      default: return 'bg-white/5 text-white/30 border-white/10'
    }
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white/95 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-neon-green neon-text-glow-green" />
            Number Validator
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Verify phone number formats & WhatsApp availability</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        {(['batch', 'single'] as ViewMode[]).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setViewMode(mode)}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === mode
                ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
            }`}
          >
            {mode === 'batch' ? <FileText className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            {mode === 'batch' ? 'Batch Validate' : 'Single Check'}
          </motion.button>
        ))}
      </div>

      {/* Batch Validation Mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'batch' && (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Input Area */}
            <div className="glass-card rounded-2xl p-4 neon-glow-green space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Phone Numbers
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">One per line</span>
                  {/* Deep Scan Toggle */}
                  <button
                    onClick={() => setDeepScan(!deepScan)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                      deepScan 
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' 
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                  >
                    <Zap className="w-2.5 h-2.5" /> Deep Scan
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"+1 234 567 8901\n+44 7911 123456\n+86 138 0013 8000"}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-green/40 transition-colors resize-none font-mono"
              />

              {/* Action Buttons Row */}
              <div className="flex gap-2">
                <motion.button
                  onClick={handlePasteFromClipboard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Paste
                </motion.button>
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload CSV
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.button
                  onClick={handleClearAll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </motion.button>
                <motion.button
                  onClick={handleValidate}
                  disabled={isValidating}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-xs text-green-300 font-semibold hover:from-green-500/30 hover:to-emerald-500/30 transition-all disabled:opacity-50"
                  style={{ boxShadow: '0 0 16px rgba(34,197,94,0.15)' }}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Validating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Validate
                    </>
                  )}
                </motion.button>
              </div>

              {/* Progress Bar */}
              {isValidating && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">Validating numbers...</span>
                    <span className="text-[10px] text-neon-green font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Single Number Check Mode */}
        {viewMode === 'single' && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 neon-glow-green space-y-3">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Single Number Check
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="tel"
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSingleCheck()}
                    placeholder="+1 234 567 8901"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-neon-green/40 transition-colors font-mono"
                  />
                </div>
                <motion.button
                  onClick={handleSingleCheck}
                  disabled={isCheckingSingle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 font-semibold hover:from-green-500/30 hover:to-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {isCheckingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>

            {/* Single Result Card */}
            <AnimatePresence>
              {singleResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className={`glass-card rounded-2xl p-5 space-y-4 ${
                    singleResult.valid ? 'neon-glow-green' : 'border-red-500/20'
                  }`}
                >
                  {/* Number & Status */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      singleResult.valid
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      {singleResult.valid ? (
                        <CheckCircle2 className="w-7 h-7 text-green-400" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {singleResult.flag && <span className="text-xl">{singleResult.flag}</span>}
                        <span className="text-lg font-bold text-white/95 font-mono">{singleResult.number}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                        singleResult.valid
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      }`}>
                        {singleResult.valid ? '✓ VALID' : '✗ INVALID'}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {singleResult.country && (
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Country</p>
                        <p className="text-xs font-semibold text-white/80 mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-cyan-400" /> {singleResult.country}
                        </p>
                      </div>
                    )}
                    {singleResult.format && (
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Format</p>
                        <p className="text-xs font-semibold text-white/80 mt-0.5 flex items-center gap-1">
                          <Signal className="w-3 h-3 text-blue-400" /> {singleResult.format}
                        </p>
                      </div>
                    )}
                    {singleResult.hasWhatsApp !== undefined && (
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">WhatsApp</p>
                        <p className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${singleResult.hasWhatsApp ? 'text-green-400' : 'text-white/40'}`}>
                          <Phone className="w-3 h-3" /> {singleResult.hasWhatsApp ? 'Likely Active' : 'Unknown'}
                        </p>
                      </div>
                    )}
                    {singleResult.risk && (
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Risk Level</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5 border ${riskBadgeColor(singleResult.risk)}`}>
                          {singleResult.risk.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {singleResult.carrier && (
                      <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] col-span-2">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Carrier</p>
                        <p className="text-xs font-semibold text-white/80 mt-0.5">{singleResult.carrier}</p>
                      </div>
                    )}
                  </div>

                  {/* Invalid Reason */}
                  {!singleResult.valid && singleResult.reason && (
                    <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-xs text-red-400/80">{singleResult.reason}</p>
                    </div>
                  )}

                  {/* Send Message Button */}
                  {singleResult.valid && (
                    <motion.button
                      onClick={() => handleSendMessage(singleResult.number)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-500/25 text-xs text-green-300 font-semibold hover:from-green-500/25 hover:to-emerald-500/25 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Message to This Number
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <AnimatePresence>
        {(results.length > 0 || (summary && summary.total > 0)) && viewMode === 'batch' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-4 gap-2"
          >
            <div className="glass-card rounded-xl p-2.5 text-center stat-card-blue">
              <Phone className="w-3.5 h-3.5 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-extrabold text-neon-blue">{totalCount}</p>
              <p className="text-[9px] text-white/50 font-semibold">Total</p>
            </div>
            <div className="glass-card rounded-xl p-2.5 text-center stat-card-green">
              <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-green-400 mb-1" />
              <p className="text-lg font-extrabold text-neon-green">{validCount}</p>
              <p className="text-[9px] text-white/50 font-semibold">Valid</p>
            </div>
            <div className="glass-card rounded-xl p-2.5 text-center stat-card-red">
              <XCircle className="w-3.5 h-3.5 mx-auto text-red-400 mb-1" />
              <p className="text-lg font-extrabold text-red-400">{invalidCount}</p>
              <p className="text-[9px] text-white/50 font-semibold">Invalid</p>
            </div>
            <div className="glass-card rounded-xl p-2.5 text-center" style={{ boxShadow: deepScan ? '0 0 20px rgba(6,182,212,0.1)' : 'none' }}>
              <Phone className="w-3.5 h-3.5 mx-auto text-cyan-400 mb-1" />
              <p className="text-lg font-extrabold text-cyan-400">{whatsappCount}</p>
              <p className="text-[9px] text-white/50 font-semibold">WhatsApp</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Export Buttons */}
      <AnimatePresence>
        {results.length > 0 && viewMode === 'batch' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {/* Filter Row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-3 h-3 text-white/30 flex-shrink-0" />
              {(['all', 'valid', 'invalid', 'whatsapp'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all ${
                    filter === f
                      ? f === 'valid' ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                        : f === 'invalid' ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                        : f === 'whatsapp' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                        : 'bg-white/10 text-white/70 border border-white/20'
                      : 'bg-white/5 text-white/30 border border-white/10'
                  }`}
                >
                  {f === 'all' ? `All (${totalCount})`
                    : f === 'valid' ? `Valid (${validCount})`
                    : f === 'invalid' ? `Invalid (${invalidCount})`
                    : `WhatsApp (${whatsappCount})`
                  }
                </button>
              ))}
            </div>

            {/* Export Row */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => handleExport('valid')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[10px] text-green-300 font-semibold hover:bg-green-500/20 transition-colors"
              >
                <Download className="w-3 h-3" /> Valid ({validCount})
              </motion.button>
              <motion.button
                onClick={() => handleExport('invalid')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300 font-semibold hover:bg-red-500/20 transition-colors"
              >
                <Download className="w-3 h-3" /> Invalid ({invalidCount})
              </motion.button>
              <motion.button
                onClick={() => handleExport('all')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/50 font-semibold hover:bg-white/10 transition-colors"
              >
                <Download className="w-3 h-3" /> All ({totalCount})
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      <AnimatePresence>
        {results.length > 0 && viewMode === 'batch' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
              Results {filter !== 'all' && `(${filter})`} — {filteredResults.length} shown
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
              {filteredResults.map((result, i) => (
                <motion.div
                  key={`${result.number}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className={`glass-card rounded-xl p-2.5 flex items-center gap-2.5 ${
                    result.valid
                      ? 'border-green-500/10 hover:border-green-500/20'
                      : 'border-red-500/10 hover:border-red-500/20'
                  } transition-colors`}
                >
                  {/* Status Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.valid
                        ? 'bg-green-500/10 border border-green-500/15'
                        : 'bg-red-500/10 border border-red-500/15'
                    }`}
                  >
                    {result.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>

                  {/* Number & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {result.flag && <span className="text-xs">{result.flag}</span>}
                      <span className="text-[11px] font-semibold text-white/90 font-mono truncate">
                        {result.number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {result.valid ? (
                        <>
                          {result.country && (
                            <span className="text-[9px] text-green-400/50 flex items-center gap-0.5">
                              <Globe className="w-2 h-2" /> {result.country}
                            </span>
                          )}
                          {result.format && (
                            <span className="text-[9px] text-blue-400/50">{result.format}</span>
                          )}
                          {result.hasWhatsApp && (
                            <span className="text-[9px] text-cyan-400/60 flex items-center gap-0.5">
                              <Phone className="w-2 h-2" /> WA
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-red-400/50 flex items-center gap-0.5">
                          <AlertTriangle className="w-2 h-2" /> {result.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {result.risk && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${riskBadgeColor(result.risk)}`}>
                        {result.risk.toUpperCase()}
                      </span>
                    )}
                    {result.valid && (
                      <motion.button
                        onClick={() => handleSendMessage(result.number)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/15 flex items-center justify-center text-green-400 hover:bg-green-500/20 transition-colors"
                      >
                        <Send className="w-2.5 h-2.5" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center gap-2 mb-2 px-1"
        >
          <History className="w-3 h-3 text-white/30" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Validation History</span>
          <div className="flex-1 gradient-divider" />
          {showHistory ? (
            <ChevronUp className="w-3 h-3 text-white/20" />
          ) : (
            <ChevronDown className="w-3 h-3 text-white/20" />
          )}
        </button>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {history.length === 0 ? (
                <div className="glass-card rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-white/15 mx-auto mb-2" />
                  <p className="text-[10px] text-white/30">No validation history yet</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {history.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => handleLoadHistory(session)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 flex-shrink-0">
                        <History className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white/80">
                          {session.total} numbers validated
                        </p>
                        <p className="text-[9px] text-white/30">
                          {new Date(session.date).toLocaleString()} • {session.validCount} valid
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/15">
                          {session.validCount}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/15">
                          {session.total - session.validCount}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

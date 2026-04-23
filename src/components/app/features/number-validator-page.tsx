'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import {
  ArrowLeft, ShieldCheck, CheckCircle2, XCircle, Clipboard,
  Trash2, Download, Loader2, AlertTriangle, Phone, Globe, Signal
} from 'lucide-react'

interface ValidationResult {
  number: string
  valid: boolean
  reason?: string
  country?: string
  flag?: string
  carrier?: string
}

const countryFlags: Record<string, { flag: string; name: string }> = {
  '+1': { flag: '🇺🇸', name: 'United States' },
  '+44': { flag: '🇬🇧', name: 'United Kingdom' },
  '+86': { flag: '🇨🇳', name: 'China' },
  '+34': { flag: '🇪🇸', name: 'Spain' },
  '+852': { flag: '🇭🇰', name: 'Hong Kong' },
  '+61': { flag: '🇦🇺', name: 'Australia' },
  '+49': { flag: '🇩🇪', name: 'Germany' },
  '+55': { flag: '🇧🇷', name: 'Brazil' },
  '+91': { flag: '🇮🇳', name: 'India' },
  '+81': { flag: '🇯🇵', name: 'Japan' },
  '+33': { flag: '🇫🇷', name: 'France' },
  '+39': { flag: '🇮🇹', name: 'Italy' },
  '+7': { flag: '🇷🇺', name: 'Russia' },
  '+82': { flag: '🇰🇷', name: 'South Korea' },
  '+52': { flag: '🇲🇽', name: 'Mexico' },
  '+234': { flag: '🇳🇬', name: 'Nigeria' },
  '+27': { flag: '🇿🇦', name: 'South Africa' },
  '+971': { flag: '🇦🇪', name: 'UAE' },
}

const carriers = ['WhatsApp', 'Viber', 'Telegram', 'WeChat', 'LINE', 'KakaoTalk', 'Signal', 'iMessage']

const invalidReasons = [
  'Invalid format',
  'Number does not exist',
  'Not registered on WhatsApp',
  'Country code not supported',
  'Number blocked',
  'Landline number detected',
]

function getCountryInfo(phone: string) {
  const sortedCodes = Object.keys(countryFlags).sort((a, b) => b.length - a.length)
  for (const code of sortedCodes) {
    if (phone.startsWith(code)) {
      return countryFlags[code]
    }
  }
  return { flag: '🌍', name: 'Unknown' }
}

function mockValidate(numbers: string[]): ValidationResult[] {
  return numbers.map((num) => {
    const trimmed = num.trim()
    const isValid = Math.random() < 0.7

    if (isValid) {
      const country = getCountryInfo(trimmed)
      const carrier = carriers[Math.floor(Math.random() * carriers.length)]
      return {
        number: trimmed,
        valid: true,
        country: country.name,
        flag: country.flag,
        carrier,
      }
    } else {
      const reason = invalidReasons[Math.floor(Math.random() * invalidReasons.length)]
      return {
        number: trimmed,
        valid: false,
        reason,
      }
    }
  })
}

export function NumberValidatorPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [progress, setProgress] = useState(0)

  const validCount = results.filter((r) => r.valid).length
  const invalidCount = results.filter((r) => !r.valid).length
  const totalCount = results.length

  const handleValidate = useCallback(() => {
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

    let current = 0
    const total = numbers.length
    const interval = setInterval(() => {
      current++
      setProgress(Math.round((current / total) * 100))

      if (current >= total) {
        clearInterval(interval)
        const validated = mockValidate(numbers)
        setResults(validated)
        setIsValidating(false)
        addToast({
          type: 'success',
          title: 'Validation Complete',
          message: `${validated.filter((r) => r.valid).length} valid, ${validated.filter((r) => !r.valid).length} invalid`,
        })
      }
    }, 150)
  }, [input, addToast])

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
  }, [])

  const handleExport = useCallback(
    (type: 'valid' | 'invalid') => {
      const filtered = results.filter((r) => (type === 'valid' ? r.valid : !r.valid))
      if (filtered.length === 0) {
        addToast({ type: 'warning', title: 'No data', message: `No ${type} numbers to export` })
        return
      }

      const headers = type === 'valid' ? 'Number,Country,Carrier,Valid' : 'Number,Reason,Valid'
      const rows = filtered.map((r) =>
        type === 'valid'
          ? `"${r.number}","${r.country || ''}","${r.carrier || ''}","Yes"`
          : `"${r.number}","${r.reason || ''}","No"`
      )
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-numbers-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ type: 'success', title: 'Exported', message: `${filtered.length} ${type} numbers exported` })
    },
    [results, addToast]
  )

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
          <p className="text-[10px] text-white/40 mt-0.5">Verify WhatsApp numbers before sending</p>
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 neon-glow-green space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Phone Numbers
          </label>
          <span className="text-[10px] text-white/30">One per line</span>
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
            onClick={handleClearAll}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
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
      </motion.div>

      {/* Stats Summary */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="glass-card rounded-xl p-3 text-center stat-card-green">
              <CheckCircle2 className="w-4 h-4 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-extrabold text-neon-green">{validCount}</p>
              <p className="text-[10px] text-white/50 font-semibold">Valid</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center stat-card-red">
              <XCircle className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <p className="text-xl font-extrabold text-red-400">{invalidCount}</p>
              <p className="text-[10px] text-white/50 font-semibold">Invalid</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center stat-card-blue">
              <Phone className="w-4 h-4 mx-auto text-blue-400 mb-1" />
              <p className="text-xl font-extrabold text-neon-blue">{totalCount}</p>
              <p className="text-[10px] text-white/50 font-semibold">Total</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Buttons */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <motion.button
              onClick={() => handleExport('valid')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 font-semibold hover:bg-green-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Valid ({validCount})
            </motion.button>
            <motion.button
              onClick={() => handleExport('invalid')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-semibold hover:bg-red-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Invalid ({invalidCount})
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">Results</h3>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {results.map((result, i) => (
                <motion.div
                  key={`${result.number}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`glass-card rounded-xl p-3 flex items-center gap-3 ${
                    result.valid
                      ? 'border-green-500/15 hover:border-green-500/25'
                      : 'border-red-500/15 hover:border-red-500/25'
                  } transition-colors`}
                >
                  {/* Status Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.valid
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {result.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>

                  {/* Number & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {result.valid && result.flag && (
                        <span className="text-sm">{result.flag}</span>
                      )}
                      <span className="text-xs font-semibold text-white/90 font-mono truncate">
                        {result.number}
                      </span>
                    </div>
                    {result.valid ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        {result.country && (
                          <span className="text-[10px] text-green-400/60 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" /> {result.country}
                          </span>
                        )}
                        {result.carrier && (
                          <span className="text-[10px] text-cyan-400/60 flex items-center gap-0.5">
                            <Signal className="w-2.5 h-2.5" /> {result.carrier}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-400/60 flex items-center gap-0.5 mt-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> {result.reason}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      result.valid
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-red-500/15 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {result.valid ? 'VALID' : 'INVALID'}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

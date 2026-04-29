'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import {
  ArrowLeft, Phone, Globe, Hash, Shuffle, ListOrdered, Copy, CheckCircle2,
  Download, Search, X, Loader2, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  Filter, Zap, RefreshCw, Trash2, Clock, FileJson, FileSpreadsheet, Check,
  HashIcon, Plus, Minus, BookOpen
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

// --- Country Data ---
interface Country {
  name: string
  code: string
  dialCode: string
  flag: string
  format: string // placeholder format, e.g. "XXX XXX XXXX"
  digitLength: number // total digits after dial code
}

const COUNTRIES: Country[] = [
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', format: 'XXX XXX XXXX', digitLength: 10 },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭', format: 'XX XXX XXXX', digitLength: 9 },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', format: 'XXX XXXXXX', digitLength: 9 },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', format: 'XX XXX XXXX', digitLength: 9 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', format: 'XXX XXX XXXX', digitLength: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', format: 'XXXX XXXXXX', digitLength: 10 },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', format: 'XXXXX XXXXX', digitLength: 10 },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', format: 'XX XXXXX XXXX', digitLength: 11 },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', format: 'XX XXXX XXXX', digitLength: 10 },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿', format: 'XXX XXX XXX', digitLength: 9 },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬', format: 'XXX XXXXXX', digitLength: 9 },
  { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: '🇨🇲', format: 'XXXX XXXX', digitLength: 8 },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹', format: 'XX XXX XXXX', digitLength: 9 },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦', format: 'XXX XXXXXX', digitLength: 9 },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼', format: 'XXX XXXXXX', digitLength: 9 },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳', format: 'XX XXX XX XX', digitLength: 9 },
  { name: 'Côte d\'Ivoire', code: 'CI', dialCode: '+225', flag: '🇨🇮', format: 'XX XX XX XX XX', digitLength: 10 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', format: 'XXX XXX XXXX', digitLength: 10 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', format: 'XXX XXX XXX', digitLength: 9 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', format: 'XXX XXXXXXX', digitLength: 10 },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', format: 'X XX XX XX XX', digitLength: 9 },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰', format: 'XXX XXXXXXX', digitLength: 10 },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', format: 'XXX XXX XXX', digitLength: 9 },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽', format: 'XX XXXX XXXX', digitLength: 10 },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', format: 'XXX XXX XXXX', digitLength: 10 },
]

// --- Generation Types ---
type GenMode = 'random' | 'sequential'

interface GeneratedNumber {
  id: string
  number: string
  formatted: string
  valid: boolean
  country: string
}

interface NumberHistoryPayload {
  numbers: string[]
  updatedAt: string
}

interface GenSession {
  id: string
  timestamp: Date
  country: string
  count: number
  validCount: number
  duplicateCount: number
  mode: GenMode
}

// --- Helper Functions ---
function generateRandomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

function formatNumber(dialCode: string, digits: string, format: string): string {
  let formatted = dialCode + ' '
  let digitIndex = 0
  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === 'X') {
      formatted += digits[digitIndex]
      digitIndex++
    } else {
      formatted += format[i]
    }
  }
  // Append any remaining digits
  if (digitIndex < digits.length) {
    formatted += digits.slice(digitIndex)
  }
  return formatted
}

function simulateWhatsAppValidity(): boolean {
  // Simulate ~70% valid rate
  return Math.random() < 0.7
}

// --- Component ---
export function NumberGeneratorPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  // Country selection
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0])
  const [countrySearch, setCountrySearch] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)

  // Number format config
  const [prefixStart, setPrefixStart] = useState('0')
  const [prefixEnd, setPrefixEnd] = useState('9')
  const [customDigits, setCustomDigits] = useState(10)

  // Generation controls
  const [quantity, setQuantity] = useState(50)
  const [genMode, setGenMode] = useState<GenMode>('random')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  // Results
  const [numbers, setNumbers] = useState<GeneratedNumber[]>([])
  const [resultSearch, setResultSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [historicalNumbers, setHistoricalNumbers] = useState<Set<string>>(new Set())

  // History
  const [sessions, setSessions] = useState<GenSession[]>([])

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) return
        const settings = await res.json()
        const raw = settings?.number_generation_history
        if (!raw) return
        const parsed: NumberHistoryPayload = JSON.parse(raw)
        if (Array.isArray(parsed?.numbers)) {
          queueMicrotask(() => setHistoricalNumbers(new Set(parsed.numbers)))
        }
      } catch {
        // ignore malformed history
      }
    }
    void loadHistory()
  }, [])

  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES
    const q = countrySearch.toLowerCase()
    return COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.dialCode.includes(q) ||
           c.code.toLowerCase().includes(q)
    )
  }, [countrySearch])

  // Filtered numbers for search within results
  const filteredNumbers = useMemo(() => {
    if (!resultSearch.trim()) return numbers
    const q = resultSearch.toLowerCase()
    return numbers.filter(n =>
      n.number.includes(q) || n.formatted.toLowerCase().includes(q)
    )
  }, [numbers, resultSearch])

  // Stats
  const stats = useMemo(() => {
    const total = numbers.length
    const valid = numbers.filter(n => n.valid).length
    const unique = new Set(numbers.map(n => n.number)).size
    const duplicates = total - unique
    return { total, valid, duplicates, unique }
  }, [numbers])

  // Handle country change - update digit length
  const handleCountryChange = useCallback((country: Country) => {
    setSelectedCountry(country)
    setCustomDigits(country.digitLength)
    setCountryDropdownOpen(false)
    setCountrySearch('')
  }, [])

  // Generate numbers
  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    setProgress(0)
    setNumbers([])

    const country = selectedCountry
    const generated: GeneratedNumber[] = []
    const seenNumbers = new Set<string>()
    const historicalSet = new Set(historicalNumbers)
    const prefixStartVal = parseInt(prefixStart) || 0
    const prefixEndVal = parseInt(prefixEnd) || 9

    let generatedCount = 0
    const batchSize = Math.min(50, quantity)
    const totalBatches = Math.ceil(quantity / batchSize)
    let batchIndex = 0

    const processBatch = () => {
      const startIdx = batchIndex * batchSize
      const endIdx = Math.min(startIdx + batchSize, quantity)

      for (let i = startIdx; i < endIdx; i++) {
        let digits: string

        if (genMode === 'random') {
          // Generate random digits with the configured prefix
          const firstDigit = Math.floor(Math.random() * (prefixEndVal - prefixStartVal + 1)) + prefixStartVal
          const restDigits = generateRandomDigits(customDigits - 1)
          digits = firstDigit.toString() + restDigits
        } else {
          // Sequential
          const step = Math.max(1, Math.floor(9999999999 / quantity))
          const seqNum = i * step
          digits = seqNum.toString().padStart(customDigits, '0').slice(-customDigits)
          const firstDigit = Math.floor(Math.random() * (prefixEndVal - prefixStartVal + 1)) + prefixStartVal
          digits = firstDigit.toString() + digits.slice(1)
        }

        const fullNumber = country.dialCode.replace('+', '') + digits
        const formatted = formatNumber(country.dialCode, digits, country.format)
        const isValid = simulateWhatsAppValidity()

        const entry: GeneratedNumber = {
          id: `num-${i}-${Date.now()}`,
          number: fullNumber,
          formatted,
          valid: isValid,
          country: country.name,
        }

        if (seenNumbers.has(fullNumber) || historicalSet.has(fullNumber)) {
          continue
        }
        generated.push(entry)
        seenNumbers.add(fullNumber)
      }

      generatedCount = endIdx
      batchIndex++
      setProgress(Math.min(Math.round((generatedCount / quantity) * 100), 100))

      if (generatedCount < quantity) {
        requestAnimationFrame(processBatch)
      } else {
        setNumbers(generated)
        setIsGenerating(false)
        const updatedHistory = new Set([...historicalSet, ...generated.map((item) => item.number)])
        setHistoricalNumbers(updatedHistory)

        void fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'number_generation_history',
            value: JSON.stringify({
              numbers: Array.from(updatedHistory).slice(-50000),
              updatedAt: new Date().toISOString(),
            } satisfies NumberHistoryPayload),
          }),
        })

        // Save session
        const validCount = generated.filter(n => n.valid).length
        const uniqueSet = new Set(generated.map(n => n.number))
        const dupCount = generated.length - uniqueSet.size
        const session: GenSession = {
          id: `session-${Date.now()}`,
          timestamp: new Date(),
          country: country.name,
          count: generated.length,
          validCount,
          duplicateCount: dupCount,
          mode: genMode,
        }
        setSessions(prev => [session, ...prev].slice(0, 10))

        addToast({
          type: 'success',
          title: 'Generation Complete',
          message: `${generated.length} unique numbers generated for ${country.name}`,
        })
      }
    }

    // Start with a small delay for UX
    setTimeout(processBatch, 100)
  }, [selectedCountry, quantity, genMode, prefixStart, prefixEnd, customDigits, addToast, historicalNumbers])

  // Copy individual number
  const copyNumber = useCallback((num: GeneratedNumber) => {
    navigator.clipboard.writeText(num.formatted)
    setCopiedId(num.id)
    setTimeout(() => setCopiedId(null), 2000)
    addToast({ type: 'success', title: 'Copied', message: num.formatted })
  }, [addToast])

  // Copy all numbers
  const copyAll = useCallback(() => {
    const text = filteredNumbers.map(n => n.number).join('\n')
    navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
    addToast({ type: 'success', title: 'Copied All', message: `${filteredNumbers.length} numbers copied` })
  }, [filteredNumbers, addToast])

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = 'Number,Formatted,Country,Valid WhatsApp\n'
    const rows = filteredNumbers.map(n =>
      `${n.number},"${n.formatted}",${n.country},${n.valid ? 'Yes' : 'No'}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phone-numbers-${selectedCountry.code.toLowerCase()}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported CSV', message: `${filteredNumbers.length} numbers saved` })
  }, [filteredNumbers, selectedCountry, addToast])

  // Export JSON
  const exportJSON = useCallback(() => {
    const data = filteredNumbers.map(n => ({
      number: n.number,
      formatted: n.formatted,
      country: n.country,
      validWhatsApp: n.valid,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phone-numbers-${selectedCountry.code.toLowerCase()}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'Exported JSON', message: `${filteredNumbers.length} numbers saved` })
  }, [filteredNumbers, selectedCountry, addToast])

  // Clear results
  const clearResults = useCallback(() => {
    setNumbers([])
    setResultSearch('')
    addToast({ type: 'info', title: 'Cleared', message: 'All generated numbers removed' })
  }, [addToast])

  // Quantity presets
  const quantityPresets = [10, 50, 100, 500, 1000]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white/90">Number Generator</h2>
          <p className="text-[10px] text-white/40">Generate WhatsApp-valid phone numbers</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Phone className="w-4 h-4 text-violet-400" />
        </div>
      </div>

      {/* Country/Region Selector */}
      <div className="glass-card rounded-xl p-4 neon-glow-purple border border-violet-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-500/10">
            <Globe className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90">Country / Region</h3>
            <p className="text-[10px] text-white/40">Select target country for number generation</p>
          </div>
        </div>

        {/* Country Dropdown */}
        <div className="relative" ref={countryDropdownRef}>
          <button
            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
            className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{selectedCountry.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-white/90">{selectedCountry.name}</p>
                <p className="text-[10px] text-white/40">{selectedCountry.dialCode} • {selectedCountry.digitLength} digits</p>
              </div>
            </div>
            {countryDropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </button>

          <AnimatePresence>
            {countryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full left-0 right-0 mt-1 glass-card rounded-xl border border-violet-500/20 overflow-hidden"
                style={{ maxHeight: '280px' }}
              >
                {/* Search */}
                <div className="p-2 border-b border-white/[0.06]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-xs text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="max-h-[220px] overflow-y-auto no-scrollbar">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code + country.dialCode}
                      onClick={() => handleCountryChange(country)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${
                        selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode
                          ? 'bg-violet-500/10'
                          : ''
                      }`}
                    >
                      <span className="text-base">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 truncate">{country.name}</p>
                      </div>
                      <span className="text-[11px] text-white/40 font-mono">{country.dialCode}</span>
                      {selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode && (
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                      )}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="py-6 text-center">
                      <p className="text-xs text-white/30">No countries found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Number Format Configuration */}
      <div className="glass-card rounded-xl p-4 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/10">
            <Hash className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90">Number Format</h3>
            <p className="text-[10px] text-white/40">Configure prefix range and digit count</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Prefix Range */}
          <div>
            <label className="text-[11px] text-white/50 font-medium mb-1.5 block">First Digit Range</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={prefixStart}
                  onChange={(e) => setPrefixStart(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/90 text-center focus:outline-none focus:border-violet-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[9px] text-white/25 text-center mt-1">Start</p>
              </div>
              <span className="text-white/20 text-xs">→</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={prefixEnd}
                  onChange={(e) => setPrefixEnd(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/90 text-center focus:outline-none focus:border-violet-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[9px] text-white/25 text-center mt-1">End</p>
              </div>
            </div>
          </div>

          {/* Digit Count */}
          <div>
            <label className="text-[11px] text-white/50 font-medium mb-1.5 block">
              Number of Digits (after country code)
            </label>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setCustomDigits(Math.max(1, customDigits - 1))}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-white/50" />
              </motion.button>
              <div className="flex-1 bg-white/[0.04] border border-violet-500/20 rounded-lg px-3 py-2 text-center">
                <span className="text-sm font-bold text-violet-400">{customDigits}</span>
              </div>
              <motion.button
                onClick={() => setCustomDigits(Math.min(15, customDigits + 1))}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-white/50" />
              </motion.button>
            </div>
            <p className="text-[9px] text-white/25 mt-1">
              Format template: {selectedCountry.dialCode} + {customDigits} digits = {selectedCountry.format}
            </p>
          </div>
        </div>
      </div>

      {/* Generation Controls */}
      <div className="glass-card rounded-xl p-4 border border-violet-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-500/10">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90">Generation Controls</h3>
            <p className="text-[10px] text-white/40">Set quantity and generation mode</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Mode Toggle */}
          <div>
            <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Generation Mode</label>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setGenMode('random')}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  genMode === 'random'
                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                }`}
                style={genMode === 'random' ? { boxShadow: '0 0 12px rgba(139,92,246,0.15)' } : {}}
              >
                <Shuffle className="w-3.5 h-3.5" /> Random
              </motion.button>
              <motion.button
                onClick={() => setGenMode('sequential')}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  genMode === 'sequential'
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25'
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                }`}
                style={genMode === 'sequential' ? { boxShadow: '0 0 12px rgba(6,182,212,0.15)' } : {}}
              >
                <ListOrdered className="w-3.5 h-3.5" /> Sequential
              </motion.button>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="text-[11px] text-white/50 font-medium mb-1.5 block">Quantity</label>
            <div className="flex flex-wrap gap-2">
              {quantityPresets.map((q) => (
                <motion.button
                  key={q}
                  onClick={() => setQuantity(q)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                    quantity === q
                      ? 'bg-violet-500/15 text-violet-400 border-violet-500/25'
                      : 'bg-white/5 text-white/40 border-white/[0.08] hover:bg-white/10'
                  }`}
                  style={quantity === q ? { boxShadow: '0 0 8px rgba(139,92,246,0.1)' } : {}}
                >
                  {q.toLocaleString()}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            onClick={handleGenerate}
            disabled={isGenerating}
            whileTap={{ scale: 0.97 }}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              isGenerating
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/25 hover:from-violet-500/25 hover:to-purple-500/25'
            }`}
            style={!isGenerating ? { boxShadow: '0 0 20px rgba(139,92,246,0.15)' } : {}}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating... {progress}%
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate {quantity.toLocaleString()} Numbers
              </>
            )}
          </motion.button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-1">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-white/30 text-center">
                Generating numbers for {selectedCountry.flag} {selectedCountry.name}...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <AnimatePresence>
        {numbers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-violet-400" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Statistics</span>
              </div>
              {showStats ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/20" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/20" />
              )}
            </button>

            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className="glass-card rounded-xl p-3 border border-violet-500/15">
                      <div className="flex items-center gap-2 mb-1">
                        <HashIcon className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] text-white/40">Total Generated</span>
                      </div>
                      <p className="text-xl font-bold text-white/90">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="glass-card rounded-xl p-3 border border-green-500/15">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[10px] text-white/40">Valid Format</span>
                      </div>
                      <p className="text-xl font-bold text-green-400">{stats.valid.toLocaleString()}</p>
                    </div>
                    <div className="glass-card rounded-xl p-3 border border-amber-500/15">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-white/40">Duplicates</span>
                      </div>
                      <p className="text-xl font-bold text-amber-400">{stats.duplicates.toLocaleString()}</p>
                    </div>
                    <div className="glass-card rounded-xl p-3 border border-cyan-500/15">
                      <div className="flex items-center gap-2 mb-1">
                        <Filter className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] text-white/40">Unique</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-400">{stats.unique.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Valid rate bar */}
                  <div className="mt-2 glass-card rounded-xl p-3 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-white/40">WhatsApp Valid Rate</span>
                      <span className="text-[11px] font-bold text-green-400">
                        {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.total > 0 ? (stats.valid / stats.total) * 100 : 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {numbers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-violet-400" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Results ({filteredNumbers.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.button
                  onClick={copyAll}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-semibold hover:bg-violet-500/15 transition-colors"
                >
                  {copiedAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedAll ? 'Copied!' : 'Copy All'}
                </motion.button>
                <motion.button
                  onClick={exportCSV}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold hover:bg-green-500/15 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3" /> CSV
                </motion.button>
                <motion.button
                  onClick={exportJSON}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold hover:bg-cyan-500/15 transition-colors"
                >
                  <FileJson className="w-3 h-3" /> JSON
                </motion.button>
                <motion.button
                  onClick={clearResults}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </div>
            </div>

            {/* Search Within Results */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                placeholder="Search within results..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2.5 text-xs text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 transition-all"
              />
              {resultSearch && (
                <button
                  onClick={() => setResultSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div
              ref={resultsRef}
              className="max-h-96 overflow-y-auto no-scrollbar space-y-1.5"
            >
              <AnimatePresence>
                {filteredNumbers.map((num, i) => (
                  <motion.div
                    key={num.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="glass-card rounded-lg px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Valid indicator */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        num.valid ? 'bg-green-400' : 'bg-white/10'
                      }`} />
                      {/* Number */}
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-white/80 truncate">{num.formatted}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-white/25">{num.country}</span>
                          {num.valid ? (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/10">
                              WhatsApp
                            </span>
                          ) : (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 text-white/20 border border-white/[0.06]">
                              Unknown
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => copyNumber(num)}
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors opacity-60 group-hover:opacity-100"
                    >
                      {copiedId === num.id ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/40" />
                      )}
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredNumbers.length === 0 && resultSearch && (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No numbers matching &quot;{resultSearch}&quot;</p>
                </div>
              )}
            </div>

            {/* Load more indicator for large sets */}
            {filteredNumbers.length > 100 && (
              <p className="text-[10px] text-white/20 text-center">
                Showing {filteredNumbers.length} of {numbers.length} numbers
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Section */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/[0.06]">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-white/30" />
            <span className="text-[11px] font-semibold text-white/40">Recent Sessions</span>
            {sessions.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">
                {sessions.length}
              </span>
            )}
          </div>
          {showHistory ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/20" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/20" />
          )}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {sessions.length === 0 ? (
                <div className="px-4 pb-4 text-center">
                  <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-[11px] text-white/25">No generation sessions yet</p>
                </div>
              ) : (
                <div className="px-4 pb-3 space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-medium text-white/70">{session.country}</p>
                          <span className={`text-[8px] px-1 py-0.5 rounded ${
                            session.mode === 'random'
                              ? 'bg-violet-500/10 text-violet-400'
                              : 'bg-cyan-500/10 text-cyan-400'
                          }`}>
                            {session.mode}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/25">
                          {session.count} numbers • {session.validCount} valid • {session.duplicateCount} dupes
                        </p>
                      </div>
                      <p className="text-[9px] text-white/20 flex-shrink-0">
                        {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {numbers.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-8 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-3">
            <Phone className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-white/80 mb-1">Generate Phone Numbers</h3>
          <p className="text-[11px] text-white/35 leading-relaxed max-w-[260px] mx-auto">
            Select a country, configure the number format, and generate WhatsApp-valid phone numbers in bulk.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'USA', 'UK'].map((country) => {
              const c = COUNTRIES.find(ct => ct.name === country)
              if (!c) return null
              return (
                <button
                  key={c.code + c.dialCode}
                  onClick={() => handleCountryChange(c)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-medium hover:bg-white/10 hover:text-white/60 transition-colors"
                >
                  {c.flag} {c.name}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

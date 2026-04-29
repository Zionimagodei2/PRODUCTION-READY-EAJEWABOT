'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import {
  ArrowLeft, Upload, FileSpreadsheet, X, CheckCircle2,
  AlertCircle, SkipForward, Eye, Users, MapPin, ChevronDown,
  ChevronRight, Loader2, FolderOpen, Table2, FileText,
  ClipboardPaste, PenLine, MessageCircle, Phone, Mail,
  Building2, Tag, Plus, Trash2, AlertTriangle, RotateCcw,
  ArrowRight, Check, Hash
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

type ImportSource = 'csv' | 'manual' | 'paste' | 'whatsapp'

interface ColumnMapping {
  csvColumn: string
  contactField: string
}

interface ParsedCSV {
  filename: string
  size: string
  rowCount: number
  columns: string[]
  rows: Record<string, string>[]
}

interface ManualEntry {
  name: string
  phone: string
  email: string
  company: string
  tags: string
}

interface ImportError {
  row: number
  message: string
  data: string
}

interface WAGroup {
  id: string
  name: string
  memberCount: number
  avatar: string
  selected: boolean
  externalId?: string
}

// ─── Constants ───────────────────────────────────────────────────────

const contactFields = [
  { value: '', label: 'Skip this column' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'tags', label: 'Tags' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
  { value: 'location', label: 'Location' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const sourceTabs: { id: ImportSource; label: string; icon: React.ReactNode }[] = [
  { id: 'csv', label: 'CSV Upload', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
  { id: 'manual', label: 'Manual', icon: <PenLine className="w-3.5 h-3.5" /> },
  { id: 'paste', label: 'Paste', icon: <ClipboardPaste className="w-3.5 h-3.5" /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-3.5 h-3.5" /> },
]

const emptyGroups: WAGroup[] = []

// ─── Utility functions ───────────────────────────────────────────────

function parseCSVText(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { columns: [], rows: [] }

  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ','

  const columns = firstLine.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    columns.forEach((col, j) => {
      row[col] = values[j] || ''
    })
    rows.push(row)
  }

  return { columns, rows }
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0]
  const tabCount = (firstLine.match(/\t/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length

  if (tabCount > commaCount && tabCount > semiCount) return '\t'
  if (semiCount > commaCount) return ';'
  return ','
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function autoDetectMapping(col: string): string {
  const lower = col.toLowerCase().trim()
  if (lower.includes('name') || lower.includes('nom') || lower === 'full name') return 'name'
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel') || lower.includes('cell') || lower.includes('number')) return 'phone'
  if (lower.includes('tag') || lower.includes('label') || lower.includes('group') || lower.includes('category')) return 'tags'
  if (lower.includes('email') || lower.includes('mail') || lower.includes('courriel')) return 'email'
  if (lower.includes('company') || lower.includes('org') || lower.includes('business') || lower.includes('entreprise')) return 'company'
  if (lower.includes('city') || lower.includes('location') || lower.includes('address') || lower.includes('ville')) return 'location'
  return ''
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  return /^\+?\d{7,15}$/.test(cleaned)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const emptyManualEntry: ManualEntry = { name: '', phone: '', email: '', company: '', tags: '' }

// ─── Main Component ──────────────────────────────────────────────────

export function ContactImportPage() {
  const { goBack, setActiveTab, waConnected } = useAppStore()
  const { addToast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null)

  // Source tab
  const [activeSource, setActiveSource] = useState<ImportSource>('csv')

  // CSV state
  const [csvData, setCsvData] = useState<ParsedCSV | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null)

  // Manual entry state
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([{ ...emptyManualEntry }])
  const [manualDuplicates, setManualDuplicates] = useState<Set<number>>(new Set())
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set())

  // Paste state
  const [pasteText, setPasteText] = useState('')
  const [pasteDelimiter, setPasteDelimiter] = useState<string>(',')
  const [pasteColumns, setPasteColumns] = useState<string[]>([])
  const [pasteRows, setPasteRows] = useState<Record<string, string>[]>([])
  const [pasteMappings, setPasteMappings] = useState<ColumnMapping[]>([])
  const [pasteHasHeader, setPasteHasHeader] = useState(true)

  // WhatsApp state
  const [waGroups, setWaGroups] = useState<WAGroup[]>(emptyGroups)

  // Import progress state
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, skipped: 0, duplicates: 0 })
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [currentImportRow, setCurrentImportRow] = useState(0)

  // Fetch existing contacts for duplicate detection
  useEffect(() => {
    async function fetchExisting() {
      try {
        const res = await fetch('/api/contacts')
        if (res.ok) {
          const contacts = await res.json()
          const phones = new Set(contacts.map((c: { phone: string }) => c.phone.replace(/[\s\-\(\)\.]/g, '')))
          setExistingPhones(phones)
        }
      } catch {
        // silently fail
      }
    }
    fetchExisting()
  }, [])

  useEffect(() => {
    if (!waConnected) {
      queueMicrotask(() => setWaGroups([]))
      return
    }

    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-groups' }),
        })
        if (!response.ok) return
        const payload = await response.json()
        if (!Array.isArray(payload?.groups)) return

        const groups = payload.groups.map((group: { id?: string; name?: string; subject?: string; members?: number; size?: number }, index: number) => ({
          id: `wa-${index}-${group.id || group.name || group.subject || 'group'}`,
          name: group.name || group.subject || 'WhatsApp Group',
          memberCount: group.members || group.size || 0,
          avatar: '💬',
          selected: false,
          externalId: group.id,
        }))
        queueMicrotask(() => setWaGroups(groups))
      } catch {
        queueMicrotask(() => setWaGroups([]))
      }
    }

    void fetchGroups()
  }, [waConnected])

  const importContacts = useCallback(async (contacts: Record<string, string>[]) => {
    const response = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error || 'Import failed')
    }
    return payload as { success: number; duplicates: number; skipped: number; errors: number; total: number }
  }, [])

  // ─── CSV Handlers ───────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    setCsvValidationError(null)

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setCsvValidationError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`)
      addToast({ type: 'error', title: 'File Too Large', message: 'Maximum file size is 5MB' })
      return
    }

    // Validate file extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'tsv', 'txt'].includes(ext)) {
      setCsvValidationError('Unsupported file format. Please use CSV, TSV, or TXT files.')
      addToast({ type: 'error', title: 'Invalid Format', message: 'Please use CSV, TSV, or TXT files' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        setCsvValidationError('Could not read file content.')
        addToast({ type: 'error', title: 'File Error', message: 'Could not read file' })
        return
      }

      const { columns, rows } = parseCSVText(text)
      if (columns.length === 0 || rows.length === 0) {
        setCsvValidationError('File appears to be empty or has no valid data rows.')
        addToast({ type: 'error', title: 'Invalid CSV', message: 'File appears to be empty or invalid' })
        return
      }

      const parsed: ParsedCSV = {
        filename: file.name,
        size: formatFileSize(file.size),
        rowCount: rows.length,
        columns,
        rows,
      }
      setCsvData(parsed)

      // Auto-detect mappings
      const initialMappings = columns.map((col) => ({
        csvColumn: col,
        contactField: autoDetectMapping(col),
      }))
      setColumnMappings(initialMappings)
      addToast({ type: 'success', title: 'File Loaded', message: `${rows.length} rows found in ${file.name}` })
    }
    reader.onerror = () => {
      setCsvValidationError('Failed to read file.')
      addToast({ type: 'error', title: 'Read Error', message: 'Failed to read file' })
    }
    reader.readAsText(file)
  }, [addToast])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const updateCSVMapping = useCallback((index: number, field: string) => {
    setColumnMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, contactField: field } : m))
    )
  }, [])

  // ─── Manual Entry Handlers ──────────────────────────────────────

  const updateManualEntry = useCallback((index: number, field: keyof ManualEntry, value: string) => {
    setManualEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
    // Check for duplicates on phone change
    if (field === 'phone' && value) {
      const cleaned = value.replace(/[\s\-\(\)\.]/g, '')
      if (existingPhones.has(cleaned)) {
        setManualDuplicates((prev) => new Set(prev).add(index))
      } else {
        setManualDuplicates((prev) => {
          const next = new Set(prev)
          next.delete(index)
          return next
        })
      }
    }
  }, [existingPhones])

  const addManualEntry = useCallback(() => {
    setManualEntries((prev) => [...prev, { ...emptyManualEntry }])
  }, [])

  const removeManualEntry = useCallback((index: number) => {
    setManualEntries((prev) => prev.filter((_, i) => i !== index))
    setManualDuplicates((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }, [])

  // ─── Paste Handlers ─────────────────────────────────────────────

  const processPasteText = useCallback(() => {
    if (!pasteText.trim()) return

    const delimiter = detectDelimiter(pasteText)
    setPasteDelimiter(delimiter)

    const lines = pasteText.trim().split(/\r?\n/)
    if (lines.length < 1) return

    const parseLine = (line: string) => line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))

    if (pasteHasHeader && lines.length >= 2) {
      const columns = parseLine(lines[0])
      const rows: Record<string, string>[] = []
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = parseLine(lines[i])
        const row: Record<string, string> = {}
        columns.forEach((col, j) => { row[col] = values[j] || '' })
        rows.push(row)
      }
      setPasteColumns(columns)
      setPasteRows(rows)
      setPasteMappings(columns.map(col => ({ csvColumn: col, contactField: autoDetectMapping(col) })))
    } else {
      // No header: create generic columns
      const firstLineValues = parseLine(lines[0])
      const columns = firstLineValues.map((_, i) => `Column ${i + 1}`)
      const rows: Record<string, string>[] = []
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = parseLine(lines[i])
        const row: Record<string, string> = {}
        columns.forEach((col, j) => { row[col] = values[j] || '' })
        rows.push(row)
      }
      setPasteColumns(columns)
      setPasteRows(rows)
      setPasteMappings(columns.map(col => ({ csvColumn: col, contactField: autoDetectMapping(col) })))
    }
  }, [pasteText, pasteHasHeader])

  const pasteDetectedDelimiter = useMemo(() => {
    if (pasteText.trim()) {
      return detectDelimiter(pasteText)
    }
    return ','
  }, [pasteText])

  const updatePasteMapping = useCallback((index: number, field: string) => {
    setPasteMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, contactField: field } : m))
    )
  }, [])

  // ─── WhatsApp Group Handlers ────────────────────────────────────

  const toggleWAGroup = useCallback((id: string) => {
    setWaGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, selected: !g.selected } : g))
    )
  }, [])

  // ─── Import Execution ──────────────────────────────────────────

  const handleCSVImport = useCallback(async () => {
    const hasPhone = columnMappings.some((m) => m.contactField === 'phone')
    if (!hasPhone) {
      addToast({ type: 'warning', title: 'Missing Phone Mapping', message: 'Map at least one column to Phone' })
      return
    }
    if (!csvData) return

    setIsImporting(true)
    setImportProgress(30)
    setImportErrors([])
    setCurrentImportRow(0)
    const transformedContacts = csvData.rows.map((row) => {
      const contactData: Record<string, string> = {}
      columnMappings.forEach((mapping) => {
        if (mapping.contactField) {
          contactData[mapping.contactField] = row[mapping.csvColumn] || ''
        }
      })
      return contactData
    })

    try {
      const result = await importContacts(transformedContacts)
      setImportProgress(100)
      setImportComplete(true)
      setImportResults(result)
      setImportErrors([])
      addToast({
        type: 'success',
        title: 'Import Complete!',
        message: `${result.success} imported, ${result.duplicates} duplicates, ${result.skipped} skipped`,
        duration: 5000,
      })
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'Could not import contacts' })
    } finally {
      setIsImporting(false)
    }
  }, [columnMappings, csvData, addToast, importContacts])

  const handleManualImport = useCallback(async () => {
    const validEntries = manualEntries.filter(e => e.phone.trim().length >= 5)
    if (validEntries.length === 0) {
      addToast({ type: 'warning', title: 'No Valid Entries', message: 'Add at least one contact with a valid phone number' })
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportErrors([])
    setCurrentImportRow(0)

    setImportProgress(40)
    try {
      const result = await importContacts(
        validEntries.map((entry) => ({
          name: entry.name || 'Unknown',
          phone: entry.phone,
          email: entry.email || '',
          company: entry.company || '',
          tags: entry.tags || '',
        }))
      )
      setImportProgress(100)
      setImportComplete(true)
      setImportResults(result)
      setImportErrors([])
      addToast({
        type: 'success',
        title: 'Import Complete!',
        message: `${result.success} added, ${result.duplicates} duplicates, ${result.skipped} skipped`,
        duration: 5000,
      })
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'Could not import contacts' })
    } finally {
      setIsImporting(false)
    }
  }, [manualEntries, addToast, importContacts])

  const handlePasteImport = useCallback(async () => {
    const hasPhone = pasteMappings.some((m) => m.contactField === 'phone')
    if (!hasPhone) {
      addToast({ type: 'warning', title: 'Missing Phone Mapping', message: 'Map at least one column to Phone' })
      return
    }
    if (pasteRows.length === 0) return

    setIsImporting(true)
    setImportProgress(0)
    setImportErrors([])
    setCurrentImportRow(0)

    const transformedContacts = pasteRows.map((row) => {
      const contactData: Record<string, string> = {}
      pasteMappings.forEach((mapping) => {
        if (mapping.contactField) {
          contactData[mapping.contactField] = row[mapping.csvColumn] || ''
        }
      })
      return contactData
    })

    setImportProgress(40)
    try {
      const result = await importContacts(transformedContacts)
      setImportProgress(100)
      setImportComplete(true)
      setImportResults(result)
      setImportErrors([])
      addToast({
        type: 'success',
        title: 'Import Complete!',
        message: `${result.success} imported, ${result.duplicates} duplicates, ${result.skipped} skipped`,
        duration: 5000,
      })
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'Could not import contacts' })
    } finally {
      setIsImporting(false)
    }
  }, [pasteMappings, pasteRows, addToast, importContacts])

  const handleWAImport = useCallback(async () => {
    const selectedGroups = waGroups.filter(g => g.selected)
    if (selectedGroups.length === 0) {
      addToast({ type: 'warning', title: 'No Groups Selected', message: 'Select at least one group to import' })
      return
    }

    setIsImporting(true)
    setImportProgress(20)
    setImportErrors([])
    setCurrentImportRow(0)
    try {
      const tagValue = selectedGroups.map((group) => group.name).join(',')
      const contactsFromGroups: Record<string, string>[] = []
      for (const group of selectedGroups) {
        if (!group.externalId) continue
        const response = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-group-participants', groupId: group.externalId }),
        })
        if (!response.ok) continue
        const payload = await response.json()
        const participants = Array.isArray(payload?.participants) ? payload.participants : []
        participants.forEach((participant: { id?: string; phone?: string; name?: string; pushname?: string; number?: string }) => {
          const phone = participant.phone || participant.number || participant.id || ''
          contactsFromGroups.push({
            name: participant.name || participant.pushname || 'WhatsApp Contact',
            phone,
            tags: tagValue,
          })
        })
      }

      setImportProgress(70)
      const result = await importContacts(contactsFromGroups)
      setImportProgress(100)
      setImportComplete(true)
      setImportResults(result)
      setImportErrors([])
      addToast({
        type: 'success',
        title: 'Import Complete!',
        message: `${result.success} imported from ${selectedGroups.length} groups`,
        duration: 5000,
      })
    } catch (error: unknown) {
      addToast({ type: 'error', title: 'Import Failed', message: error instanceof Error ? error.message : 'Could not import group participants' })
    } finally {
      setIsImporting(false)
    }
  }, [waGroups, addToast, importContacts])

  // ─── Navigation & Reset ─────────────────────────────────────────

  const handleViewContacts = useCallback(() => {
    setActiveTab('contacts')
  }, [setActiveTab])

  const handleReset = useCallback(() => {
    setCsvData(null)
    setColumnMappings([])
    setImportProgress(0)
    setIsImporting(false)
    setImportComplete(false)
    setImportResults({ success: 0, errors: 0, skipped: 0, duplicates: 0 })
    setImportErrors([])
    setCurrentImportRow(0)
    setCsvValidationError(null)
    setManualEntries([{ ...emptyManualEntry }])
    setManualDuplicates(new Set())
    setPasteText('')
    setPasteColumns([])
    setPasteRows([])
    setPasteMappings([])
    setWaGroups((prev) => prev.map((group) => ({ ...group, selected: false })))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleRetryFailed = useCallback(() => {
    setImportComplete(false)
    setImportProgress(0)
    setIsImporting(false)
    setImportErrors([])
    setCurrentImportRow(0)
  }, [])

  // ─── Render ─────────────────────────────────────────────────────

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
            <Upload className="w-5 h-5 text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.4))' }} />
            Contact Import
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Import contacts from multiple sources</p>
        </div>
      </div>

      {/* Import Complete View */}
      <AnimatePresence mode="wait">
        {importComplete ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* Summary Header */}
            <div className="glass-card rounded-2xl p-5 text-center neon-glow-green">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-base font-extrabold text-white/90">Import Complete</h2>
              <p className="text-[11px] text-white/40 mt-1">
                {importResults.success + importResults.duplicates + importResults.errors + importResults.skipped} total rows processed
              </p>
            </div>

            {/* Results Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-4 text-center stat-card-green"
              >
                <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400 mb-1.5" />
                <p className="text-2xl font-extrabold text-emerald-400">{importResults.success}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">Imported</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="glass-card rounded-xl p-4 text-center"
                style={{ borderLeft: '2px solid rgba(245,158,11,0.3)' }}
              >
                <AlertTriangle className="w-5 h-5 mx-auto text-amber-400 mb-1.5" />
                <p className="text-2xl font-extrabold text-amber-400">{importResults.duplicates}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">Duplicates Skipped</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-xl p-4 text-center stat-card-orange"
              >
                <SkipForward className="w-5 h-5 mx-auto text-orange-400 mb-1.5" />
                <p className="text-2xl font-extrabold text-orange-400">{importResults.skipped}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">Skipped</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="glass-card rounded-xl p-4 text-center stat-card-red"
              >
                <AlertCircle className="w-5 h-5 mx-auto text-red-400 mb-1.5" />
                <p className="text-2xl font-extrabold text-red-400">{importResults.errors}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">Errors</p>
              </motion.div>
            </div>

            {/* Error Details */}
            {importErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-4 space-y-2"
              >
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Error Details
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-1.5 no-scrollbar">
                  {importErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <span className="text-[9px] text-red-400/60 font-mono flex-shrink-0">#{err.row}</span>
                      <span className="text-[10px] text-white/40 flex-1 truncate">{err.message}</span>
                      <span className="text-[10px] text-white/30 truncate max-w-[100px]">{err.data}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={handleViewContacts}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:from-emerald-500/35 hover:to-emerald-500/25 transition-all"
                style={{ boxShadow: '0 0 18px rgba(52,211,153,0.15)' }}
              >
                <Users className="w-3.5 h-3.5" /> View Contacts
              </motion.button>
              {importResults.errors > 0 && (
                <motion.button
                  onClick={handleRetryFailed}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/25 text-orange-300 text-xs font-semibold hover:from-orange-500/30 hover:to-orange-500/15 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </motion.button>
              )}
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                Import More
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="importer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Source Tabs */}
            <div className="glass-card rounded-2xl p-1.5 flex gap-1">
              {sourceTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveSource(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                    activeSource === tab.id
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'
                  }`}
                  style={
                    activeSource === tab.id
                      ? { boxShadow: '0 0 12px rgba(52,211,153,0.12)' }
                      : undefined
                  }
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Import Progress Overlay */}
            <AnimatePresence>
              {isImporting && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card rounded-2xl p-5 space-y-4 neon-glow-green"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-white/90">Importing contacts...</p>
                      <p className="text-[10px] text-white/40">Processing row {currentImportRow}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Progress</span>
                      <span className="text-xs text-emerald-400 font-bold">{importProgress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 progress-shimmer"
                        initial={{ width: 0 }}
                        animate={{ width: `${importProgress}%` }}
                        transition={{ duration: 0.3 }}
                        style={{ boxShadow: '0 0 8px rgba(52,211,153,0.4)' }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-white/40">Processing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* CSV Upload Source */}
            <AnimatePresence mode="wait">
              {activeSource === 'csv' && !isImporting && (
                <motion.div
                  key="csv-source"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {!csvData ? (
                    <>
                      {/* Drag & Drop Zone */}
                      <motion.div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        className={`glass-card rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 ${
                          isDragOver
                            ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
                            : 'border-dashed border-2 border-white/10 hover:border-emerald-500/30'
                        }`}
                        style={
                          isDragOver
                            ? { boxShadow: '0 0 30px rgba(52,211,153,0.15)' }
                            : undefined
                        }
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed transition-all duration-300 ${
                            isDragOver
                              ? 'border-emerald-500/50 bg-emerald-500/15 scale-110'
                              : 'border-white/15 bg-white/[0.03]'
                          }`}
                        >
                          <Upload
                            className={`w-7 h-7 transition-all duration-300 ${
                              isDragOver ? 'text-emerald-400 scale-110' : 'text-white/25'
                            }`}
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-semibold text-white/70">
                            {isDragOver ? 'Drop file here' : 'Drag & drop your CSV file'}
                          </p>
                          <p className="text-[11px] text-white/35">or</p>
                        </div>
                        <motion.button
                          onClick={() => fileInputRef.current?.click()}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold hover:from-emerald-500/30 hover:to-emerald-500/15 transition-all"
                          style={{ boxShadow: '0 0 14px rgba(52,211,153,0.15)' }}
                        >
                          <FolderOpen className="w-3.5 h-3.5" /> Browse Files
                        </motion.button>
                        <p className="text-[10px] text-white/20">Supports CSV, TSV, and TXT • Max 5MB</p>
                      </motion.div>

                      {/* Validation Error */}
                      {csvValidationError && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card rounded-xl p-3 border-red-500/20 flex items-center gap-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-[11px] text-red-300/80">{csvValidationError}</p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* File Info Card */}
                      <div className="glass-card rounded-2xl p-4 neon-glow-green">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/90 truncate">{csvData.filename}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-white/35">{csvData.size}</span>
                              <span className="text-[10px] text-white/35 flex items-center gap-1">
                                <Table2 className="w-2.5 h-2.5" /> {csvData.rowCount} rows
                              </span>
                              <span className="text-[10px] text-white/35 flex items-center gap-1">
                                <Hash className="w-2.5 h-2.5" /> {csvData.columns.length} cols
                              </span>
                            </div>
                          </div>
                          <motion.button
                            onClick={handleReset}
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-white/40" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Column Mapping */}
                      <div className="glass-card rounded-2xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Column Mapping
                        </h3>
                        <p className="text-[10px] text-white/35">Map your CSV columns to contact fields</p>
                        <div className="space-y-2">
                          {columnMappings.map((mapping, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/60 truncate">
                                {mapping.csvColumn}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                              <div className="relative flex-1">
                                <select
                                  value={mapping.contactField}
                                  onChange={(e) => updateCSVMapping(i, e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-emerald-500/40 transition-colors appearance-none cursor-pointer pr-8"
                                >
                                  {contactFields.map((field) => (
                                    <option key={field.value} value={field.value} className="bg-[#14141f] text-white/80">
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="glass-card rounded-2xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Preview (First 5 rows)
                        </h3>
                        <div className="overflow-x-auto -mx-1">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="border-b border-white/[0.06]">
                                {csvData.columns.map((col) => (
                                  <th key={col} className="text-left px-2 py-2 text-white/35 font-semibold whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvData.rows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-b border-white/[0.03] last:border-0">
                                  {csvData.columns.map((col) => (
                                    <td key={col} className="px-2 py-2 text-white/55 whitespace-nowrap">
                                      {row[col] || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Import Button */}
                      <motion.button
                        onClick={handleCSVImport}
                        disabled={isImporting}
                        whileHover={{ scale: isImporting ? 1 : 1.02 }}
                        whileTap={{ scale: isImporting ? 1 : 0.97 }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm disabled:opacity-60 hover:from-emerald-500/35 hover:to-emerald-500/25 transition-all"
                        style={{ boxShadow: '0 0 18px rgba(52,211,153,0.15)' }}
                      >
                        <Upload className="w-4 h-4" /> Import {csvData.rowCount} Contacts
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Manual Entry Source */}
            <AnimatePresence mode="wait">
              {activeSource === 'manual' && !isImporting && (
                <motion.div
                  key="manual-source"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <div className="glass-card rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                      <PenLine className="w-3.5 h-3.5 text-emerald-400" /> Manual Entry
                    </h3>
                    <p className="text-[10px] text-white/35">Add contacts one by one. Phone number is required.</p>
                  </div>

                  {manualEntries.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-card rounded-2xl p-4 space-y-3 ${
                        manualDuplicates.has(index) ? 'border-amber-500/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Contact {index + 1}</span>
                        {manualEntries.length > 1 && (
                          <motion.button
                            onClick={() => removeManualEntry(index)}
                            whileTap={{ scale: 0.9 }}
                            className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </motion.button>
                        )}
                      </div>

                      {/* Duplicate warning */}
                      {manualDuplicates.has(index) && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="text-[10px] text-amber-300/80">This phone number already exists in your contacts</span>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        {/* Phone (required) */}
                        <div>
                          <label className="text-[10px] text-white/40 font-semibold mb-1 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-emerald-400" /> Phone <span className="text-red-400">*</span>
                          </label>
                          <input
                            value={entry.phone}
                            onChange={(e) => updateManualEntry(index, 'phone', e.target.value)}
                            placeholder="+1 234 567 8900"
                            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-colors ${
                              entry.phone && !isValidPhone(entry.phone) ? 'border-red-500/30 focus:border-red-500/50' : 'border-white/10 focus:border-emerald-500/40'
                            }`}
                          />
                          {entry.phone && !isValidPhone(entry.phone) && (
                            <p className="text-[9px] text-red-400/70 mt-1">Enter a valid phone number with country code</p>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <label className="text-[10px] text-white/40 font-semibold mb-1 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-white/30" /> Name
                          </label>
                          <input
                            value={entry.name}
                            onChange={(e) => updateManualEntry(index, 'name', e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-[10px] text-white/40 font-semibold mb-1 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 text-white/30" /> Email
                          </label>
                          <input
                            value={entry.email}
                            onChange={(e) => updateManualEntry(index, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none transition-colors ${
                              entry.email && !isValidEmail(entry.email) ? 'border-red-500/30 focus:border-red-500/50' : 'border-white/10 focus:border-emerald-500/40'
                            }`}
                          />
                          {entry.email && !isValidEmail(entry.email) && (
                            <p className="text-[9px] text-red-400/70 mt-1">Enter a valid email address</p>
                          )}
                        </div>

                        {/* Company */}
                        <div>
                          <label className="text-[10px] text-white/40 font-semibold mb-1 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-white/30" /> Company
                          </label>
                          <input
                            value={entry.company}
                            onChange={(e) => updateManualEntry(index, 'company', e.target.value)}
                            placeholder="Acme Inc."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors"
                          />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="text-[10px] text-white/40 font-semibold mb-1 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 text-white/30" /> Tags
                          </label>
                          <input
                            value={entry.tags}
                            onChange={(e) => updateManualEntry(index, 'tags', e.target.value)}
                            placeholder="vip, customer, lead (comma separated)"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Another Button */}
                  <motion.button
                    onClick={addManualEntry}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-dashed border-white/10 text-white/40 text-xs font-medium hover:bg-white/[0.06] hover:text-white/60 hover:border-emerald-500/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Contact
                  </motion.button>

                  {/* Import Button */}
                  <motion.button
                    onClick={handleManualImport}
                    disabled={isImporting}
                    whileHover={{ scale: isImporting ? 1 : 1.02 }}
                    whileTap={{ scale: isImporting ? 1 : 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm disabled:opacity-60 hover:from-emerald-500/35 hover:to-emerald-500/25 transition-all"
                    style={{ boxShadow: '0 0 18px rgba(52,211,153,0.15)' }}
                  >
                    <Upload className="w-4 h-4" /> Add {manualEntries.filter(e => e.phone.trim().length >= 5).length} Contacts
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paste Import Source */}
            <AnimatePresence mode="wait">
              {activeSource === 'paste' && !isImporting && (
                <motion.div
                  key="paste-source"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="glass-card rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                      <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" /> Paste Import
                    </h3>
                    <p className="text-[10px] text-white/35">Paste tabular data with tab, comma, or space separators</p>

                    {/* Delimiter info */}
                    {pasteText && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/25 uppercase tracking-wider">Detected delimiter:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono font-bold">
                          {pasteDetectedDelimiter === '\t' ? 'Tab' : pasteDetectedDelimiter === ';' ? 'Semicolon' : 'Comma'}
                        </span>
                      </div>
                    )}

                    {/* Has header toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">First row contains headers</span>
                      <button
                        onClick={() => setPasteHasHeader(!pasteHasHeader)}
                        className={`w-9 h-5 rounded-full transition-all duration-200 relative ${
                          pasteHasHeader ? 'bg-emerald-500/30' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 rounded-full absolute top-0.5"
                          animate={{ left: pasteHasHeader ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{ backgroundColor: pasteHasHeader ? '#34d399' : 'rgba(255,255,255,0.3)' }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Paste Area */}
                  <div className="glass-card rounded-2xl p-4 space-y-3">
                    <textarea
                      ref={pasteAreaRef}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={"Paste your data here...\n\nExample:\nName,Phone,Email,Company\nJohn Doe,+1234567890,john@example.com,Acme Inc\nJane Smith,+0987654321,jane@example.com,Corp Ltd"}
                      className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-xs text-white/70 placeholder-white/15 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none font-mono"
                    />

                    <motion.button
                      onClick={processPasteText}
                      disabled={!pasteText.trim()}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview & Map Columns
                    </motion.button>
                  </div>

                  {/* Paste Column Mapping (shown after preview) */}
                  {pasteColumns.length > 0 && pasteRows.length > 0 && (
                    <>
                      <div className="glass-card rounded-2xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Column Mapping
                        </h3>
                        <p className="text-[10px] text-white/35">
                          {pasteRows.length} rows detected • Map columns to contact fields
                        </p>
                        <div className="space-y-2">
                          {pasteMappings.map((mapping, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-xs text-white/60 truncate">
                                {mapping.csvColumn}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0" />
                              <div className="relative flex-1">
                                <select
                                  value={mapping.contactField}
                                  onChange={(e) => updatePasteMapping(i, e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-emerald-500/40 transition-colors appearance-none cursor-pointer pr-8"
                                >
                                  {contactFields.map((field) => (
                                    <option key={field.value} value={field.value} className="bg-[#14141f] text-white/80">
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Paste Preview Table */}
                      <div className="glass-card rounded-2xl p-4 space-y-3">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Preview (First 5 rows)
                        </h3>
                        <div className="overflow-x-auto -mx-1">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="border-b border-white/[0.06]">
                                {pasteColumns.map((col) => (
                                  <th key={col} className="text-left px-2 py-2 text-white/35 font-semibold whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pasteRows.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-b border-white/[0.03] last:border-0">
                                  {pasteColumns.map((col) => (
                                    <td key={col} className="px-2 py-2 text-white/55 whitespace-nowrap">
                                      {row[col] || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Import Button */}
                      <motion.button
                        onClick={handlePasteImport}
                        disabled={isImporting}
                        whileHover={{ scale: isImporting ? 1 : 1.02 }}
                        whileTap={{ scale: isImporting ? 1 : 0.97 }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm disabled:opacity-60 hover:from-emerald-500/35 hover:to-emerald-500/25 transition-all"
                        style={{ boxShadow: '0 0 18px rgba(52,211,153,0.15)' }}
                      >
                        <Upload className="w-4 h-4" /> Import {pasteRows.length} Contacts
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* WhatsApp Group Import Source */}
            <AnimatePresence mode="wait">
              {activeSource === 'whatsapp' && !isImporting && (
                <motion.div
                  key="wa-source"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="glass-card rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Group Import
                    </h3>
                    <p className="text-[10px] text-white/35">Import contacts from your connected WhatsApp groups</p>
                  </div>

                  {/* Connection Status */}
                  {!waConnected && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-2xl p-4 border-amber-500/20 flex items-center gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] text-amber-300/80 font-medium">WhatsApp not connected</p>
                        <p className="text-[10px] text-white/30 mt-0.5">Connect your WhatsApp account first to import from groups</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Group List */}
                  <div className="space-y-2">
                    {waGroups.map((group, i) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => toggleWAGroup(group.id)}
                        className={`glass-card rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                          group.selected ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'hover:bg-white/[0.02]'
                        }`}
                        style={group.selected ? { boxShadow: '0 0 15px rgba(52,211,153,0.1)' } : undefined}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                          {group.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/90 truncate">{group.name}</p>
                          <p className="text-[10px] text-white/35 mt-0.5 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {group.memberCount} members
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          group.selected
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-white/15'
                        }`}>
                          {group.selected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Selection Summary */}
                  {waGroups.some(g => g.selected) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-white/60">
                          {waGroups.filter(g => g.selected).length} groups selected
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold">
                        {waGroups.filter(g => g.selected).reduce((sum, g) => sum + g.memberCount, 0)} total members
                      </span>
                    </motion.div>
                  )}

                  {/* Import Button */}
                  <motion.button
                    onClick={handleWAImport}
                    disabled={isImporting || !waGroups.some(g => g.selected)}
                    whileHover={{ scale: isImporting ? 1 : 1.02 }}
                    whileTap={{ scale: isImporting ? 1 : 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm disabled:opacity-40 hover:from-emerald-500/35 hover:to-emerald-500/25 transition-all"
                    style={{ boxShadow: waGroups.some(g => g.selected) ? '0 0 18px rgba(52,211,153,0.15)' : undefined }}
                  >
                    <Upload className="w-4 h-4" /> Import from {waGroups.filter(g => g.selected).length} Group{waGroups.filter(g => g.selected).length !== 1 ? 's' : ''}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

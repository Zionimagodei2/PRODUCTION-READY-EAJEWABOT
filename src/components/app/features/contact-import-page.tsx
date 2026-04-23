'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import {
  ArrowLeft, Upload, FileSpreadsheet, X, CheckCircle2,
  AlertCircle, SkipForward, Eye, Users, MapPin, ChevronDown,
  ChevronRight, Loader2, FolderOpen, Table2
} from 'lucide-react'

interface ColumnMapping {
  csvColumn: string
  contactField: string
}

const contactFields = [
  { value: '', label: 'Skip this column' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'tags', label: 'Tags' },
  { value: 'email', label: 'Email' },
]

const mockCsvData = {
  filename: 'contacts_2024.csv',
  size: '12.4 KB',
  rowCount: 48,
  columns: ['Full Name', 'Mobile Number', 'Contact Tags', 'Email Address', 'Company'],
  rows: [
    { 'Full Name': 'Alice Johnson', 'Mobile Number': '+1 555 0101', 'Contact Tags': 'customer,vip', 'Email Address': 'alice@example.com', 'Company': 'TechCorp' },
    { 'Full Name': 'Bob Williams', 'Mobile Number': '+44 7700 900001', 'Contact Tags': 'lead', 'Email Address': 'bob@example.com', 'Company': 'DesignHub' },
    { 'Full Name': 'Carol Davis', 'Mobile Number': '+86 138 0001 0001', 'Contact Tags': 'customer', 'Email Address': 'carol@example.com', 'Company': 'SalesForce' },
    { 'Full Name': 'Dan Smith', 'Mobile Number': '+1 555 0102', 'Contact Tags': 'prospect', 'Email Address': 'dan@example.com', 'Company': 'Acme Inc' },
    { 'Full Name': 'Eva Brown', 'Mobile Number': '+49 151 1234 5678', 'Contact Tags': 'lead,hot', 'Email Address': 'eva@example.com', 'Company': 'InnovateGmbH' },
  ],
}

export function ContactImportPage() {
  const { goBack, setActiveTab } = useAppStore()
  const { addToast } = useToastStore()

  const [fileUploaded, setFileUploaded] = useState(false)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, skipped: 0 })

  const handleUpload = useCallback(() => {
    // Simulate file upload with mock data
    setFileUploaded(true)
    const initialMappings = mockCsvData.columns.map((col) => ({
      csvColumn: col,
      contactField: '',
    }))
    // Auto-detect mappings
    initialMappings[0].contactField = 'name'
    initialMappings[1].contactField = 'phone'
    initialMappings[2].contactField = 'tags'
    initialMappings[3].contactField = 'email'
    // Skip 'Company' column
    setColumnMappings(initialMappings)
    addToast({ type: 'success', title: 'File Loaded', message: `${mockCsvData.rowCount} rows found` })
  }, [addToast])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleUpload()
    },
    [handleUpload]
  )

  const updateMapping = useCallback((index: number, field: string) => {
    setColumnMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, contactField: field } : m))
    )
  }, [])

  const handleImport = useCallback(() => {
    const hasPhone = columnMappings.some((m) => m.contactField === 'phone')
    if (!hasPhone) {
      addToast({ type: 'warning', title: 'Missing Phone Mapping', message: 'Map at least one column to Phone' })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    const total = mockCsvData.rowCount
    let current = 0
    let success = 0
    let errors = 0
    let skipped = 0

    const interval = setInterval(() => {
      current++
      const rand = Math.random()
      if (rand < 0.85) success++
      else if (rand < 0.92) errors++
      else skipped++

      setImportProgress(Math.round((current / total) * 100))

      if (current >= total) {
        clearInterval(interval)
        setIsImporting(false)
        setImportComplete(true)
        setImportResults({ success, errors, skipped })
        addToast({
          type: 'success',
          title: 'Import Complete!',
          message: `${success} imported, ${errors} errors, ${skipped} skipped`,
          duration: 5000,
        })
      }
    }, 80)
  }, [columnMappings, addToast])

  const handleViewContacts = useCallback(() => {
    setActiveTab('contacts')
  }, [setActiveTab])

  const handleReset = useCallback(() => {
    setFileUploaded(false)
    setColumnMappings([])
    setImportProgress(0)
    setIsImporting(false)
    setImportComplete(false)
    setImportResults({ success: 0, errors: 0, skipped: 0 })
  }, [])

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
            <Upload className="w-5 h-5 text-neon-cyan neon-text-glow-cyan" />
            Contact Import
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Import contacts from CSV files</p>
        </div>
      </div>

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!fileUploaded ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`glass-card rounded-2xl p-6 neon-glow-cyan flex flex-col items-center gap-4 transition-all ${
              isDragOver ? 'border-cyan-500/40 bg-cyan-500/[0.04]' : ''
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed transition-colors ${
                isDragOver ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/15 bg-white/[0.03]'
              }`}
            >
              <Upload
                className={`w-7 h-7 transition-colors ${
                  isDragOver ? 'text-cyan-400' : 'text-white/25'
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
              onClick={handleUpload}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold hover:from-cyan-500/30 hover:to-cyan-500/15 transition-all"
              style={{ boxShadow: '0 0 14px rgba(6,182,212,0.15)' }}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Browse Files
            </motion.button>
            <p className="text-[10px] text-white/20">Supports CSV, TSV, and XLSX formats</p>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* File Info Card */}
            <div className="glass-card rounded-2xl p-4 neon-glow-cyan">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{mockCsvData.filename}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-white/35">{mockCsvData.size}</span>
                    <span className="text-[10px] text-white/35 flex items-center gap-1">
                      <Table2 className="w-2.5 h-2.5" /> {mockCsvData.rowCount} rows
                    </span>
                    <span className="text-[10px] text-white/35 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {mockCsvData.columns.length} cols
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
                <MapPin className="w-3.5 h-3.5 text-neon-cyan" /> Column Mapping
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
                        onChange={(e) => updateMapping(i, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-cyan-500/40 transition-colors appearance-none cursor-pointer pr-8"
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
                <Eye className="w-3.5 h-3.5 text-neon-cyan" /> Preview (First 5 rows)
              </h3>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {mockCsvData.columns.map((col) => (
                        <th key={col} className="text-left px-2 py-2 text-white/35 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockCsvData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-white/[0.03] last:border-0">
                        {mockCsvData.columns.map((col) => (
                          <td key={col} className="px-2 py-2 text-white/55 whitespace-nowrap">
                            {row[col as keyof typeof row]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Progress / Button */}
            {!importComplete && (
              <div className="space-y-3">
                <motion.button
                  onClick={handleImport}
                  disabled={isImporting}
                  whileHover={{ scale: isImporting ? 1 : 1.02 }}
                  whileTap={{ scale: isImporting ? 1 : 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500/25 to-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-sm disabled:opacity-60 hover:from-cyan-500/35 hover:to-cyan-500/25 transition-all"
                  style={{ boxShadow: '0 0 18px rgba(6,182,212,0.15)' }}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Import {mockCsvData.rowCount} Contacts
                    </>
                  )}
                </motion.button>

                {isImporting && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Importing contacts...</span>
                      <span className="text-[10px] text-neon-cyan font-bold">{importProgress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${importProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Results */}
            <AnimatePresence>
              {importComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Results Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card rounded-xl p-3 text-center stat-card-green">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-green-400 mb-1" />
                      <p className="text-xl font-extrabold text-neon-green">{importResults.success}</p>
                      <p className="text-[10px] text-white/50 font-semibold">Success</p>
                    </div>
                    <div className="glass-card rounded-xl p-3 text-center stat-card-red">
                      <AlertCircle className="w-4 h-4 mx-auto text-red-400 mb-1" />
                      <p className="text-xl font-extrabold text-red-400">{importResults.errors}</p>
                      <p className="text-[10px] text-white/50 font-semibold">Errors</p>
                    </div>
                    <div className="glass-card rounded-xl p-3 text-center stat-card-orange">
                      <SkipForward className="w-4 h-4 mx-auto text-orange-400 mb-1" />
                      <p className="text-xl font-extrabold text-neon-orange">{importResults.skipped}</p>
                      <p className="text-[10px] text-white/50 font-semibold">Skipped</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleViewContacts}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold hover:from-cyan-500/30 hover:to-cyan-500/15 transition-all"
                    >
                      <Users className="w-3.5 h-3.5" /> View Imported Contacts
                    </motion.button>
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
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

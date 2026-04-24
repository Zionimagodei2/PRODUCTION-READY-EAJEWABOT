'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Database, Users, Megaphone, MessageSquare,
  BarChart3, Download, FileText, FileJson, FileSpreadsheet,
  Calendar, Clock, CheckCircle2, Loader2, HardDrive
} from 'lucide-react'

type DateRange = '7d' | '30d' | '90d' | 'all'
type ExportFormat = 'csv' | 'json' | 'vcard' | 'pdf'

interface ExportOption {
  id: string
  icon: React.ReactNode
  title: string
  recordCount: number
  formats: ExportFormat[]
  color: string
  description: string
}

interface ExportHistoryItem {
  id: string
  title: string
  format: string
  date: string
  size: string
  status: 'completed' | 'failed'
}

const defaultExportOptions: ExportOption[] = [
  {
    id: 'contacts',
    icon: <Users className="w-5 h-5" />,
    title: 'Contacts',
    recordCount: 0,
    formats: ['csv', 'json', 'vcard'],
    color: '#22c55e',
    description: 'All contact information and tags',
  },
  {
    id: 'campaigns',
    icon: <Megaphone className="w-5 h-5" />,
    title: 'Campaigns',
    recordCount: 0,
    formats: ['csv', 'pdf'],
    color: '#3b82f6',
    description: 'Campaign details and delivery stats',
  },
  {
    id: 'messages',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Messages',
    recordCount: 0,
    formats: ['csv', 'json'],
    color: '#8b5cf6',
    description: 'Message logs and delivery receipts',
  },
  {
    id: 'analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Analytics',
    recordCount: 0,
    formats: ['csv', 'pdf'],
    color: '#ec4899',
    description: 'Performance metrics and trends',
  },
]

const dateRangeOptions: { id: DateRange; label: string }[] = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
]

const formatConfig: Record<ExportFormat, { icon: React.ReactNode; label: string; color: string }> = {
  csv: { icon: <FileSpreadsheet className="w-3.5 h-3.5" />, label: 'CSV', color: '#22c55e' },
  json: { icon: <FileJson className="w-3.5 h-3.5" />, label: 'JSON', color: '#f59e0b' },
  vcard: { icon: <Users className="w-3.5 h-3.5" />, label: 'vCard', color: '#3b82f6' },
  pdf: { icon: <FileText className="w-3.5 h-3.5" />, label: 'PDF', color: '#ef4444' },
}

export function DataExportPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportOptions, setExportOptions] = useState<ExportOption[]>(defaultExportOptions)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real record counts from the API
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/export')
        if (res.ok) {
          const data = await res.json()
          queueMicrotask(() => {
            setExportOptions(prev => prev.map(opt => ({
              ...opt,
              recordCount: data[opt.id as keyof typeof data] ?? 0,
            })))
          })
        }
      } catch (error) {
        console.error('Failed to fetch export counts:', error)
      } finally {
        queueMicrotask(() => setLoading(false))
      }
    }
    fetchCounts()
  }, [])

  const handleExport = useCallback(
    async (option: ExportOption, format: ExportFormat) => {
      setExportingId(option.id)
      setExportProgress(0)

      // Show progress animation
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 25
        })
      }, 200)

      try {
        if (format === 'vcard') {
          // vCard: fetch contacts and generate vCard locally
          const contactsRes = await fetch('/api/contacts')
          if (contactsRes.ok) {
            const contacts = await contactsRes.json()
            const vcardContent = contacts.map((c: { name: string; phone: string; email: string; company: string }) =>
              `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL:${c.phone}\nEMAIL:${c.email}\nORG:${c.company}\nEND:VCARD`
            ).join('\n')

            clearInterval(progressInterval)
            setExportProgress(100)

            const blob = new Blob([vcardContent], { type: 'text/vcard' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `eaje-contacts-${new Date().toISOString().slice(0, 10)}.vcf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            addToHistory(option.title, 'vCard', vcardContent.length)
          }
        } else if (format === 'pdf') {
          // PDF: generate a simple text report since we can't generate real PDF client-side
          clearInterval(progressInterval)
          setExportProgress(100)

          const res = await fetch('/api/stats')
          let reportContent = `EAJE WhatsBot - ${option.title} Report\nGenerated: ${new Date().toLocaleString()}\nDate Range: ${dateRangeOptions.find(d => d.id === dateRange)?.label}\n\n`
          if (res.ok) {
            const stats = await res.json()
            reportContent += `Summary Statistics:\n`
            reportContent += `Total Sent: ${stats.totalSent}\n`
            reportContent += `Total Delivered: ${stats.totalDelivered}\n`
            reportContent += `Total Replies: ${stats.totalReplies}\n`
            reportContent += `Delivery Rate: ${stats.deliveryRate}%\n`
            reportContent += `Reply Rate: ${stats.replyRate}%\n`
            reportContent += `Total Contacts: ${stats.totalContacts}\n`
            reportContent += `Total Campaigns: ${stats.totalCampaigns}\n`
          }

          const blob = new Blob([reportContent], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `eaje-${option.id}-${new Date().toISOString().slice(0, 10)}.txt`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          addToHistory(option.title, 'PDF', reportContent.length)
        } else {
          // CSV/JSON: call the real export API
          const res = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: option.id, format }),
          })

          clearInterval(progressInterval)
          setExportProgress(100)

          if (res.ok) {
            const content = await res.text()
            const mimeType = format === 'csv' ? 'text/csv' : 'application/json'
            const extension = format === 'csv' ? 'csv' : 'json'

            const blob = new Blob([content], { type: mimeType })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `eaje-${option.id}-${new Date().toISOString().slice(0, 10)}.${extension}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            addToHistory(option.title, format.toUpperCase(), content.length)
          } else {
            addToast({
              type: 'error',
              title: 'Export Failed',
              message: `Failed to export ${option.title} as ${format.toUpperCase()}`,
              duration: 3000,
            })
          }
        }

        addToast({
          type: 'success',
          title: 'Export Complete',
          message: `${option.title} exported as ${format.toUpperCase()} successfully`,
          duration: 3000,
        })
      } catch (error) {
        console.error('Export error:', error)
        addToast({
          type: 'error',
          title: 'Export Failed',
          message: `Failed to export ${option.title}`,
          duration: 3000,
        })
      } finally {
        setExportingId(null)
        setExportProgress(0)
      }
    },
    [dateRange, addToast]
  )

  function addToHistory(title: string, format: string, byteSize: number) {
    const sizeStr = byteSize > 1024 * 1024
      ? `${(byteSize / (1024 * 1024)).toFixed(1)} MB`
      : byteSize > 1024
        ? `${(byteSize / 1024).toFixed(1)} KB`
        : `${byteSize} B`

    const newItem: ExportHistoryItem = {
      id: Date.now().toString(),
      title: `${title} Export`,
      format,
      date: new Date().toLocaleString(),
      size: sizeStr,
      status: 'completed',
    }
    setExportHistory(prev => [newItem, ...prev].slice(0, 10))
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Data Export Center</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Export your data in various formats</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-cyan-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Date Range</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {dateRangeOptions.map((range) => (
            <motion.button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              whileTap={{ scale: 0.95 }}
              className={`py-2 px-3 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                dateRange === range.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60'
              }`}
              style={
                dateRange === range.id
                  ? { boxShadow: '0 0 15px rgba(6,182,212,0.15)' }
                  : undefined
              }
            >
              {range.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Export Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400/70" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Export Data</span>
        </div>

        {exportOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.06 }}
            className="glass-card rounded-2xl p-4 border-white/5"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${option.color}12`,
                  border: `1px solid ${option.color}25`,
                  boxShadow: `0 0 20px ${option.color}10`,
                }}
              >
                <div style={{ color: option.color, filter: `drop-shadow(0 0 6px ${option.color}40)` }}>
                  {option.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-white/90">{option.title}</h3>
                  <span className="text-[10px] text-white/30 font-medium">
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : (
                      `${option.recordCount.toLocaleString()} records`
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-white/40 mt-0.5">{option.description}</p>

                {/* Progress bar during export */}
                <AnimatePresence>
                  {exportingId === option.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                        <span className="text-[10px] text-cyan-400/80 font-medium">Exporting... {Math.round(exportProgress)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${option.color}80, ${option.color})`,
                            boxShadow: `0 0 8px ${option.color}60`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${exportProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Format buttons */}
                <div className="flex items-center gap-2 mt-3">
                  {option.formats.map((format) => {
                    const config = formatConfig[format]
                    const isExporting = exportingId === option.id
                    const noRecords = !loading && option.recordCount === 0
                    return (
                      <motion.button
                        key={format}
                        onClick={() => !isExporting && !noRecords && handleExport(option, format)}
                        disabled={isExporting || noRecords}
                        whileTap={!isExporting && !noRecords ? { scale: 0.95 } : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                          isExporting || noRecords
                            ? 'bg-white/[0.02] text-white/20 border border-white/[0.04] cursor-not-allowed'
                            : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.12]'
                        }`}
                        style={
                          !isExporting && !noRecords
                            ? { boxShadow: `0 0 10px ${config.color}08` }
                            : undefined
                        }
                      >
                        <div style={{ color: isExporting || noRecords ? 'rgba(255,255,255,0.2)' : config.color }}>
                          {config.icon}
                        </div>
                        {config.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Export History */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-white/30" />
          <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Export History</span>
        </div>
        {exportHistory.length > 0 ? (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {exportHistory.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.status === 'completed'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] text-white/75 font-medium truncate">{item.title}</p>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-white/[0.04] text-white/30 border border-white/[0.06]"
                    >
                      {item.format}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-white/40 font-medium">{item.size}</p>
                  <p className={`text-[9px] font-semibold mt-0.5 ${item.status === 'completed' ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                    {item.status === 'completed' ? 'Success' : 'Failed'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Clock className="w-10 h-10 mx-auto text-white/10 mb-3" />
            <p className="text-sm text-white/40 font-medium">No exports yet</p>
            <p className="text-xs text-white/20 mt-1">Your export history will appear here</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

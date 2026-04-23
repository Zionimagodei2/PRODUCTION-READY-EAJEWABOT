'use client'

import { useState, useCallback } from 'react'
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

const exportOptions: ExportOption[] = [
  {
    id: 'contacts',
    icon: <Users className="w-5 h-5" />,
    title: 'Contacts',
    recordCount: 1284,
    formats: ['csv', 'json', 'vcard'],
    color: '#22c55e',
    description: 'All contact information and tags',
  },
  {
    id: 'campaigns',
    icon: <Megaphone className="w-5 h-5" />,
    title: 'Campaigns',
    recordCount: 47,
    formats: ['csv', 'pdf'],
    color: '#3b82f6',
    description: 'Campaign details and delivery stats',
  },
  {
    id: 'messages',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Messages',
    recordCount: 15230,
    formats: ['csv', 'json'],
    color: '#8b5cf6',
    description: 'Message logs and delivery receipts',
  },
  {
    id: 'analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Analytics',
    recordCount: 365,
    formats: ['csv', 'pdf'],
    color: '#ec4899',
    description: 'Performance metrics and trends',
  },
]

const exportHistory: ExportHistoryItem[] = [
  { id: '1', title: 'Contacts Export', format: 'CSV', date: 'Mar 4, 2026 2:30 PM', size: '2.4 MB', status: 'completed' },
  { id: '2', title: 'Campaign Report', format: 'PDF', date: 'Mar 3, 2026 11:15 AM', size: '1.8 MB', status: 'completed' },
  { id: '3', title: 'Message Log', format: 'JSON', date: 'Mar 2, 2026 4:45 PM', size: '5.1 MB', status: 'completed' },
  { id: '4', title: 'Analytics Report', format: 'PDF', date: 'Mar 1, 2026 9:00 AM', size: '3.2 MB', status: 'completed' },
  { id: '5', title: 'Contacts Export', format: 'vCard', date: 'Feb 28, 2026 3:20 PM', size: '4.7 MB', status: 'failed' },
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

function generateMockCSV(type: string): string {
  if (type === 'contacts') {
    return 'Name,Phone,Email,Company,Tags,Status\nJohn Doe,+1234567890,john@example.com,Acme Inc,"VIP,Active",Active\nSarah Miller,+447911123456,sarah@example.com,Tech Corp,"Lead,New",Active\nMike Johnson,+15551234567,mike@example.com,Global Ltd,"Customer",Inactive\nEmma Wilson,+61412345678,emma@example.com,StartUp Co,"Prospect",Active\n'
  }
  if (type === 'campaigns') {
    return 'Campaign Name,Status,Sent,Delivered,Replied,Delivery Rate\nProduct Launch Promo,Completed,452,401,89,88.7%\nFlash Sale Alert,Active,1247,1147,234,92.0%\nWelcome Series,Completed,312,296,78,94.9%\nMonthly Digest,Scheduled,0,0,0,N/A\n'
  }
  if (type === 'messages') {
    return 'Timestamp,Contact,Direction,Message,Status\n2026-03-04 14:30,John Doe,Outgoing,Hey John! Check our new product,Delivered\n2026-03-04 14:31,John Doe,Incoming,Thanks! I will check it out,Read\n2026-03-04 15:00,Sarah Miller,Outgoing,Hi Sarah! Your order is ready,Delivered\n'
  }
  return 'Date,Messages Sent,Messages Delivered,Replies,Delivery Rate,Reply Rate\n2026-03-04,452,401,89,88.7%,22.2%\n2026-03-03,380,352,76,92.6%,21.6%\n2026-03-02,520,489,112,94.0%,22.9%\n'
}

function generateMockJSON(type: string): string {
  if (type === 'contacts') {
    return JSON.stringify([
      { name: 'John Doe', phone: '+1234567890', email: 'john@example.com', company: 'Acme Inc', tags: ['VIP', 'Active'], status: 'Active' },
      { name: 'Sarah Miller', phone: '+447911123456', email: 'sarah@example.com', company: 'Tech Corp', tags: ['Lead', 'New'], status: 'Active' },
      { name: 'Mike Johnson', phone: '+15551234567', email: 'mike@example.com', company: 'Global Ltd', tags: ['Customer'], status: 'Inactive' },
    ], null, 2)
  }
  if (type === 'messages') {
    return JSON.stringify([
      { timestamp: '2026-03-04T14:30:00Z', contact: 'John Doe', direction: 'Outgoing', message: 'Hey John! Check our new product', status: 'Delivered' },
      { timestamp: '2026-03-04T14:31:00Z', contact: 'John Doe', direction: 'Incoming', message: 'Thanks! I will check it out', status: 'Read' },
    ], null, 2)
  }
  return JSON.stringify({ date: '2026-03-04', messagesSent: 452, messagesDelivered: 401, replies: 89, deliveryRate: '88.7%', replyRate: '22.2%' }, null, 2)
}

function generateMockVCard(): string {
  return `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
ORG:Acme Inc
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Sarah Miller
TEL:+447911123456
EMAIL:sarah@example.com
ORG:Tech Corp
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Mike Johnson
TEL:+15551234567
EMAIL:mike@example.com
ORG:Global Ltd
END:VCARD`
}

export function DataExportPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState(0)

  const handleExport = useCallback(
    (option: ExportOption, format: ExportFormat) => {
      setExportingId(option.id)
      setExportProgress(0)

      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 25
        })
      }, 200)

      // Simulate export delay then download
      setTimeout(() => {
        clearInterval(progressInterval)
        setExportProgress(100)

        let content: string
        let mimeType: string
        let extension: string

        if (format === 'csv') {
          content = generateMockCSV(option.id)
          mimeType = 'text/csv'
          extension = 'csv'
        } else if (format === 'json') {
          content = generateMockJSON(option.id)
          mimeType = 'application/json'
          extension = 'json'
        } else if (format === 'vcard') {
          content = generateMockVCard()
          mimeType = 'text/vcard'
          extension = 'vcf'
        } else {
          // PDF - generate a simple text file as placeholder
          content = `EAJE WhatsBot - ${option.title} Report\nGenerated: ${new Date().toLocaleString()}\nDate Range: ${dateRangeOptions.find(d => d.id === dateRange)?.label}\n\nThis is a simulated PDF export.\nIn production, this would contain formatted charts and tables.`
          mimeType = 'text/plain'
          extension = 'txt'
        }

        // Create Blob and trigger download
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `eaje-${option.id}-${new Date().toISOString().slice(0, 10)}.${extension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setExportingId(null)
        setExportProgress(0)

        addToast({
          type: 'success',
          title: 'Export Complete',
          message: `${option.title} exported as ${format.toUpperCase()} successfully`,
          duration: 3000,
        })
      }, 1500)
    },
    [dateRange, addToast]
  )

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
                  <span className="text-[10px] text-white/30 font-medium">{option.recordCount.toLocaleString()} records</span>
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
                    return (
                      <motion.button
                        key={format}
                        onClick={() => !isExporting && handleExport(option, format)}
                        disabled={isExporting}
                        whileTap={!isExporting ? { scale: 0.95 } : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                          isExporting
                            ? 'bg-white/[0.02] text-white/20 border border-white/[0.04] cursor-not-allowed'
                            : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.12]'
                        }`}
                        style={
                          !isExporting
                            ? { boxShadow: `0 0 10px ${config.color}08` }
                            : undefined
                        }
                      >
                        <div style={{ color: isExporting ? 'rgba(255,255,255,0.2)' : config.color }}>
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
      </motion.div>
    </div>
  )
}

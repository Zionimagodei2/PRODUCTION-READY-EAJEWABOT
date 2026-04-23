'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Filter, Search, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ArrowLeft, Hash } from 'lucide-react'

interface Report {
  id: string
  campaignName: string
  date: string
  totalSent: number
  delivered: number
  read: number
  replied: number
  failed: number
  status: 'completed' | 'partial' | 'failed'
}

const mockReports: Report[] = [
  { id: '1', campaignName: 'Product Launch Promo', date: '2024-01-15', totalSent: 1000, delivered: 912, read: 756, replied: 234, failed: 88, status: 'completed' },
  { id: '2', campaignName: 'Weekly Newsletter #12', date: '2024-01-14', totalSent: 500, delivered: 467, read: 389, replied: 67, failed: 33, status: 'completed' },
  { id: '3', campaignName: 'Holiday Greetings', date: '2024-01-10', totalSent: 800, delivered: 756, read: 612, replied: 92, failed: 44, status: 'completed' },
  { id: '4', campaignName: 'Flash Sale Alert', date: '2024-01-14', totalSent: 600, delivered: 510, read: 398, replied: 45, failed: 90, status: 'partial' },
  { id: '5', campaignName: 'Customer Follow-up', date: '2024-01-13', totalSent: 200, delivered: 145, read: 89, replied: 12, failed: 55, status: 'failed' },
]

export function CampaignReportsPage() {
  const { goBack } = useAppStore()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filtered = mockReports.filter(r => {
    const matchSearch = r.campaignName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.status === filter
    return matchSearch && matchFilter
  })

  const statusConfig = {
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Completed' },
    partial: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Partial' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed' },
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
            <FileText className="w-5 h-5 text-red-400" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }} />
            <h2 className="text-lg font-extrabold text-white/95 tracking-tight">Campaign Reports</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5">Detailed delivery reports</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-white/40">Avg Delivery Rate</p>
          <p className="text-xl font-bold text-neon-green mt-0.5">89.3%</p>
        </div>
        <div className="glass-card rounded-xl p-3">
          <p className="text-xs text-white/40">Avg Reply Rate</p>
          <p className="text-xl font-bold text-neon-blue mt-0.5">30.5%</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-red/40"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'partial', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                filter === f
                  ? 'bg-neon-red/15 text-neon-red border-neon-red/25'
                  : 'bg-white/5 text-white/40 border-white/5'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-2.5">
        {filtered.map((report, i) => {
          const config = statusConfig[report.status]
          const deliveryRate = ((report.delivered / report.totalSent) * 100).toFixed(1)
          const readRate = ((report.read / report.delivered) * 100).toFixed(1)
          const replyRate = ((report.replied / report.read) * 100).toFixed(1)
          const isExpanded = expandedId === report.id

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white/90 truncate">{report.campaignName}</h3>
                    <p className="text-[10px] text-white/30 mt-0.5">{report.date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
                      {config.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 text-[10px]">
                  <span className="text-white/40">
                    <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-400" />
                    {report.delivered}/{report.totalSent}
                  </span>
                  <span className="text-white/40">
                    <Eye className="w-3 h-3 inline mr-0.5 text-blue-400" />
                    {report.read}
                  </span>
                  <span className="text-white/40">
                    <XCircle className="w-3 h-3 inline mr-0.5 text-red-400" />
                    {report.failed}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-white/5 p-4 space-y-3"
                >
                  {/* Detailed Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-emerald-400">{deliveryRate}%</p>
                      <p className="text-[9px] text-white/30">Delivery</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-blue-400">{readRate}%</p>
                      <p className="text-[9px] text-white/30">Read</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2.5 text-center">
                      <p className="text-sm font-bold text-amber-400">{replyRate}%</p>
                      <p className="text-[9px] text-white/30">Reply</p>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2">
                    {[
                      { label: 'Delivered', value: report.delivered, total: report.totalSent, color: 'from-emerald-500 to-emerald-400' },
                      { label: 'Read', value: report.read, total: report.totalSent, color: 'from-blue-500 to-blue-400' },
                      { label: 'Replied', value: report.replied, total: report.totalSent, color: 'from-purple-500 to-purple-400' },
                      { label: 'Failed', value: report.failed, total: report.totalSent, color: 'from-red-500 to-red-400' },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
                          <span>{stat.label}</span>
                          <span>{stat.value} / {stat.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                            style={{ width: `${(stat.value / stat.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-white/40 border border-white/10 text-xs hover:bg-white/10 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export Full Report
                  </button>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Filter, Search, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ArrowLeft, Hash, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'

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
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Completed', glow: '0 0 10px rgba(34,197,94,0.15)' },
    partial: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Partial', glow: '0 0 10px rgba(245,158,11,0.15)' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Failed', glow: '0 0 10px rgba(239,68,68,0.15)' },
  }

  // Summary stats
  const totalSent = mockReports.reduce((a, r) => a + r.totalSent, 0)
  const totalDelivered = mockReports.reduce((a, r) => a + r.delivered, 0)
  const totalFailed = mockReports.reduce((a, r) => a + r.failed, 0)
  const avgDeliveryRate = ((totalDelivered / totalSent) * 100).toFixed(1)

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

      {/* Summary Stats - Enhanced */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Total Sent', value: totalSent.toLocaleString(), color: '#3b82f6', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { label: 'Avg Delivery', value: `${avgDeliveryRate}%`, color: '#22c55e', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { label: 'Total Failed', value: totalFailed.toLocaleString(), color: '#ef4444', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-3 text-center card-hover-lift"
            style={{ borderTop: `2px solid ${stat.color}` }}
          >
            <div
              className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1.5"
              style={{ backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}20`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <p className="text-lg font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[9px] text-white/40 font-semibold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="gradient-divider" />

      {/* Search & Filter - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'partial', 'failed'].map((f) => {
            const fColor = f === 'all' ? '#8b5cf6' : f === 'completed' ? '#22c55e' : f === 'partial' ? '#f59e0b' : '#ef4444'
            return (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all duration-200 ${
                  filter === f
                    ? 'text-white/90 border-opacity-40'
                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                }`}
                style={filter === f ? {
                  backgroundColor: `${fColor}15`,
                  borderColor: `${fColor}30`,
                  color: fColor,
                  boxShadow: `0 0 10px ${fColor}15`,
                } : undefined}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Reports List - Enhanced */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Reports</span>
          <div className="flex-1 gradient-divider" />
          <span className="text-[9px] text-white/20">{filtered.length} results</span>
        </div>

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
              className="glass-card rounded-2xl overflow-hidden card-hover-lift"
              style={{ borderLeft: `2px solid ${report.status === 'completed' ? '#22c55e' : report.status === 'partial' ? '#f59e0b' : '#ef4444'}` }}
            >
              <motion.button
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                whileTap={{ scale: 0.99 }}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white/90 truncate">{report.campaignName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-white/30">{report.date}</p>
                      <span className="text-white/10">·</span>
                      <p className="text-[10px] text-white/30">{report.totalSent.toLocaleString()} sent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.color} ${config.border} border`}
                      style={{ boxShadow: config.glow }}
                    >
                      {config.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Quick Stats - Enhanced with color-coded icons */}
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-white/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400/70" />
                    {report.delivered}
                  </span>
                  <span className="flex items-center gap-1 text-white/40">
                    <Eye className="w-3 h-3 text-blue-400/70" />
                    {report.read}
                  </span>
                  <span className="flex items-center gap-1 text-white/40">
                    <XCircle className="w-3 h-3 text-red-400/70" />
                    {report.failed}
                  </span>
                </div>

                {/* Mini delivery progress bar */}
                <div className="mt-2 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(report.delivered / report.totalSent) * 100}%`,
                      background: report.status === 'completed'
                        ? 'linear-gradient(90deg, rgba(34,197,94,0.5), rgba(34,197,94,0.8))'
                        : report.status === 'partial'
                          ? 'linear-gradient(90deg, rgba(245,158,11,0.5), rgba(245,158,11,0.8))'
                          : 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(239,68,68,0.8))',
                      boxShadow: `0 0 4px ${report.status === 'completed' ? 'rgba(34,197,94,0.2)' : report.status === 'partial' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  />
                </div>
              </motion.button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/[0.04]"
                  >
                    <div className="p-4 space-y-3">
                      {/* Detailed Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Delivery', value: deliveryRate, color: '#22c55e' },
                          { label: 'Read', value: readRate, color: '#3b82f6' },
                          { label: 'Reply', value: replyRate, color: '#f59e0b' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white/[0.03] rounded-xl p-2.5 text-center border border-white/[0.04]">
                            <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}%</p>
                            <p className="text-[9px] text-white/30">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Funnel visualization */}
                      <div className="space-y-2">
                        {[
                          { label: 'Delivered', value: report.delivered, total: report.totalSent, color: '#22c55e' },
                          { label: 'Read', value: report.read, total: report.totalSent, color: '#3b82f6' },
                          { label: 'Replied', value: report.replied, total: report.totalSent, color: '#8b5cf6' },
                          { label: 'Failed', value: report.failed, total: report.totalSent, color: '#ef4444' },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <div className="flex justify-between text-[10px] text-white/30 mb-0.5">
                              <span>{stat.label}</span>
                              <span>{stat.value} / {stat.total}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(stat.value / stat.total) * 100}%`,
                                  background: `linear-gradient(90deg, ${stat.color}50, ${stat.color})`,
                                  boxShadow: `0 0 4px ${stat.color}30`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(stat.value / stat.total) * 100}%` }}
                                transition={{ duration: 0.4 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] text-white/50 border border-white/[0.06] text-xs font-semibold hover:bg-white/[0.08] hover:text-white/70 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Full Report
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <FileText className="w-10 h-10 mx-auto text-white/10 mb-3" />
          <p className="text-sm text-white/40 font-medium">No reports found</p>
          <p className="text-xs text-white/20 mt-1">Try adjusting your search or filters</p>
        </motion.div>
      )}
    </div>
  )
}

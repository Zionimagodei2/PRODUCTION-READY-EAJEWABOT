'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { ArrowLeft, Activity, RefreshCw, Clock, AlertTriangle, CheckCircle2, Wifi, Server, MessageSquare, Database, Calendar, HardDrive, XCircle } from 'lucide-react'

type ServiceStatus = 'connected' | 'degraded' | 'down'

interface Service {
  name: string
  icon: React.ReactNode
  status: ServiceStatus
  latency: number
  uptime: number
  lastChecked: Date
}

interface Incident {
  id: string
  title: string
  severity: 'critical' | 'warning' | 'info'
  time: string
  resolution: string
  resolved: boolean
}

const initialServices: Service[] = [
  { name: 'WhatsApp Business API', icon: <MessageSquare className="w-4 h-4" />, status: 'connected', latency: 45, uptime: 99.97, lastChecked: new Date() },
  { name: 'Message Delivery Service', icon: <Wifi className="w-4 h-4" />, status: 'connected', latency: 23, uptime: 99.99, lastChecked: new Date() },
  { name: 'AI Chat Engine', icon: <Server className="w-4 h-4" />, status: 'connected', latency: 180, uptime: 99.85, lastChecked: new Date() },
  { name: 'Contact Database', icon: <Database className="w-4 h-4" />, status: 'connected', latency: 12, uptime: 100, lastChecked: new Date() },
  { name: 'Campaign Scheduler', icon: <Calendar className="w-4 h-4" />, status: 'connected', latency: 34, uptime: 99.95, lastChecked: new Date() },
  { name: 'Media Storage', icon: <HardDrive className="w-4 h-4" />, status: 'connected', latency: 67, uptime: 99.92, lastChecked: new Date() },
]

const incidents: Incident[] = [
  { id: '1', title: 'AI Chat Engine - High Latency', severity: 'warning', time: '2 hours ago', resolution: 'Auto-scaled compute resources. Latency returned to normal.', resolved: true },
  { id: '2', title: 'WhatsApp API - Rate Limit Warning', severity: 'warning', time: '1 day ago', resolution: 'Adjusted send rate to comply with API limits.', resolved: true },
  { id: '3', title: 'Media Storage - Upload Timeout', severity: 'critical', time: '3 days ago', resolution: 'Migrated to CDN-backed storage. Issue resolved within 15 minutes.', resolved: true },
]

function getLatencyColor(latency: number): string {
  if (latency < 50) return '#22c55e'
  if (latency <= 150) return '#f59e0b'
  return '#ef4444'
}

function getLatencyLabel(latency: number): string {
  if (latency < 50) return 'Excellent'
  if (latency <= 150) return 'Fair'
  return 'Slow'
}

function getStatusColor(status: ServiceStatus): string {
  if (status === 'connected') return '#22c55e'
  if (status === 'degraded') return '#f59e0b'
  return '#ef4444'
}

function getSeverityColor(severity: Incident['severity']): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' }
    case 'warning': return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' }
    case 'info': return { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' }
  }
}

export function ApiHealthPage() {
  const { goBack } = useAppStore()
  const [services, setServices] = useState(initialServices)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)

  // Auto-update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastCheckedTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastCheckedTime])

  const allOperational = services.every((s) => s.status === 'connected')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latency: Math.max(5, s.latency + Math.floor(Math.random() * 20) - 10),
          lastChecked: new Date(),
        }))
      )
      setLastCheckedTime(new Date())
      setSecondsAgo(0)
      setIsRefreshing(false)
    }, 2000)
  }

  const formatSecondsAgo = (s: number) => {
    if (s < 60) return `${s} second${s !== 1 ? 's' : ''} ago`
    const m = Math.floor(s / 60)
    return `${m} minute${m !== 1 ? 's' : ''} ago`
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', boxShadow: '0 0 15px rgba(34,197,94,0.15)' }}>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white/95">API Health Monitor</h1>
            <p className="text-[10px] text-white/40">Real-time service status</p>
          </div>
        </div>
      </div>

      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4"
        style={{
          borderLeft: `3px solid ${allOperational ? '#22c55e' : '#ef4444'}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: allOperational ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                boxShadow: `0 0 12px ${allOperational ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              {allOperational ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/90">
                {allOperational ? 'All Systems Operational' : 'Partial Outage Detected'}
              </h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                Last checked {formatSecondsAgo(secondsAgo)}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Service Status Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Services</span>
          <div className="flex-1 gradient-divider" />
        </div>

        {services.map((service, i) => {
          const latencyColor = getLatencyColor(service.latency)
          const statusColor = getStatusColor(service.status)
          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 space-y-3"
            >
              {/* Service header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}25` }}
                  >
                    <div style={{ color: statusColor }}>{service.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-[12px] font-semibold text-white/85">{service.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}60` }}
                      />
                      <span className="text-[9px] font-medium" style={{ color: statusColor }}>
                        {service.status === 'connected' ? 'Connected' : service.status === 'degraded' ? 'Degraded' : 'Down'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4">
                {/* Latency */}
                <div className="flex-1">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mb-1">Latency</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: latencyColor }}>
                      {service.latency}ms
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: latencyColor }}>
                      {getLatencyLabel(service.latency)}
                    </span>
                  </div>
                </div>

                {/* Uptime */}
                <div className="flex-1">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mb-1">Uptime</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/85">{service.uptime}%</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${service.uptime}%`,
                          background: `linear-gradient(90deg, ${statusColor}, ${statusColor}80)`,
                          boxShadow: `0 0 4px ${statusColor}40`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Last checked */}
              <div className="flex items-center gap-1 text-[9px] text-white/20">
                <Clock className="w-2.5 h-2.5" />
                <span>Last checked {formatSecondsAgo(secondsAgo)}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Incidents */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Recent Incidents</span>
          <div className="flex-1 gradient-divider" />
        </div>

        {incidents.map((incident, i) => {
          const severityConfig = getSeverityColor(incident.severity)
          return (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: severityConfig.bg, border: `1px solid ${severityConfig.border}` }}
                >
                  {incident.severity === 'critical' ? (
                    <XCircle className="w-3.5 h-3.5" style={{ color: severityConfig.text }} />
                  ) : incident.severity === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: severityConfig.text }} />
                  ) : (
                    <Activity className="w-3.5 h-3.5" style={{ color: severityConfig.text }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[11px] font-semibold text-white/80">{incident.title}</h4>
                    {incident.resolved && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/30 mt-0.5">{incident.time}</p>
                  <p className="text-[10px] text-white/40 mt-1.5">{incident.resolution}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

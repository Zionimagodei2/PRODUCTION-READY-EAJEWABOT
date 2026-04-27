'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from '@/lib/framer-shim'
import { useAppStore } from '@/store/app-store'
import { ArrowLeft, Activity, RotateCw, Clock, AlertTriangle, CheckCircle2, Wifi, Server, MessageSquare, Database, Calendar, HardDrive, Inbox } from 'lucide-react'

type ServiceStatus = 'connected' | 'degraded' | 'down' | 'unchecked'

interface Service {
  name: string
  icon: React.ReactNode
  status: ServiceStatus
  latency: number
  uptime: number
  pingEndpoint: string
  lastChecked: Date | null
}

interface Incident {
  id: string
  title: string
  severity: 'critical' | 'warning' | 'info'
  time: string
  resolution: string
  resolved: boolean
}

const serviceDefinitions: Omit<Service, 'status' | 'latency' | 'uptime' | 'lastChecked'>[] = [
  { name: 'WhatsApp Business API', icon: <MessageSquare className="w-4 h-4" />, pingEndpoint: '/api/stats' },
  { name: 'Message Delivery Service', icon: <Wifi className="w-4 h-4" />, pingEndpoint: '/api/campaigns' },
  { name: 'AI Chat Engine', icon: <Server className="w-4 h-4" />, pingEndpoint: '/api/ai-chat' },
  { name: 'Contact Database', icon: <Database className="w-4 h-4" />, pingEndpoint: '/api/contacts' },
  { name: 'Campaign Scheduler', icon: <Calendar className="w-4 h-4" />, pingEndpoint: '/api/campaigns' },
  { name: 'Media Storage', icon: <HardDrive className="w-4 h-4" />, pingEndpoint: '/api/conversations' },
]

function getLatencyColor(latency: number): string {
  if (latency === 0) return 'rgba(255,255,255,0.2)'
  if (latency < 50) return '#22c55e'
  if (latency <= 150) return '#f59e0b'
  return '#ef4444'
}

function getLatencyLabel(latency: number): string {
  if (latency === 0) return 'Not tested'
  if (latency < 50) return 'Excellent'
  if (latency <= 150) return 'Fair'
  return 'Slow'
}

function getStatusColor(status: ServiceStatus): string {
  if (status === 'connected') return '#22c55e'
  if (status === 'degraded') return '#f59e0b'
  if (status === 'down') return '#ef4444'
  return 'rgba(255,255,255,0.2)'
}

function getStatusLabel(status: ServiceStatus): string {
  if (status === 'connected') return 'Connected'
  if (status === 'degraded') return 'Degraded'
  if (status === 'down') return 'Down'
  return 'Not checked'
}

export function ApiHealthPage() {
  const { goBack } = useAppStore()
  const [services, setServices] = useState<Service[]>(
    serviceDefinitions.map(s => ({
      ...s,
      status: 'unchecked' as ServiceStatus,
      latency: 0,
      uptime: 0,
      lastChecked: null,
    }))
  )
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [hasChecked, setHasChecked] = useState(false)

  // Auto-update timer
  useEffect(() => {
    if (!lastCheckedTime) return
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastCheckedTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastCheckedTime])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    const now = new Date()

    // Ping each service endpoint and measure real response time
    const updatedServices = await Promise.all(
      serviceDefinitions.map(async (def) => {
        try {
          const startTime = performance.now()
          const res = await fetch(def.pingEndpoint, {
            method: 'GET',
            signal: AbortSignal.timeout(10000), // 10s timeout
          })
          const endTime = performance.now()
          const latency = Math.round(endTime - startTime)

          let status: ServiceStatus = 'connected'
          if (!res.ok) {
            status = res.status >= 500 ? 'down' : 'degraded'
          } else if (latency > 500) {
            status = 'degraded'
          }

          // Check for new incidents (services that are down or degraded)
          if (status === 'down' || status === 'degraded') {
            setIncidents(prev => {
              // Only add if we don't already have a recent incident for this service
              const existing = prev.find(inc => inc.title.includes(def.name))
              if (existing) return prev
              return [{
                id: `inc-${Date.now()}-${def.name}`,
                title: `${def.name} - ${status === 'down' ? 'Service Down' : 'High Latency'}`,
                severity: status === 'down' ? 'critical' as const : 'warning' as const,
                time: 'Just now',
                resolution: status === 'down' ? 'Service is not responding. Investigating...' : 'Latency is above acceptable threshold.',
                resolved: false,
              }, ...prev].slice(0, 10) // Keep only last 10 incidents
            })
          }

          return {
            ...def,
            status,
            latency,
            uptime: status === 'connected' ? 100 : status === 'degraded' ? 95 : 0,
            lastChecked: now,
          }
        } catch {
          // Service is down or unreachable
          setIncidents(prev => {
            const existing = prev.find(inc => inc.title.includes(def.name))
            if (existing) return prev
            return [{
              id: `inc-${Date.now()}-${def.name}`,
              title: `${def.name} - Service Down`,
              severity: 'critical' as const,
              time: 'Just now',
              resolution: 'Service is not responding. Check network connectivity.',
              resolved: false,
            }, ...prev].slice(0, 10)
          })

          return {
            ...def,
            status: 'down' as ServiceStatus,
            latency: 0,
            uptime: 0,
            lastChecked: now,
          }
        }
      })
    )

    setServices(updatedServices)
    setLastCheckedTime(now)
    setSecondsAgo(0)
    setHasChecked(true)
    setIsRefreshing(false)
  }, [])

  const allOperational = services.every((s) => s.status === 'connected' || s.status === 'unchecked')
  const anyDown = services.some(s => s.status === 'down')

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
          borderLeft: `3px solid ${!hasChecked ? 'rgba(255,255,255,0.1)' : anyDown ? '#ef4444' : '#22c55e'}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: !hasChecked ? 'rgba(255,255,255,0.05)' : anyDown ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                boxShadow: `0 0 12px ${!hasChecked ? 'rgba(255,255,255,0.05)' : anyDown ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              }}
            >
              {!hasChecked ? (
                <Activity className="w-5 h-5 text-white/30" />
              ) : anyDown ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white/90">
                {!hasChecked ? 'Run Health Check' : anyDown ? 'Partial Outage Detected' : 'All Systems Operational'}
              </h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                {lastCheckedTime ? `Last checked ${formatSecondsAgo(secondsAgo)}` : 'Not checked yet'}
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 text-white/50 ${isRefreshing ? 'animate-spin' : ''}`} />
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
                        style={{ backgroundColor: statusColor, boxShadow: service.status !== 'unchecked' ? `0 0 6px ${statusColor}60` : 'none' }}
                      />
                      <span className="text-[9px] font-medium" style={{ color: statusColor }}>
                        {getStatusLabel(service.status)}
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
                      {service.latency > 0 ? `${service.latency}ms` : '—'}
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
                    <span className="text-sm font-bold text-white/85">
                      {service.uptime > 0 ? `${service.uptime}%` : '—'}
                    </span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: service.uptime > 0 ? `${service.uptime}%` : '0%',
                          background: service.uptime > 0 ? `linear-gradient(90deg, ${statusColor}, ${statusColor}80)` : 'rgba(255,255,255,0.05)',
                          boxShadow: service.uptime > 0 ? `0 0 4px ${statusColor}40` : 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Last checked */}
              <div className="flex items-center gap-1 text-[9px] text-white/20">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {service.lastChecked
                    ? `Last checked ${formatSecondsAgo(secondsAgo)}`
                    : 'Not checked yet'}
                </span>
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

        {incidents.length > 0 ? (
          incidents.map((incident, i) => {
            const severityConfig = {
              critical: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
              warning: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
              info: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
            }[incident.severity]
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
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: severityConfig.text }} />
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
          })
        ) : (
          <div className="glass-card rounded-xl p-6 text-center">
            <Inbox className="w-8 h-8 mx-auto text-white/10 mb-2" />
            <p className="text-[11px] text-white/30">No incidents recorded</p>
            <p className="text-[10px] text-white/20 mt-0.5">Incidents will appear when health checks detect issues</p>
          </div>
        )}
      </div>
    </div>
  )
}

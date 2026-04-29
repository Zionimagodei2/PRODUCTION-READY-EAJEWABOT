'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft, Shield, ShieldAlert, ShieldCheck, ShieldX,
  Activity, Clock, Flame, AlertTriangle, StopCircle,
  ChevronDown, ChevronUp, Zap, Eye, Keyboard, Wifi,
  UserCheck, Users, Timer, TrendingUp, CalendarDays,
  Globe, CheckCircle2, Info,
  OctagonX, HeartPulse, Gauge, MessageSquare, Send
} from 'lucide-react'

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface ActivityLogEntry {
  id: string
  action: string
  time: string
  type: 'safe' | 'warning' | 'danger'
}

interface BehaviorMetrics {
  humanBehaviorScore: number
  medianIntervalSeconds: number
  p95IntervalSeconds: number
  burstRatioPercent: number
  offHoursRatioPercent: number
  duplicateRatioPercent: number
  activeHourSpread: number
  recommendations: string[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function AntiBanPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  // ── Protection Dashboard State ──
  const [lastActivity, setLastActivity] = useState('2 min ago')

  // ── Sending Limits State ──
  const [dailyLimit, setDailyLimit] = useState(200)
  const [hourlyLimit, setHourlyLimit] = useState(25)
  const [delayBetween, setDelayBetween] = useState(15)
  const [randomDelay, setRandomDelay] = useState(true)
  const [maxPerContact, setMaxPerContact] = useState(5)

  // ── Anti-Detection State ──
  const [messageVariation, setMessageVariation] = useState(true)
  const [typingSimulation, setTypingSimulation] = useState(true)
  const [onlinePattern, setOnlinePattern] = useState(false)
  const [profileSimulation, setProfileSimulation] = useState(false)
  const [groupThrottle, setGroupThrottle] = useState(true)

  // ── Schedule State ──
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]) // Mon-Fri
  const [morningWindow, setMorningWindow] = useState<[number, number]>([8, 12])
  const [afternoonWindow, setAfternoonWindow] = useState<[number, number]>([13, 17])
  const [eveningWindow, setEveningWindow] = useState<[number, number]>([18, 21])
  const [timezone, setTimezone] = useState('UTC-5 (EST)')
  const [showScheduleGrid, setShowScheduleGrid] = useState(false)

  // ── Ban Recovery State ──
  const [isBanned, setIsBanned] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [showRecoveryGuide, setShowRecoveryGuide] = useState(false)

  // ── Activity Log ──
  const [activityLog] = useState<ActivityLogEntry[]>([
    { id: '1', action: 'Sent 45 messages (within limits)', time: '2 min ago', type: 'safe' },
    { id: '2', action: 'Delay randomized +3.2s', time: '5 min ago', type: 'safe' },
    { id: '3', action: 'Typing simulation triggered', time: '8 min ago', type: 'safe' },
    { id: '4', action: 'Hourly limit reached (25/25)', time: '32 min ago', type: 'warning' },
    { id: '5', action: 'Skipped duplicate message', time: '45 min ago', type: 'safe' },
    { id: '6', action: 'Near daily limit (180/200)', time: '1h ago', type: 'warning' },
    { id: '7', action: 'Rapid sending detected (3 in 5s)', time: '2h ago', type: 'danger' },
    { id: '8', action: 'Group join throttled', time: '3h ago', type: 'safe' },
  ])

  // ── Statistics State ──
  const [messagesSentToday, setMessagesSentToday] = useState(0)
  const [behavior, setBehavior] = useState<BehaviorMetrics>({
    humanBehaviorScore: 100,
    medianIntervalSeconds: 0,
    p95IntervalSeconds: 0,
    burstRatioPercent: 0,
    offHoursRatioPercent: 0,
    duplicateRatioPercent: 0,
    activeHourSpread: 0,
    recommendations: [],
  })
  const [streakDays] = useState(14)
  const [nextSafeWindow, setNextSafeWindow] = useState('In 12 min')

  useEffect(() => {
    async function loadAntiBanConfig() {
      try {
        const res = await fetch('/api/anti-ban')
        if (!res.ok) throw new Error('Failed to load anti-ban settings')
        const data = await res.json()
        const cfg = data.config || {}

        setDailyLimit(cfg.dailyLimit ?? 200)
        setHourlyLimit(cfg.hourlyLimit ?? 25)
        setDelayBetween(cfg.delayBetween ?? 15)
        setRandomDelay(cfg.randomDelay ?? true)
        setMaxPerContact(cfg.maxPerContact ?? 5)
        setMessageVariation(cfg.messageVariation ?? true)
        setTypingSimulation(cfg.typingSimulation ?? true)
        setOnlinePattern(cfg.onlinePattern ?? false)
        setProfileSimulation(cfg.profileSimulation ?? false)
        setGroupThrottle(cfg.groupThrottle ?? true)
        setActiveDays(Array.isArray(cfg.activeDays) ? cfg.activeDays : [0, 1, 2, 3, 4])
        setMorningWindow(Array.isArray(cfg.morningWindow) ? cfg.morningWindow : [8, 12])
        setAfternoonWindow(Array.isArray(cfg.afternoonWindow) ? cfg.afternoonWindow : [13, 17])
        setEveningWindow(Array.isArray(cfg.eveningWindow) ? cfg.eveningWindow : [18, 21])
        setTimezone(cfg.timezone ?? 'UTC-5 (EST)')
        setMessagesSentToday(data.metrics?.messagesSentToday ?? 0)
        if (data.metrics?.behavior) {
          setBehavior(data.metrics.behavior)
        }
      } catch {
        addToast({ type: 'error', title: 'Load failed', message: 'Could not load anti-ban profile' })
      } finally {
        setLoadingConfig(false)
      }
    }
    loadAntiBanConfig()
  }, [addToast])

  const handleSaveConfig = useCallback(async () => {
    setSavingConfig(true)
    try {
      const config = {
        dailyLimit,
        hourlyLimit,
        delayBetween,
        randomDelay,
        maxPerContact,
        messageVariation,
        typingSimulation,
        onlinePattern,
        profileSimulation,
        groupThrottle,
        activeDays,
        morningWindow,
        afternoonWindow,
        eveningWindow,
        timezone,
      }
      const res = await fetch('/api/anti-ban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) throw new Error('Failed to save anti-ban profile')
      addToast({ type: 'success', title: 'Protection profile saved', message: 'Anti-ban settings updated' })
    } catch {
      addToast({ type: 'error', title: 'Save failed', message: 'Could not save anti-ban settings' })
    } finally {
      setSavingConfig(false)
    }
  }, [
    dailyLimit, hourlyLimit, delayBetween, randomDelay, maxPerContact,
    messageVariation, typingSimulation, onlinePattern, profileSimulation,
    groupThrottle, activeDays, morningWindow, afternoonWindow, eveningWindow,
    timezone, addToast
  ])

  // ── Derived ban probability from settings ──
  const banProbability = useMemo(() => {
    let prob = 5
    if (dailyLimit > 300) prob += 15
    else if (dailyLimit > 200) prob += 8
    if (hourlyLimit > 35) prob += 12
    else if (hourlyLimit > 25) prob += 5
    if (delayBetween < 10) prob += 15
    else if (delayBetween < 15) prob += 5
    if (!randomDelay) prob += 8
    if (!messageVariation) prob += 10
    if (!typingSimulation) prob += 5
    if (!groupThrottle) prob += 7
    if (maxPerContact > 10) prob += 10
    else if (maxPerContact > 5) prob += 4
    return Math.min(prob, 95)
  }, [dailyLimit, hourlyLimit, delayBetween, randomDelay, messageVariation, typingSimulation, groupThrottle, maxPerContact])

  // ── Derived risk level from ban probability ──
  const riskLevel: RiskLevel = useMemo(() => {
    if (banProbability > 60) return 'critical'
    if (banProbability > 35) return 'high'
    if (banProbability > 15) return 'medium'
    return 'low'
  }, [banProbability])

  // ── Derived health score ──
  const healthScore = useMemo(() => {
    return Math.max(5, 100 - banProbability - (banProbability > 30 ? 15 : 0))
  }, [banProbability])

  // ── Cooldown timer ──
  useEffect(() => {
    if (!isBanned || cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          setIsBanned(false)
          addToast({ type: 'success', title: 'Cooldown Complete', message: 'Your account is safe to send again' })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isBanned, cooldownSeconds, addToast])

  // Update "last activity" and "next safe window" periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLastActivity('Just now')
      setNextSafeWindow('Now')
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Handlers ──
  const handleEmergencyStop = useCallback(() => {
    setEmergencyActive(true)
    addToast({ type: 'warning', title: '🛑 Emergency Stop Activated', message: 'All sending has been halted immediately', duration: 5000 })
    setTimeout(() => setEmergencyActive(false), 10000)
  }, [addToast])

  const toggleDay = useCallback((dayIndex: number) => {
    setActiveDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    )
  }, [])

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Risk Level Config ──
  const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode; glowClass: string; textColor: string }> = {
    low: {
      label: 'Low Risk',
      color: '#22c55e',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/25',
      icon: <ShieldCheck className="w-5 h-5" />,
      glowClass: 'neon-glow-green',
      textColor: 'text-green-400',
    },
    medium: {
      label: 'Medium Risk',
      color: '#f59e0b',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/25',
      icon: <Shield className="w-5 h-5" />,
      glowClass: 'neon-glow-orange',
      textColor: 'text-amber-400',
    },
    high: {
      label: 'High Risk',
      color: '#f97316',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/25',
      icon: <ShieldAlert className="w-5 h-5" />,
      glowClass: 'neon-glow-orange',
      textColor: 'text-orange-400',
    },
    critical: {
      label: 'Critical!',
      color: '#ef4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/25',
      icon: <ShieldX className="w-5 h-5" />,
      glowClass: 'neon-glow-red',
      textColor: 'text-red-400',
    },
  }

  const currentRisk = riskConfig[riskLevel]

  // ── Schedule Grid: check if hour is in a window ──
  const isActiveHour = (dayIndex: number, hour: number) => {
    if (!activeDays.includes(dayIndex)) return false
    return (
      (hour >= morningWindow[0] && hour < morningWindow[1]) ||
      (hour >= afternoonWindow[0] && hour < afternoonWindow[1]) ||
      (hour >= eveningWindow[0] && hour < eveningWindow[1])
    )
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* ── Header ── */}
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
            <Shield className="w-5 h-5 text-neon-green neon-text-glow-green" />
            Anti-Ban Shield
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Protect your account from WhatsApp bans</p>
        </div>
        <motion.button
          onClick={handleSaveConfig}
          whileTap={{ scale: 0.95 }}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/40 hover:bg-white/10 transition-colors"
          disabled={savingConfig || loadingConfig}
          title="Save anti-ban profile"
        >
          {savingConfig ? 'Saving...' : 'Save'}
        </motion.button>
      </div>

      {loadingConfig && (
        <div className="text-center text-xs text-white/50 py-2">Loading anti-ban profile...</div>
      )}

      {/* ── 1. Protection Dashboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card rounded-2xl p-4 border border-white/[0.06] relative overflow-hidden"
        style={{
          boxShadow: `0 0 25px ${currentRisk.color}10`,
          borderColor: `${currentRisk.color}20`,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, ${currentRisk.color}08, transparent 70%)`,
          }}
        />

        <div className="relative z-10">
          {/* Risk Level Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentRisk.bgColor} border ${currentRisk.borderColor}`}>
                <span className={currentRisk.textColor}>{currentRisk.icon}</span>
              </div>
              <div>
                <span className={`text-sm font-bold ${currentRisk.textColor}`}>{currentRisk.label}</span>
                <p className="text-[9px] text-white/30">Protection Status</p>
              </div>
            </div>
            {isBanned && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-400 animate-pulse"
              >
                BANNED
              </motion.div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Health Score - Circular */}
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 ring-progress" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" strokeWidth="3" className="ring-progress-bg" style={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <circle
                    cx="18" cy="18" r="15.5" strokeWidth="3"
                    className="ring-progress-fill"
                    style={{
                      stroke: currentRisk.color,
                      strokeDasharray: 97.4,
                      strokeDashoffset: 97.4 - (healthScore / 100) * 97.4,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold text-white/90">{healthScore}</span>
                </div>
              </div>
              <p className="text-[9px] text-white/40 font-semibold mt-1">Health Score</p>
            </div>

            {/* Ban Probability */}
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${currentRisk.color} ${banProbability * 3.6}deg, transparent ${banProbability * 3.6}deg)`,
                    opacity: 0.3,
                  }}
                />
                <span className="text-sm font-extrabold relative z-10" style={{ color: currentRisk.color }}>
                  {banProbability}%
                </span>
              </div>
              <p className="text-[9px] text-white/40 font-semibold mt-1">Ban Risk</p>
            </div>

            {/* Last Activity */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-white/[0.06] flex items-center justify-center relative">
                <Activity className="w-5 h-5 text-white/30" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 animate-breathe" style={{ color: '#22c55e' }} />
              </div>
              <p className="text-[10px] text-white/50 font-semibold mt-1">{lastActivity}</p>
              <p className="text-[9px] text-white/30">Last Active</p>
            </div>
          </div>

          {/* Risk Gauge Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">Risk Gauge</span>
              <span className="text-[9px] font-bold" style={{ color: currentRisk.color }}>{banProbability}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${banProbability}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  background: `linear-gradient(90deg, #22c55e, #f59e0b, #f97316, #ef4444)`,
                }}
              />
              {/* Gauge markers */}
              <div className="absolute top-0 left-[15%] w-px h-full bg-white/10" />
              <div className="absolute top-0 left-[35%] w-px h-full bg-white/10" />
              <div className="absolute top-0 left-[60%] w-px h-full bg-white/10" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-green-400/40">Low</span>
              <span className="text-[8px] text-amber-400/40">Medium</span>
              <span className="text-[8px] text-orange-400/40">High</span>
              <span className="text-[8px] text-red-400/40">Critical</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. Statistics Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-2"
      >
        <div className="glass-card rounded-xl p-2.5 text-center stat-card-blue">
          <Send className="w-3.5 h-3.5 mx-auto text-blue-400 mb-1" />
          <p className="text-base font-extrabold text-neon-blue">{messagesSentToday}</p>
          <p className="text-[8px] text-white/40 font-semibold">/{dailyLimit}</p>
        </div>
        <div className="glass-card rounded-xl p-2.5 text-center stat-card-amber">
          <AlertTriangle className="w-3.5 h-3.5 mx-auto text-amber-400 mb-1" />
          <p className="text-base font-extrabold text-amber-400">{banProbability > 30 ? 3 : banProbability > 15 ? 1 : 0}</p>
          <p className="text-[8px] text-white/40 font-semibold">Risk Flags</p>
        </div>
        <div className="glass-card rounded-xl p-2.5 text-center stat-card-green">
          <Clock className="w-3.5 h-3.5 mx-auto text-green-400 mb-1" />
          <p className="text-[10px] font-bold text-green-400 leading-tight">{nextSafeWindow}</p>
          <p className="text-[8px] text-white/40 font-semibold">Next Safe</p>
        </div>
        <div className="glass-card rounded-xl p-2.5 text-center stat-card-orange">
          <Flame className="w-3.5 h-3.5 mx-auto text-orange-400 mb-1" />
          <p className="text-base font-extrabold text-orange-400">{streakDays}</p>
          <p className="text-[8px] text-white/40 font-semibold">Day Streak</p>
        </div>
      </motion.div>

      {/* ── 2b. Human Behavior Intelligence ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card rounded-2xl p-4 border border-cyan-500/15 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white/90">Human Behavior Pattern</h3>
          </div>
          <span className="text-xs font-extrabold text-cyan-300">{behavior.humanBehaviorScore}/100</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/[0.03] p-2">
            <p className="text-[11px] font-bold text-white/90">{behavior.medianIntervalSeconds}s</p>
            <p className="text-[9px] text-white/40">Median Gap</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2">
            <p className="text-[11px] font-bold text-white/90">{behavior.burstRatioPercent}%</p>
            <p className="text-[9px] text-white/40">Burst Ratio</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2">
            <p className="text-[11px] font-bold text-white/90">{behavior.offHoursRatioPercent}%</p>
            <p className="text-[9px] text-white/40">Off-hours</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {behavior.recommendations.slice(0, 2).map((tip) => (
            <p key={tip} className="text-[10px] text-white/60 flex gap-1.5">
              <Info className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
              <span>{tip}</span>
            </p>
          ))}
        </div>
      </motion.div>

      {/* ── 3. Sending Limits Configuration ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4 neon-glow-green border border-green-500/10 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90">Sending Limits</h3>
            <p className="text-[9px] text-white/35">Control your sending pace</p>
          </div>
        </div>

        {/* Daily Message Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-white/60 font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-green-400/60" /> Daily Limit
            </label>
            <span className="text-xs font-bold text-green-400">{dailyLimit}</span>
          </div>
          <Slider
            value={[dailyLimit]}
            min={50}
            max={500}
            step={10}
            onValueChange={([v]) => setDailyLimit(v)}
            className="[&_[data-slot=slider-track]]:bg-white/[0.06] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-green-500 [&_[data-slot=slider-range]]:to-emerald-400 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:border-green-500/50"
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>50</span><span>500</span>
          </div>
        </div>

        {/* Hourly Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-white/60 font-semibold flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-blue-400/60" /> Per Hour
            </label>
            <span className="text-xs font-bold text-blue-400">{hourlyLimit}</span>
          </div>
          <Slider
            value={[hourlyLimit]}
            min={5}
            max={50}
            step={1}
            onValueChange={([v]) => setHourlyLimit(v)}
            className="[&_[data-slot=slider-track]]:bg-white/[0.06] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-blue-500 [&_[data-slot=slider-range]]:to-cyan-400 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:border-blue-500/50"
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>5</span><span>50</span>
          </div>
        </div>

        {/* Delay Between Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-white/60 font-semibold flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-purple-400/60" /> Delay (seconds)
            </label>
            <span className="text-xs font-bold text-purple-400">{delayBetween}s</span>
          </div>
          <Slider
            value={[delayBetween]}
            min={5}
            max={60}
            step={1}
            onValueChange={([v]) => setDelayBetween(v)}
            className="[&_[data-slot=slider-track]]:bg-white/[0.06] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-purple-500 [&_[data-slot=slider-range]]:to-pink-400 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:border-purple-500/50"
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>5s</span><span>60s</span>
          </div>
        </div>

        {/* Max Per Contact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-white/60 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3 h-3 text-amber-400/60" /> Max/Contact/Day
            </label>
            <span className="text-xs font-bold text-amber-400">{maxPerContact}</span>
          </div>
          <Slider
            value={[maxPerContact]}
            min={1}
            max={20}
            step={1}
            onValueChange={([v]) => setMaxPerContact(v)}
            className="[&_[data-slot=slider-track]]:bg-white/[0.06] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-amber-500 [&_[data-slot=slider-range]]:to-orange-400 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4 [&_[data-slot=slider-thumb]]:border-amber-500/50"
          />
          <div className="flex justify-between text-[8px] text-white/20">
            <span>1</span><span>20</span>
          </div>
        </div>

        {/* Random Delay Toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400/60" />
            <div>
              <p className="text-[11px] text-white/70 font-semibold">Random Delay Offset</p>
              <p className="text-[9px] text-white/30">+/- random time to appear human</p>
            </div>
          </div>
          <Switch
            checked={randomDelay}
            onCheckedChange={setRandomDelay}
            className="data-[state=checked]:bg-green-500/70"
          />
        </div>
      </motion.div>

      {/* ── 4. Anti-Detection Features ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4 neon-glow-purple border border-purple-500/10 space-y-1"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/90">Anti-Detection</h3>
            <p className="text-[9px] text-white/35">Mimic human behavior patterns</p>
          </div>
        </div>

        {[
          {
            key: 'messageVariation' as const,
            label: 'Message Variation',
            desc: 'Auto-rotate message templates',
            icon: <MessageSquare className="w-3.5 h-3.5" />,
            color: 'text-green-400/70',
            state: messageVariation,
            setter: setMessageVariation,
            switchColor: 'data-[state=checked]:bg-green-500/70',
          },
          {
            key: 'typingSimulation' as const,
            label: 'Typing Simulation',
            desc: 'Show typing indicator before sending',
            icon: <Keyboard className="w-3.5 h-3.5" />,
            color: 'text-blue-400/70',
            state: typingSimulation,
            setter: setTypingSimulation,
            switchColor: 'data-[state=checked]:bg-blue-500/70',
          },
          {
            key: 'onlinePattern' as const,
            label: 'Random Online Pattern',
            desc: 'Vary your online/offline status',
            icon: <Wifi className="w-3.5 h-3.5" />,
            color: 'text-purple-400/70',
            state: onlinePattern,
            setter: setOnlinePattern,
            switchColor: 'data-[state=checked]:bg-purple-500/70',
          },
          {
            key: 'profileSimulation' as const,
            label: 'Profile Activity Simulation',
            desc: 'Simulate profile pic/status changes',
            icon: <UserCheck className="w-3.5 h-3.5" />,
            color: 'text-amber-400/70',
            state: profileSimulation,
            setter: setProfileSimulation,
            switchColor: 'data-[state=checked]:bg-amber-500/70',
          },
          {
            key: 'groupThrottle' as const,
            label: 'Group Join Throttle',
            desc: 'Limit group joins per hour',
            icon: <Users className="w-3.5 h-3.5" />,
            color: 'text-cyan-400/70',
            state: groupThrottle,
            setter: setGroupThrottle,
            switchColor: 'data-[state=checked]:bg-cyan-500/70',
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <span className={item.color}>{item.icon}</span>
              <div>
                <p className="text-[11px] text-white/70 font-semibold">{item.label}</p>
                <p className="text-[9px] text-white/30">{item.desc}</p>
              </div>
            </div>
            <Switch
              checked={item.state}
              onCheckedChange={item.setter}
              className={item.switchColor}
            />
          </div>
        ))}
      </motion.div>

      {/* ── 5. Safe Sending Schedule ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-4 neon-glow-cyan border border-cyan-500/10 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white/90">Safe Schedule</h3>
            <p className="text-[9px] text-white/35">Set active sending windows</p>
          </div>
          <motion.button
            onClick={() => setShowScheduleGrid(!showScheduleGrid)}
            whileTap={{ scale: 0.95 }}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/40 hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            Grid {showScheduleGrid ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </motion.button>
        </div>

        {/* Day Selector */}
        <div className="flex gap-1.5">
          {DAYS.map((day, i) => (
            <motion.button
              key={day}
              onClick={() => toggleDay(i)}
              whileTap={{ scale: 0.9 }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                activeDays.includes(i)
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-white/[0.03] text-white/25 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {day}
            </motion.button>
          ))}
        </div>

        {/* Time Windows */}
        <div className="space-y-2">
          {[
            { label: 'Morning', icon: <TrendingUp className="w-3 h-3 text-amber-400/70 rotate-0" />, window: morningWindow, setter: setMorningWindow, color: 'text-amber-400' },
            { label: 'Afternoon', icon: <Sun className="w-3 h-3 text-blue-400/70" />, window: afternoonWindow, setter: setAfternoonWindow, color: 'text-blue-400' },
            { label: 'Evening', icon: <Moon className="w-3 h-3 text-purple-400/70" />, window: eveningWindow, setter: setEveningWindow, color: 'text-purple-400' },
          ].map((slot) => (
            <div key={slot.label} className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
              <span className="text-white/40">{slot.icon}</span>
              <span className="text-[10px] font-semibold text-white/50 w-16">{slot.label}</span>
              <div className="flex-1 flex items-center gap-2">
                <Slider
                  value={slot.window}
                  min={0}
                  max={23}
                  step={1}
                  onValueChange={(v) => slot.setter(v as [number, number])}
                  className="flex-1 [&_[data-slot=slider-track]]:bg-white/[0.06] [&_[data-slot=slider-range]]:bg-cyan-500/50 [&_[data-slot=slider-thumb]]:w-3.5 [&_[data-slot=slider-thumb]]:h-3.5 [&_[data-slot=slider-thumb]]:border-cyan-500/50"
                />
                <span className={`text-[10px] font-bold ${slot.color} w-14 text-right`}>
                  {slot.window[0]}:00-{slot.window[1]}:00
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-2 bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
          <Globe className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[10px] text-white/40 font-semibold">Timezone</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex-1 bg-transparent text-[10px] text-cyan-400 font-semibold text-right focus:outline-none cursor-pointer"
          >
            <option value="UTC-8 (PST)">UTC-8 (PST)</option>
            <option value="UTC-7 (MST)">UTC-7 (MST)</option>
            <option value="UTC-6 (CST)">UTC-6 (CST)</option>
            <option value="UTC-5 (EST)">UTC-5 (EST)</option>
            <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
            <option value="UTC+1 (CET)">UTC+1 (CET)</option>
            <option value="UTC+3 (MSK)">UTC+3 (MSK)</option>
            <option value="UTC+5:30 (IST)">UTC+5:30 (IST)</option>
            <option value="UTC+8 (CST)">UTC+8 (CST)</option>
            <option value="UTC+9 (JST)">UTC+9 (JST)</option>
          </select>
        </div>

        {/* Visual Schedule Grid */}
        <AnimatePresence>
          {showScheduleGrid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-white/[0.04]">
                <p className="text-[9px] text-white/30 font-semibold mb-2 uppercase tracking-wider">Weekly Schedule Grid</p>
                <div className="overflow-x-auto no-scrollbar">
                  <div className="min-w-[280px]">
                    {/* Hour labels */}
                    <div className="flex gap-px mb-1">
                      <div className="w-8 flex-shrink-0" />
                      {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
                        <div key={h} className="flex-1 text-center text-[7px] text-white/20 font-mono">
                          {h.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                    {/* Day rows */}
                    {DAYS.map((day, dayIdx) => (
                      <div key={day} className="flex gap-px mb-px">
                        <div className="w-8 flex-shrink-0 flex items-center">
                          <span className="text-[8px] text-white/25 font-semibold">{day}</span>
                        </div>
                        <div className="flex-1 flex gap-px">
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className="flex-1 h-3 rounded-[1px] transition-colors"
                              style={{
                                backgroundColor: isActiveHour(dayIdx, hour)
                                  ? 'rgba(6, 182, 212, 0.25)'
                                  : 'rgba(255, 255, 255, 0.02)',
                              }}
                              title={`${day} ${hour}:00 - ${isActiveHour(dayIdx, hour) ? 'Active' : 'Inactive'}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(6, 182, 212, 0.25)' }} />
                        <span className="text-[8px] text-white/25">Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }} />
                        <span className="text-[8px] text-white/25">Inactive</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── 6. Ban Recovery ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {/* Ban Status / Cooldown */}
        <AnimatePresence mode="wait">
          {isBanned ? (
            <motion.div
              key="banned"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-5 border border-red-500/20 neon-glow-red text-center space-y-3"
              style={{ boxShadow: '0 0 30px rgba(239,68,68,0.12)' }}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldX className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-extrabold text-red-400">Account Restricted</h3>
              <p className="text-[11px] text-white/40">WhatsApp has temporarily restricted your account</p>
              <div className="text-3xl font-extrabold text-white/90 font-mono tracking-wider">
                {formatCooldown(cooldownSeconds)}
              </div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider">Cooldown Remaining</p>
              {/* Cooldown progress */}
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(cooldownSeconds / 900) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="safe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-4 border border-green-500/10 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90">Ban Recovery</h3>
                  <p className="text-[9px] text-white/35">Recovery tools if your account gets restricted</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/[0.04] rounded-xl p-3 border border-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-[11px] text-green-400/80 font-semibold">Your account is in good standing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recovery Guide */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.06] space-y-2">
          <button
            onClick={() => setShowRecoveryGuide(!showRecoveryGuide)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400/70" />
              <span className="text-[11px] font-bold text-white/60">Recovery Guide</span>
            </div>
            {showRecoveryGuide ? (
              <ChevronUp className="w-4 h-4 text-white/20" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/20" />
            )}
          </button>
          <AnimatePresence>
            {showRecoveryGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  {[
                    { step: 1, title: 'Stop all sending immediately', desc: 'Do not attempt to send any messages during the ban period.' },
                    { step: 2, title: 'Wait for cooldown period', desc: 'Do not log in or interact with WhatsApp during cooldown.' },
                    { step: 3, title: 'Uninstall & reinstall WhatsApp', desc: 'After cooldown, uninstall the app, wait 24h, then reinstall.' },
                    { step: 4, title: 'Reduce sending limits by 50%', desc: 'Lower your daily and hourly limits to rebuild trust.' },
                    { step: 5, title: 'Gradually increase over 2 weeks', desc: 'Slowly ramp up sending volume over 14 days.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-amber-400">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-white/70 font-semibold">{item.title}</p>
                        <p className="text-[9px] text-white/30">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Emergency Stop Button */}
        <motion.button
          onClick={handleEmergencyStop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className={`w-full py-4 rounded-2xl text-sm font-extrabold uppercase tracking-wider transition-all relative overflow-hidden ${
            emergencyActive
              ? 'bg-red-600/30 text-red-300 border-2 border-red-500/50'
              : 'bg-gradient-to-r from-red-600/20 to-red-500/15 text-red-400 border-2 border-red-500/25 hover:from-red-600/30 hover:to-red-500/25'
          }`}
          style={{
            boxShadow: emergencyActive
              ? '0 0 40px rgba(239,68,68,0.3), 0 0 80px rgba(239,68,68,0.15), inset 0 0 30px rgba(239,68,68,0.1)'
              : '0 0 20px rgba(239,68,68,0.1), 0 0 40px rgba(239,68,68,0.05)',
          }}
          disabled={emergencyActive}
        >
          <div className="flex items-center justify-center gap-2.5">
            {emergencyActive ? (
              <>
                <OctagonX className="w-5 h-5 animate-pulse" />
                ALL SENDING HALTED
              </>
            ) : (
              <>
                <StopCircle className="w-5 h-5" />
                Emergency Stop
              </>
            )}
          </div>
          {!emergencyActive && (
            <p className="text-[8px] text-red-400/40 mt-1 font-normal normal-case tracking-normal">
              Immediately stop all outgoing messages
            </p>
          )}
        </motion.button>

        {/* Activity Log */}
        <div className="glass-card rounded-2xl p-4 border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-white/30" />
            <span className="text-[11px] font-bold text-white/50">Activity Log</span>
            <span className="text-[8px] text-white/20 ml-auto">Recent actions</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {activityLog.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2.5 py-2 px-2 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  entry.type === 'safe' ? 'bg-green-500' : entry.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/60 truncate">{entry.action}</p>
                </div>
                <span className="text-[8px] text-white/20 flex-shrink-0">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Bottom Spacing ── */}
      <div className="h-4" />
    </div>
  )
}

// Sun/Moon icons used in schedule section
function Sun({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function Moon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

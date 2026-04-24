'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, Palette, Database, Key, Globe, HelpCircle, LogOut, ChevronRight, Moon, Zap, MessageSquare, CreditCard, Activity, HardDrive, Clock, Pencil, Info, MessageCircle, BarChart3, Users, HardDriveDownload, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

interface SettingItem {
  icon: React.ReactNode
  label: string
  subtitle?: string
  action?: 'toggle' | 'navigate' | 'button'
  value?: boolean
  iconColor?: string
  iconBg?: string
}

interface StatsData {
  totalContacts: number
  activeContacts: number
  totalCampaigns: number
  activeCampaigns: number
  totalSent: number
  totalDelivered: number
  totalReplies: number
  deliveryRate: number
  replyRate: number
}

interface ProfileData {
  name: string
  email: string
  plan: string
}

function Toggle({ value, onToggle, color = '#3b82f6' }: { value: boolean; onToggle?: () => void; color?: string }) {
  return (
    <button
      onClick={onToggle}
      className="w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0"
      style={{ 
        backgroundColor: value ? color : 'rgba(255,255,255,0.08)',
        boxShadow: value ? `0 0 12px ${color}40` : 'none'
      }}
    >
      <div 
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300"
        style={{ 
          transform: value ? 'translateX(22px)' : 'translateX(4px)',
          boxShadow: value ? '0 0 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)'
        }}
      />
    </button>
  )
}

function SettingRow({ item, onToggle }: { item: SettingItem; onToggle?: () => void }) {
  return (
    <div
      onClick={item.action === 'toggle' ? undefined : onToggle}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-white/[0.03] transition-colors rounded-lg group ${item.action !== 'toggle' ? 'cursor-pointer' : ''}`}
    >
      <motion.div 
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.iconBg || 'rgba(255,255,255,0.04)' }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <div style={{ color: item.iconColor || 'rgba(255,255,255,0.4)' }}>{item.icon}</div>
      </motion.div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[13px] font-semibold text-white/85">{item.label}</p>
        {item.subtitle && <p className="text-[11px] text-white/40 mt-0.5">{item.subtitle}</p>}
      </div>
      {item.action === 'toggle' && (
        <Toggle value={item.value as boolean} onToggle={onToggle} color={item.iconColor || '#3b82f6'} />
      )}
      {item.action === 'navigate' && (
        <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0 group-hover:text-white/30 transition-colors" />
      )}
    </div>
  )
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function getNextMonthReset(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[nextMonth.getMonth()]} 1, ${nextMonth.getFullYear()}`
}

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [deliveryReports, setDeliveryReports] = useState(false)
  const [smartReplies, setSmartReplies] = useState(true)

  const [stats, setStats] = useState<StatsData | null>(null)
  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '', plan: '' })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const { setActiveFeature } = useAppStore()

  // Fetch stats from API
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({
            totalContacts: data.totalContacts ?? 0,
            activeContacts: data.activeContacts ?? 0,
            totalCampaigns: data.totalCampaigns ?? 0,
            activeCampaigns: data.activeCampaigns ?? 0,
            totalSent: data.totalSent ?? 0,
            totalDelivered: data.totalDelivered ?? 0,
            totalReplies: data.totalReplies ?? 0,
            deliveryRate: data.deliveryRate ?? 0,
            replyRate: data.replyRate ?? 0,
          })
        }
      } catch {
        // silently fail, stats will remain null showing 0 defaults
      } finally {
        setIsLoadingStats(false)
      }
    }
    fetchStats()
  }, [])

  // Fetch profile settings from API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setProfile({
            name: data.profile_name || '',
            email: data.profile_email || '',
            plan: data.plan || '',
          })
        }
      } catch {
        // silently fail, profile will remain empty showing placeholders
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchSettings()
  }, [])

  // Derived values for usage stats (defaults to 0)
  const totalSent = stats?.totalSent ?? 0
  const activeContacts = stats?.activeContacts ?? 0
  const totalContacts = stats?.totalContacts ?? 0

  // Message limit: use a reasonable default (could come from settings in future)
  const messageLimit = 1000
  const contactLimit = 2000

  // Storage estimate: rough estimate based on DB records (~2KB per contact, ~1KB per campaign, ~0.5KB per conversation)
  const storageUsedMB = Math.round(
    (totalContacts * 2 + (stats?.totalCampaigns ?? 0) * 1 + totalSent * 0.5) 
  )
  const storageLimitMB = 5120 // 5 GB
  const storageUsedDisplay = storageUsedMB >= 1024 
    ? `${(storageUsedMB / 1024).toFixed(1)} GB` 
    : `${storageUsedMB} MB`

  const messagePercent = messageLimit > 0 ? Math.min((totalSent / messageLimit) * 100, 100) : 0
  const contactPercent = contactLimit > 0 ? Math.min((activeContacts / contactLimit) * 100, 100) : 0
  const storagePercent = storageLimitMB > 0 ? Math.min((storageUsedMB / storageLimitMB) * 100, 100) : 0

  // Profile display values
  const displayName = profile.name || 'Set up your profile'
  const displayEmail = profile.email || 'Add your email'
  const displayPlan = profile.plan || 'Free Plan'
  const initials = profile.name 
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() 
    : 'EA'

  // Subscription subtitle
  const subscriptionSubtitle = profile.plan 
    ? `${profile.plan} • Active` 
    : 'Free Plan • Not configured'

  const accountSettings: SettingItem[] = [
    { icon: <Activity className="w-4 h-4" />, label: 'API Status', subtitle: 'Monitor service health & uptime', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Key className="w-4 h-4" />, label: 'API Credentials', subtitle: 'WhatsApp Business API keys', action: 'navigate', iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' },
    { icon: <Shield className="w-4 h-4" />, label: 'Security', subtitle: '2FA, session management', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Globe className="w-4 h-4" />, label: 'Business Profile', subtitle: 'Name, logo, description', action: 'navigate', iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Subscription', subtitle: subscriptionSubtitle, action: 'navigate', iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  ]

  const appSettings: SettingItem[] = [
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', subtitle: 'Push & email alerts', action: 'toggle', value: notifications, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
    { icon: <Moon className="w-4 h-4" />, label: 'Dark Mode', subtitle: 'Theme appearance', action: 'toggle', value: darkMode, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.1)' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Smart Replies', subtitle: 'AI-generated suggestions', action: 'toggle', value: smartReplies, iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.1)' },
    { icon: <Database className="w-4 h-4" />, label: 'Auto Backup', subtitle: 'Backup data daily', action: 'toggle', value: autoBackup, iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Delivery Reports', subtitle: 'Detailed delivery tracking', action: 'toggle', value: deliveryReports, iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.1)' },
  ]

  const supportSettings: SettingItem[] = [
    { icon: <MessageCircle className="w-4 h-4" />, label: 'Live Chat', subtitle: 'Chat with support', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support', subtitle: 'FAQs, documentation', action: 'navigate', iconColor: '#64748b', iconBg: 'rgba(100,116,139,0.1)' },
    { icon: <Zap className="w-4 h-4" />, label: 'About EAJE WhatsBot', subtitle: 'Version 2.4.0', action: 'navigate', iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-inset rounded-2xl p-5 flex items-center gap-4 shimmer-border"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white/10 shadow-lg avatar-glow-pulse">
          <span className="text-xl font-black text-white">{initials}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-[15px] font-bold ${profile.name ? 'text-white/95' : 'text-white/40'}`}>
              {displayName}
            </h3>
          </div>
          <p className={`text-xs mt-0.5 ${profile.email ? 'text-white/50' : 'text-white/30'}`}>
            {displayEmail}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {profile.plan && profile.plan !== 'Free Plan' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">{displayPlan}</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-white/30 border border-white/10">{displayPlan}</span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Active</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ChevronRight className="w-4 h-4 text-white/15" />
          <button className="text-[9px] text-blue-400/70 hover:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 transition-colors">
            <Pencil className="w-2.5 h-2.5" /> Edit
          </button>
        </div>
      </motion.div>

      {/* Usage Statistics Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 space-y-4 stat-card-blue"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Usage Statistics</span>
          {isLoadingStats && <Loader2 className="w-3 h-3 text-blue-400 animate-spin ml-auto" />}
        </div>
        {/* Messages Sent */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/85">Messages Sent</p>
                <p className="text-[9px] text-white/30">This month</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400">{formatNumber(totalSent)} <span className="text-white/30 font-normal">/ {formatNumber(messageLimit)}</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 progress-shimmer"
              style={{ width: `${messagePercent}%`, backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
        {/* Active Contacts */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10">
                <Users className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/85">Active Contacts</p>
                <p className="text-[9px] text-white/30">Engaged users</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-400">{formatNumber(activeContacts)} <span className="text-white/30 font-normal">/ {formatNumber(contactLimit)}</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 progress-shimmer"
              style={{ width: `${contactPercent}%`, backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
        {/* Storage Used */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/85">Storage Used</p>
                <p className="text-[9px] text-white/30">Media & data</p>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-400">{storageUsedDisplay} <span className="text-white/30 font-normal">/ 5 GB</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-400 progress-shimmer"
              style={{ width: `${storagePercent}%`, backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <Clock className="w-2.5 h-2.5" />
          <span>Usage resets on {getNextMonthReset()}</span>
        </div>
      </motion.div>

      {/* Account */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Account</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {accountSettings.map((item, i) => (
            <SettingRow key={i} item={item} onToggle={item.label === 'API Status' ? () => setActiveFeature('api-health') : undefined} />
          ))}
        </div>
      </div>

      {/* App Settings */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">App Settings</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {appSettings.map((item, i) => (
            <SettingRow 
              key={i} 
              item={item} 
              onToggle={() => {
                if (item.label === 'Notifications') setNotifications(!notifications)
                if (item.label === 'Dark Mode') setDarkMode(!darkMode)
                if (item.label === 'Smart Replies') setSmartReplies(!smartReplies)
                if (item.label === 'Auto Backup') setAutoBackup(!autoBackup)
                if (item.label === 'Delivery Reports') setDeliveryReports(!deliveryReports)
              }}
            />
          ))}
        </div>
      </div>

      {/* Support */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Support</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {supportSettings.map((item, i) => (
            <div key={i} className="relative">
              <SettingRow item={item} />
              {item.label === 'Live Chat' && (
                <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-400 border border-green-500/20 animate-pulse-dot">Online</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <motion.button 
        whileTap={{ scale: 0.98 }}
        whileHover={{ boxShadow: '0 0 20px rgba(239,68,68,0.3), 0 0 40px rgba(239,68,68,0.15)' }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500/8 text-red-400 border border-red-500/15 text-sm font-bold hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-200"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </motion.button>

      {/* Version Info Footer */}
      <div className="flex flex-col items-center gap-1 pt-2 pb-4">
        <div className="flex items-center gap-1 text-[9px] text-white/15">
          <Info className="w-2.5 h-2.5" />
          <span>EAJE WhatsBot v2.4.0</span>
        </div>
        <p className="text-[8px] text-white/10">Build 2024.01.15</p>
      </div>
    </div>
  )
}

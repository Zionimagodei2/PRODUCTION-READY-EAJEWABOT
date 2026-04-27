'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { Settings as SettingsIcon, Shield, Bell, Palette, Database, Key, Globe, HelpCircle, LogOut, ChevronRight, Moon, Zap, MessageSquare, CreditCard, Activity, HardDrive, Clock, Pencil, Info, MessageCircle, BarChart3, Users, HardDriveDownload, Loader2, Download, CheckCircle2, Eye, EyeOff, X, Save, AlertTriangle, Trash2, RotateCcw, UserX, Volume2, MessageCircleMore, LayoutGrid, List, Sparkles, Send } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { usePWAInstall } from '@/lib/permissions'
import { useToastStore } from '@/store/toast-store'

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
  businessName: string
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
      onClick={item.action === 'toggle' || item.action === 'button' ? undefined : onToggle}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-white/[0.03] transition-colors rounded-lg group ${item.action === 'navigate' ? 'cursor-pointer' : ''}`}
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

function maskKey(key: string): string {
  if (!key || key.length <= 4) return key || ''
  return '••••••••' + key.slice(-4)
}

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [deliveryReports, setDeliveryReports] = useState(false)
  const [smartReplies, setSmartReplies] = useState(true)

  // Notification preferences
  const [newMessageNotif, setNewMessageNotif] = useState(true)
  const [campaignCompletionNotif, setCampaignCompletionNotif] = useState(true)
  const [contactActivityNotif, setContactActivityNotif] = useState(false)
  const [systemUpdatesNotif, setSystemUpdatesNotif] = useState(true)

  // Appearance
  const [compactView, setCompactView] = useState(false)
  const [notificationSounds, setNotificationSounds] = useState(true)
  const [messagePreviews, setMessagePreviews] = useState(true)

  // API Keys
  const [geminiKey, setGeminiKey] = useState('')
  const [whatsappKey, setWhatsappKey] = useState('')
  const [editingGeminiKey, setEditingGeminiKey] = useState(false)
  const [editingWhatsappKey, setEditingWhatsappKey] = useState(false)
  const [tempGeminiKey, setTempGeminiKey] = useState('')
  const [tempWhatsappKey, setTempWhatsappKey] = useState('')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showWhatsappKey, setShowWhatsappKey] = useState(false)
  const [testingGemini, setTestingGemini] = useState(false)
  const [testingWhatsapp, setTestingWhatsapp] = useState(false)

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editBusinessName, setEditBusinessName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Danger zone
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(0) // 0=none, 1=first, 2=final
  const [dangerLoading, setDangerLoading] = useState(false)

  const [stats, setStats] = useState<StatsData | null>(null)
  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '', plan: '', businessName: '' })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const { setActiveFeature } = useAppStore()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { addToast } = useToastStore()
  const [isInstalling, setIsInstalling] = useState(false)

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
        // silently fail
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
            businessName: data.business_name || '',
          })
          setGeminiKey(data.gemini_api_key || '')
          setWhatsappKey(data.whatsapp_api_key || '')
          // Load notification prefs
          if (data.notif_new_message !== undefined) setNewMessageNotif(data.notif_new_message === 'true')
          if (data.notif_campaign !== undefined) setCampaignCompletionNotif(data.notif_campaign === 'true')
          if (data.notif_contact !== undefined) setContactActivityNotif(data.notif_contact === 'true')
          if (data.notif_system !== undefined) setSystemUpdatesNotif(data.notif_system === 'true')
          // Load appearance prefs
          if (data.compact_view !== undefined) setCompactView(data.compact_view === 'true')
          if (data.notif_sounds !== undefined) setNotificationSounds(data.notif_sounds === 'true')
          if (data.message_previews !== undefined) setMessagePreviews(data.message_previews === 'true')
        }
      } catch {
        // silently fail
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchSettings()
  }, [])

  // Save a setting via API
  const saveSetting = useCallback(async (key: string, value: string) => {
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
    } catch {
      // silently fail
    }
  }, [])

  // Profile editing handlers
  const handleStartEditProfile = useCallback(() => {
    setEditName(profile.name)
    setEditEmail(profile.email)
    setEditBusinessName(profile.businessName)
    setIsEditingProfile(true)
  }, [profile])

  const handleCancelEditProfile = useCallback(() => {
    setIsEditingProfile(false)
    setEditName('')
    setEditEmail('')
    setEditBusinessName('')
  }, [])

  const handleSaveProfile = useCallback(async () => {
    setSavingProfile(true)
    try {
      await saveSetting('profile_name', editName)
      await saveSetting('profile_email', editEmail)
      await saveSetting('business_name', editBusinessName)
      setProfile(prev => ({ ...prev, name: editName, email: editEmail, businessName: editBusinessName }))
      setIsEditingProfile(false)
      addToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been saved' })
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save profile' })
    } finally {
      setSavingProfile(false)
    }
  }, [editName, editEmail, editBusinessName, saveSetting, addToast])

  // API key handlers
  const handleSaveApiKey = useCallback(async (type: 'gemini' | 'whatsapp', value: string) => {
    try {
      const key = type === 'gemini' ? 'gemini_api_key' : 'whatsapp_api_key'
      await saveSetting(key, value)
      if (type === 'gemini') {
        setGeminiKey(value)
        setEditingGeminiKey(false)
        setTempGeminiKey('')
      } else {
        setWhatsappKey(value)
        setEditingWhatsappKey(false)
        setTempWhatsappKey('')
      }
      addToast({ type: 'success', title: 'API Key Saved', message: `${type === 'gemini' ? 'Gemini' : 'WhatsApp'} API key updated` })
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save API key' })
    }
  }, [saveSetting, addToast])

  const handleTestConnection = useCallback(async (type: 'gemini' | 'whatsapp') => {
    const key = type === 'gemini' ? geminiKey : whatsappKey
    if (!key) {
      addToast({ type: 'warning', title: 'No Key', message: `Please add a ${type === 'gemini' ? 'Gemini' : 'WhatsApp'} API key first` })
      return
    }
    if (type === 'gemini') setTestingGemini(true)
    else setTestingWhatsapp(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, key }),
      })
      const data = await res.json()
      if (data.success) {
        addToast({ type: 'success', title: 'Connection OK', message: `${type === 'gemini' ? 'Gemini' : 'WhatsApp'} API connection successful` })
      } else {
        addToast({ type: 'error', title: 'Connection Failed', message: data.error || 'Could not verify connection' })
      }
    } catch {
      addToast({ type: 'info', title: 'Test Skipped', message: 'Connection test is not available in demo mode' })
    } finally {
      if (type === 'gemini') setTestingGemini(false)
      else setTestingWhatsapp(false)
    }
  }, [geminiKey, whatsappKey, addToast])

  // Toggle with persistence
  const handleTogglePersist = useCallback(async (key: string, current: boolean, setter: (v: boolean) => void) => {
    const newVal = !current
    setter(newVal)
    await saveSetting(key, String(newVal))
  }, [saveSetting])

  // Danger zone handlers
  const handleClearAllData = useCallback(async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 5000)
      return
    }
    setDangerLoading(true)
    try {
      await fetch('/api/settings', { method: 'DELETE' })
      addToast({ type: 'success', title: 'Data Cleared', message: 'All data has been cleared' })
      setConfirmClear(false)
    } catch {
      addToast({ type: 'error', title: 'Failed', message: 'Could not clear data' })
    } finally {
      setDangerLoading(false)
    }
  }, [confirmClear, addToast])

  const handleResetSettings = useCallback(async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 5000)
      return
    }
    setDangerLoading(true)
    try {
      const keys = ['profile_name', 'profile_email', 'business_name', 'gemini_api_key', 'whatsapp_api_key',
        'notif_new_message', 'notif_campaign', 'notif_contact', 'notif_system',
        'compact_view', 'notif_sounds', 'message_previews']
      for (const k of keys) {
        await saveSetting(k, '')
      }
      setProfile({ name: '', email: '', plan: '', businessName: '' })
      setGeminiKey('')
      setWhatsappKey('')
      addToast({ type: 'success', title: 'Settings Reset', message: 'All settings have been reset to defaults' })
      setConfirmReset(false)
    } catch {
      addToast({ type: 'error', title: 'Failed', message: 'Could not reset settings' })
    } finally {
      setDangerLoading(false)
    }
  }, [confirmReset, saveSetting, addToast])

  const handleDeleteAccount = useCallback(() => {
    if (confirmDelete === 0) {
      setConfirmDelete(1)
      setTimeout(() => setConfirmDelete(0), 8000)
      return
    }
    if (confirmDelete === 1) {
      setConfirmDelete(2)
      setTimeout(() => setConfirmDelete(0), 8000)
      return
    }
    addToast({ type: 'info', title: 'Demo Mode', message: 'Account deletion is disabled in demo mode' })
    setConfirmDelete(0)
  }, [confirmDelete, addToast])

  // Derived values
  const totalSent = stats?.totalSent ?? 0
  const activeContacts = stats?.activeContacts ?? 0
  const totalContacts = stats?.totalContacts ?? 0

  const messageLimit = 1000
  const contactLimit = 2000

  const storageUsedMB = Math.round(
    (totalContacts * 2 + (stats?.totalCampaigns ?? 0) * 1 + totalSent * 0.5) 
  )
  const storageLimitMB = 5120
  const storageUsedDisplay = storageUsedMB >= 1024 
    ? `${(storageUsedMB / 1024).toFixed(1)} GB` 
    : `${storageUsedMB} MB`

  const messagePercent = messageLimit > 0 ? Math.min((totalSent / messageLimit) * 100, 100) : 0
  const contactPercent = contactLimit > 0 ? Math.min((activeContacts / contactLimit) * 100, 100) : 0
  const storagePercent = storageLimitMB > 0 ? Math.min((storageUsedMB / storageLimitMB) * 100, 100) : 0

  const displayName = profile.name || 'Set up your profile'
  const displayEmail = profile.email || 'Add your email'
  const displayPlan = profile.plan || 'Free Plan'
  const initials = profile.name 
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() 
    : 'EA'

  const subscriptionSubtitle = profile.plan 
    ? `${profile.plan} • Active` 
    : 'Free Plan • Not configured'

  const accountSettings: SettingItem[] = [
    { icon: <Activity className="w-4 h-4" />, label: 'API Status', subtitle: 'Monitor service health & uptime', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Key className="w-4 h-4" />, label: 'API Credentials', subtitle: 'WhatsApp Business API keys', action: 'navigate', iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' },
    { icon: <Shield className="w-4 h-4" />, label: 'Security', subtitle: '2FA, session management', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Globe className="w-4 h-4" />, label: 'Business Profile', subtitle: profile.businessName ? profile.businessName : 'Name, logo, description', action: 'navigate', iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Subscription', subtitle: subscriptionSubtitle, action: 'navigate', iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  ]

  const handleInstallApp = async () => {
    if (isInstallable && !isInstalled) {
      setIsInstalling(true)
      await install()
      setIsInstalling(false)
    }
  }

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

  // Notification preferences items
  const notificationItems: { icon: React.ReactNode; label: string; description: string; value: boolean; setter: (v: boolean) => void; settingKey: string; color: string }[] = [
    { icon: <MessageCircleMore className="w-4 h-4" />, label: 'New Messages', description: 'Get notified when you receive new messages', value: newMessageNotif, setter: setNewMessageNotif, settingKey: 'notif_new_message', color: '#22c55e' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'Campaign Completion', description: 'Alerts when campaigns finish sending', value: campaignCompletionNotif, setter: setCampaignCompletionNotif, settingKey: 'notif_campaign', color: '#f59e0b' },
    { icon: <Users className="w-4 h-4" />, label: 'Contact Activity', description: 'Updates on contact engagement changes', value: contactActivityNotif, setter: setContactActivityNotif, settingKey: 'notif_contact', color: '#06b6d4' },
    { icon: <Shield className="w-4 h-4" />, label: 'System Updates', description: 'App updates and maintenance notices', value: systemUpdatesNotif, setter: setSystemUpdatesNotif, settingKey: 'notif_system', color: '#8b5cf6' },
  ]

  // Appearance items
  const appearanceItems: { icon: React.ReactNode; label: string; description: string; value: boolean; setter: (v: boolean) => void; settingKey: string; color: string }[] = [
    { icon: <LayoutGrid className="w-4 h-4" />, label: 'Compact View', description: 'Show more items with less spacing', value: compactView, setter: setCompactView, settingKey: 'compact_view', color: '#06b6d4' },
    { icon: <Volume2 className="w-4 h-4" />, label: 'Notification Sounds', description: 'Play sound for incoming notifications', value: notificationSounds, setter: setNotificationSounds, settingKey: 'notif_sounds', color: '#f59e0b' },
    { icon: <Eye className="w-4 h-4" />, label: 'Message Previews', description: 'Show message content in notifications', value: messagePreviews, setter: setMessagePreviews, settingKey: 'message_previews', color: '#ec4899' },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-inset rounded-2xl shimmer-border overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!isEditingProfile ? (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 flex items-center gap-4 cursor-pointer"
              onClick={handleStartEditProfile}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-white/[0.08] shadow-lg avatar-glow-pulse">
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
                {profile.businessName && (
                  <p className="text-[10px] text-cyan-400/60 mt-0.5">{profile.businessName}</p>
                )}
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
                <span className="text-[9px] text-blue-400/70 hover:text-blue-400 font-semibold mt-1 flex items-center gap-0.5 transition-colors">
                  <Pencil className="w-2.5 h-2.5" /> Edit
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-blue-400" /> Edit Profile
                </h3>
                <button onClick={handleCancelEditProfile} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-all duration-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-all duration-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Business Name</label>
                  <input
                    type="text"
                    value={editBusinessName}
                    onChange={e => setEditBusinessName(e.target.value)}
                    placeholder="Your business name"
                    className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-all duration-200 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <motion.button
                  onClick={handleCancelEditProfile}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.08] text-xs text-white/50 font-semibold hover:bg-white/10 transition-all duration-200"
                >
                  <X className="w-3 h-3" /> Cancel
                </motion.button>
                <motion.button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-xs text-blue-300 font-semibold hover:from-blue-500/30 hover:to-purple-500/30 transition-all disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <span suppressHydrationWarning>Usage resets on {getNextMonthReset()}</span>
        </div>
      </motion.div>

      {/* Install App - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4"
      >
        {isInstalled ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white/90">App Installed ✓</p>
              <p className="text-[10px] text-white/40">Running as standalone app</p>
            </div>
            <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-green-500/15 text-green-400 border border-green-500/20">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white/90">Install EAJE WhatsBot</p>
              <p className="text-[10px] text-white/40">{isInstallable ? 'Install for faster access & offline use' : 'Add to home screen from browser menu'}</p>
            </div>
            {isInstallable && (
              <motion.button
                onClick={handleInstallApp}
                disabled={isInstalling}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-[10px] text-blue-300 font-bold"
                animate={isInstalling ? {} : { boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 12px rgba(59,130,246,0.3)', '0 0 0px rgba(59,130,246,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDriveDownload className="w-3 h-3" />}
                Install
              </motion.button>
            )}
          </div>
        )}
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
                if (item.label === 'Notifications') {
                  setNotifications(!notifications)
                }
                if (item.label === 'Dark Mode') {
                  setDarkMode(!darkMode)
                }
                if (item.label === 'Smart Replies') {
                  setSmartReplies(!smartReplies)
                }
                if (item.label === 'Auto Backup') {
                  setAutoBackup(!autoBackup)
                }
                if (item.label === 'Delivery Reports') {
                  setDeliveryReports(!deliveryReports)
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Notification Preferences</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl p-2 space-y-1">
          {notificationItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/85">{item.label}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{item.description}</p>
              </div>
              <Toggle 
                value={item.value} 
                onToggle={() => handleTogglePersist(item.settingKey, item.value, item.setter)} 
                color={item.color} 
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">API Keys</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl p-4 space-y-4">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-white/85">Gemini API Key</p>
                <p className="text-[10px] text-white/35">AI-powered features</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${geminiKey ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                {geminiKey ? 'Configured' : 'Not Set'}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {editingGeminiKey ? (
                <motion.div
                  key="edit-gemini"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="relative">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={tempGeminiKey}
                      onChange={e => setTempGeminiKey(e.target.value)}
                      placeholder="Enter Gemini API key"
                      className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-all duration-200 pr-10 font-mono"
                    />
                    <button
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingGeminiKey(false); setTempGeminiKey(''); setShowGeminiKey(false) }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 font-semibold hover:bg-white/10 transition-all duration-200"
                    >Cancel</button>
                    <button
                      onClick={() => handleSaveApiKey('gemini', tempGeminiKey)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-[10px] text-blue-300 font-semibold hover:bg-blue-500/25 transition-colors"
                    >Save Key</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="show-gemini"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-white/40 font-mono truncate">
                    {geminiKey ? maskKey(geminiKey) : 'No key configured'}
                  </div>
                  <button
                    onClick={() => { setEditingGeminiKey(true); setTempGeminiKey(geminiKey) }}
                    className="px-2.5 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 font-semibold hover:bg-white/10 transition-all duration-200"
                  >Edit</button>
                  <button
                    onClick={() => handleTestConnection('gemini')}
                    disabled={testingGemini}
                    className="px-2.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {testingGemini ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* WhatsApp API Key */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/10">
                <MessageSquare className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-white/85">WhatsApp API Key</p>
                <p className="text-[10px] text-white/35">Business API access</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${whatsappKey ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                {whatsappKey ? 'Configured' : 'Not Set'}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {editingWhatsappKey ? (
                <motion.div
                  key="edit-wa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="relative">
                    <input
                      type={showWhatsappKey ? 'text' : 'password'}
                      value={tempWhatsappKey}
                      onChange={e => setTempWhatsappKey(e.target.value)}
                      placeholder="Enter WhatsApp API key"
                      className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-green-500/40 transition-all duration-200 pr-10 font-mono"
                    />
                    <button
                      onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showWhatsappKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingWhatsappKey(false); setTempWhatsappKey(''); setShowWhatsappKey(false) }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 font-semibold hover:bg-white/10 transition-all duration-200"
                    >Cancel</button>
                    <button
                      onClick={() => handleSaveApiKey('whatsapp', tempWhatsappKey)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/25 text-[10px] text-green-300 font-semibold hover:bg-green-500/25 transition-colors"
                    >Save Key</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="show-wa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-white/40 font-mono truncate">
                    {whatsappKey ? maskKey(whatsappKey) : 'No key configured'}
                  </div>
                  <button
                    onClick={() => { setEditingWhatsappKey(true); setTempWhatsappKey(whatsappKey) }}
                    className="px-2.5 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 font-semibold hover:bg-white/10 transition-all duration-200"
                  >Edit</button>
                  <button
                    onClick={() => handleTestConnection('whatsapp')}
                    disabled={testingWhatsapp}
                    className="px-2.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {testingWhatsapp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Appearance</span>
          <div className="flex-1 gradient-divider" />
        </div>
        <div className="glass-card rounded-2xl p-2 space-y-1">
          {appearanceItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/85">{item.label}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{item.description}</p>
              </div>
              <Toggle 
                value={item.value} 
                onToggle={() => handleTogglePersist(item.settingKey, item.value, item.setter)} 
                color={item.color} 
              />
            </div>
          ))}
        </div>
      </motion.div>

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

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-[10px] font-bold text-red-400/50 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Danger Zone
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-red-500/20 to-transparent" />
        </div>
        <div className="glass-card rounded-2xl p-2 space-y-1 border-red-500/10">
          {/* Clear All Data */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/[0.03] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/85">Clear All Data</p>
              <p className="text-[10px] text-white/35">Remove all contacts, campaigns, messages</p>
            </div>
            <motion.button
              onClick={handleClearAllData}
              disabled={dangerLoading}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                confirmClear 
                  ? 'bg-red-500/30 text-red-200 border border-red-500/40 animate-pulse' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              {confirmClear ? 'Confirm Clear?' : 'Clear'}
            </motion.button>
          </div>

          {/* Reset Settings */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/[0.03] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-500/10">
              <RotateCcw className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/85">Reset Settings</p>
              <p className="text-[10px] text-white/35">Restore all settings to defaults</p>
            </div>
            <motion.button
              onClick={handleResetSettings}
              disabled={dangerLoading}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                confirmReset 
                  ? 'bg-orange-500/30 text-orange-200 border border-orange-500/40 animate-pulse' 
                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
              }`}
            >
              {confirmReset ? 'Confirm Reset?' : 'Reset'}
            </motion.button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/[0.03] transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/15">
              <UserX className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/85">Delete Account</p>
              <p className="text-[10px] text-white/35">
                {confirmDelete === 2 ? '⚠️ FINAL CONFIRMATION — This cannot be undone!' : 'Permanently delete your account and data'}
              </p>
            </div>
            <motion.button
              onClick={handleDeleteAccount}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                confirmDelete === 2 
                  ? 'bg-red-600/50 text-red-100 border border-red-500/60 animate-pulse' 
                  : confirmDelete === 1 
                  ? 'bg-red-500/30 text-red-200 border border-red-500/40 animate-pulse' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              {confirmDelete === 2 ? 'DELETE NOW' : confirmDelete === 1 ? 'Are You Sure?' : 'Delete'}
            </motion.button>
          </div>
        </div>
      </motion.div>

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

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, Palette, Database, Key, Globe, HelpCircle, LogOut, ChevronRight, Moon, Zap, MessageSquare, CreditCard, Activity } from 'lucide-react'
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

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [deliveryReports, setDeliveryReports] = useState(false)
  const [smartReplies, setSmartReplies] = useState(true)

  const { setActiveFeature } = useAppStore()

  const accountSettings: SettingItem[] = [
    { icon: <Activity className="w-4 h-4" />, label: 'API Status', subtitle: 'Monitor service health & uptime', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Key className="w-4 h-4" />, label: 'API Credentials', subtitle: 'WhatsApp Business API keys', action: 'navigate', iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' },
    { icon: <Shield className="w-4 h-4" />, label: 'Security', subtitle: '2FA, session management', action: 'navigate', iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <Globe className="w-4 h-4" />, label: 'Business Profile', subtitle: 'Name, logo, description', action: 'navigate', iconColor: '#06b6d4', iconBg: 'rgba(6,182,212,0.1)' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Subscription', subtitle: 'Pro Plan • Renews Jan 30', action: 'navigate', iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  ]

  const appSettings: SettingItem[] = [
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', subtitle: 'Push & email alerts', action: 'toggle', value: notifications, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.1)' },
    { icon: <Moon className="w-4 h-4" />, label: 'Dark Mode', subtitle: 'Theme appearance', action: 'toggle', value: darkMode, iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.1)' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'Smart Replies', subtitle: 'AI-generated suggestions', action: 'toggle', value: smartReplies, iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.1)' },
    { icon: <Database className="w-4 h-4" />, label: 'Auto Backup', subtitle: 'Backup data daily', action: 'toggle', value: autoBackup, iconColor: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Delivery Reports', subtitle: 'Detailed delivery tracking', action: 'toggle', value: deliveryReports, iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.1)' },
  ]

  const supportSettings: SettingItem[] = [
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support', subtitle: 'FAQs, documentation', action: 'navigate', iconColor: '#64748b', iconBg: 'rgba(100,116,139,0.1)' },
    { icon: <Zap className="w-4 h-4" />, label: 'About EAJE WhatsBot', subtitle: 'Version 1.0.0', action: 'navigate', iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' },
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
          <span className="text-xl font-black text-white">EA</span>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-white/95">Enterprise Admin</h3>
          <p className="text-xs text-white/50 mt-0.5">admin@eje-whatsbot.com</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">Pro Plan</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Active</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/15" />
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
            <SettingRow key={i} item={item} />
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
    </div>
  )
}

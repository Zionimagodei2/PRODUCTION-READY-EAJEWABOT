'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, Palette, Database, Key, Globe, HelpCircle, LogOut, ChevronRight, Moon, Zap, MessageSquare, CreditCard, Activity, HardDrive, Clock, Pencil, Info, MessageCircle, BarChart3, Users, HardDriveDownload } from 'lucide-react'
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
          <span className="text-xl font-black text-white">EA</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-white/95">Enterprise Admin</h3>
          </div>
          <p className="text-xs text-white/50 mt-0.5">admin@eje-whatsbot.com</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">Pro Plan</span>
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
            <span className="text-xs font-bold text-blue-400">847 <span className="text-white/30 font-normal">/ 1,000</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 progress-shimmer"
              style={{ width: '84.7%', backgroundSize: '200% 100%' }}
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
            <span className="text-xs font-bold text-green-400">1,284 <span className="text-white/30 font-normal">/ 2,000</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 progress-shimmer"
              style={{ width: '64.2%', backgroundSize: '200% 100%' }}
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
            <span className="text-xs font-bold text-purple-400">2.1 GB <span className="text-white/30 font-normal">/ 5 GB</span></span>
          </div>
          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-400 progress-shimmer"
              style={{ width: '42%', backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
          <Clock className="w-2.5 h-2.5" />
          <span>Usage resets on Feb 1, 2024</span>
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
        <p className="text-[8px] text-white/10">Build 2024.01.15 • Pro License</p>
      </div>
    </div>
  )
}

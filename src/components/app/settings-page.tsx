'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, Palette, Database, Key, Globe, HelpCircle, LogOut, ChevronRight, Moon, Sun, Monitor } from 'lucide-react'

interface SettingItem {
  icon: React.ReactNode
  label: string
  subtitle?: string
  action?: 'toggle' | 'navigate' | 'button'
  value?: boolean | string
}

function SettingRow({ item, onToggle }: { item: SettingItem; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors rounded-lg"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-white/40">
        {item.icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm text-white/80">{item.label}</p>
        {item.subtitle && <p className="text-[10px] text-white/30 mt-0.5">{item.subtitle}</p>}
      </div>
      {item.action === 'toggle' && (
        <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${item.value ? 'bg-neon-blue' : 'bg-white/10'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-4.5 left-0.5' : 'left-0.5'}`}
            style={{ transform: item.value ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </div>
      )}
      {item.action === 'navigate' && (
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      )}
    </button>
  )
}

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [deliveryReports, setDeliveryReports] = useState(false)

  const accountSettings: SettingItem[] = [
    { icon: <Key className="w-4 h-4" />, label: 'API Credentials', subtitle: 'WhatsApp Business API keys', action: 'navigate' },
    { icon: <Shield className="w-4 h-4" />, label: 'Security', subtitle: '2FA, session management', action: 'navigate' },
    { icon: <Globe className="w-4 h-4" />, label: 'Business Profile', subtitle: 'Name, logo, description', action: 'navigate' },
  ]

  const appSettings: SettingItem[] = [
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', subtitle: 'Push & email alerts', action: 'toggle', value: notifications },
    { icon: darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />, label: 'Dark Mode', subtitle: 'Theme appearance', action: 'toggle', value: darkMode },
    { icon: <Database className="w-4 h-4" />, label: 'Auto Backup', subtitle: 'Backup data daily', action: 'toggle', value: autoBackup },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Delivery Reports', subtitle: 'Detailed delivery tracking', action: 'toggle', value: deliveryReports },
  ]

  const supportSettings: SettingItem[] = [
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Help & Support', subtitle: 'FAQs, documentation', action: 'navigate' },
    { icon: <Palette className="w-4 h-4" />, label: 'About EAJE WhatsBot', subtitle: 'Version 1.0.0', action: 'navigate' },
  ]

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Profile Card */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-4 neon-glow-blue border border-blue-500/10">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center border-2 border-white/10">
          <span className="text-lg font-bold text-white">EA</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white/90">Enterprise Admin</h3>
          <p className="text-xs text-white/40">admin@eje-whatsbot.com</p>
          <p className="text-[10px] text-neon-blue mt-0.5">Pro Plan • Active</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>

      {/* Account */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2 px-1">Account</h3>
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          {accountSettings.map((item, i) => (
            <SettingRow key={i} item={item} />
          ))}
        </div>
      </div>

      {/* App Settings */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2 px-1">App Settings</h3>
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          {appSettings.map((item, i) => (
            <SettingRow 
              key={i} 
              item={item} 
              onToggle={() => {
                if (item.label === 'Notifications') setNotifications(!notifications)
                if (item.label === 'Dark Mode') setDarkMode(!darkMode)
                if (item.label === 'Auto Backup') setAutoBackup(!autoBackup)
                if (item.label === 'Delivery Reports') setDeliveryReports(!deliveryReports)
              }}
            />
          ))}
        </div>
      </div>

      {/* Support */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2 px-1">Support</h3>
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          {supportSettings.map((item, i) => (
            <SettingRow key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/15 text-sm font-medium hover:bg-red-500/20 transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  )
}

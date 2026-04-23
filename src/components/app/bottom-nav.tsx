'use client'

import { useAppStore, type TabId } from '@/store/app-store'
import { Home, Megaphone, Users, Wrench, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs: { id: TabId; label: string; icon: React.ReactNode; activeColor: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, activeColor: '#3b82f6' },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" />, activeColor: '#3b82f6' },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" />, activeColor: '#22c55e' },
  { id: 'tools', label: 'Tools', icon: <Wrench className="w-5 h-5" />, activeColor: '#22c55e' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, activeColor: '#8b5cf6' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06]" style={{ background: 'rgba(10, 10, 15, 0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -inset-2 rounded-xl"
                    style={{ background: `radial-gradient(circle, ${tab.activeColor}20, transparent)` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative transition-all duration-200" style={{ 
                  color: isActive ? tab.activeColor : 'rgba(255,255,255,0.3)',
                  filter: isActive ? `drop-shadow(0 0 8px ${tab.activeColor}60)` : 'none'
                }}>
                  {tab.icon}
                </div>
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${
                isActive ? '' : 'text-white/30'
              }`} style={isActive ? { color: tab.activeColor } : {}}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-px left-3 right-3 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${tab.activeColor}, transparent)` }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

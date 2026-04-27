'use client'

import { useState } from 'react'
import { useAppStore, type TabId } from '@/store/app-store'
import { Home, Megaphone, Users, Wrench, Settings } from 'lucide-react'
import { motion, AnimatePresence } from '@/lib/framer-shim'

const tabs: { id: TabId; label: string; icon: React.ReactNode; activeColor: string; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, activeColor: '#3b82f6' },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" />, activeColor: '#22c55e' },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" />, activeColor: '#8b5cf6' },
  { id: 'tools', label: 'Tools', icon: <Wrench className="w-5 h-5" />, activeColor: '#f97316', badge: 3 },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, activeColor: '#ec4899' },
]

export function BottomNav() {
  const { activeTab, setActiveTab, activeFeature } = useAppStore()

  // Haptic feedback line state
  const [hapticLine, setHapticLine] = useState<{ left: number; color: string } | null>(null)

  const handleTabPress = (tabId: TabId, tab: typeof tabs[number]) => {
    // Get the button element position for haptic line
    const button = document.querySelector(`[data-tab-id="${tabId}"]`)
    if (button) {
      const rect = button.getBoundingClientRect()
      setHapticLine({ left: rect.left + rect.width / 2, color: tab.activeColor })
      setTimeout(() => setHapticLine(null), 500)
    }
    setActiveTab(tabId)
  }

  // Hide bottom nav when viewing feature pages
  if (activeFeature) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(8, 8, 14, 0.97)', backdropFilter: 'blur(24px)' }}>
      {/* Subtle gradient separator line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Haptic feedback line */}
      <AnimatePresence>
        {hapticLine && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute top-0 h-[2px] w-16 -translate-x-1/2 rounded-full"
            style={{
              left: hapticLine.left,
              background: `linear-gradient(90deg, transparent, ${hapticLine.color}, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabPress(tab.id, tab)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200"
              style={isActive ? { backgroundColor: `${tab.activeColor}08` } : {}}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute -inset-3 rounded-xl"
                    style={{ background: `radial-gradient(circle, ${tab.activeColor}25, transparent)` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative transition-all duration-300" style={{ 
                  color: isActive ? tab.activeColor : 'rgba(255,255,255,0.25)',
                  filter: isActive ? `drop-shadow(0 0 8px ${tab.activeColor}60)` : 'none',
                  transform: isActive ? 'translateY(-2px) scale(1.15)' : 'none'
                }}>
                  {tab.icon}
                </div>
                {/* Badge count for Tools tab */}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center px-0.5 badge-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`font-semibold transition-all duration-300 ${
                isActive ? 'text-[11px]' : 'text-[10px] text-white/25'
              }`} style={isActive ? { color: tab.activeColor, fontWeight: 800 } : {}}>
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
            </motion.button>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

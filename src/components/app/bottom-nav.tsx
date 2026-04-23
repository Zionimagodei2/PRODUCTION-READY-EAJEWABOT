'use client'

import { useAppStore, type TabId } from '@/store/app-store'
import { Home, Megaphone, Users, Wrench, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" /> },
  { id: 'tools', label: 'Tools', icon: <Wrench className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors"
            >
              <div className={`transition-colors duration-200 ${isActive ? 'text-neon-blue' : 'text-white/40'}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-neon-blue' : 'text-white/40'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-neon-blue"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { User, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WaConnectionModal } from './modals/wa-connection-modal'
import { NotificationCenter } from './modals/notification-center'


export function Header() {
  const { activeFeature, goBack, waConnected, searchOpen, setSearchOpen } = useAppStore()

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 relative" style={{ background: 'rgba(8, 8, 14, 0.95)', backdropFilter: 'blur(24px)' }}>
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {activeFeature && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={goBack}
                className="p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-float" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
              <span className="text-[11px] font-black text-white tracking-tight">EW</span>
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold gradient-text tracking-tight leading-none neon-text-glow">EAJE WHATSBOT</h1>
              <p className="text-[9px] text-white/40 font-semibold mt-0.5 tracking-wide">Enterprise Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4 text-white/50" />
          </button>
          <WaConnectionModal />
          <NotificationCenter />
          <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-gradient-to-br hover:from-blue-500/25 hover:to-purple-500/25 transition-all">
            <User className="w-4 h-4 text-white/60" />
          </button>
          {waConnected && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-[9px] font-semibold text-emerald-400">Connected</span>
            </div>
          )}
        </div>
      </div>
      {/* Animated shimmer line below header */}
      <div className="header-shimmer-line" />
        </header>
  )
}

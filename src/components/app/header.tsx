'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { WaConnectionModal } from './modals/wa-connection-modal'
import { NotificationCenter } from './modals/notification-center'
import { ProfileModal } from './modals/profile-modal'


export function Header() {
  const { activeFeature, goBack, waConnected, searchOpen, setSearchOpen } = useAppStore()

  // Search button pulse on first render
  const [searchPulsed, setSearchPulsed] = useState(false)
  const searchRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => setSearchPulsed(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Connection celebration effect
  const [celebrating, setCelebrating] = useState(false)
  const prevConnected = useRef(waConnected)
  useEffect(() => {
    if (waConnected && !prevConnected.current) {
      queueMicrotask(() => setCelebrating(true))
      const timer = setTimeout(() => setCelebrating(false), 800)
      return () => clearTimeout(timer)
    }
    prevConnected.current = waConnected
  }, [waConnected])

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
    <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(8, 8, 14, 0.95)', backdropFilter: 'blur(24px)' }}>
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto relative">
        {/* Back button - absolute positioned to not affect layout */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10">
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
        </div>
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-float flex-shrink-0" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            <span className="text-[11px] font-black text-white tracking-tight">EW</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-extrabold gradient-text tracking-tight leading-none neon-text-glow truncate">EAJE WHATSBOT</h1>
            <p className="text-[9px] text-white/40 font-semibold mt-0.5 tracking-wide">Enterprise Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            ref={searchRef}
            onClick={() => setSearchOpen(true)}
            className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 ${searchPulsed ? 'animate-pulse-once' : ''}`}
            title="Search (⌘K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-white/50" />
          </button>
          <WaConnectionModal />
          <NotificationCenter />
          <ProfileModal />
          {/* Connection status indicator - visible on all screen sizes */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300 ${
            waConnected
              ? `bg-emerald-500/10 border border-emerald-500/20 ${celebrating ? 'animate-celebrate' : ''}`
              : 'bg-amber-500/8 border border-amber-500/15'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              waConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-amber-400'
            }`} />
            <span className={`text-[10px] font-semibold transition-colors duration-300 ${
              waConnected ? 'text-emerald-400' : 'text-amber-400/80'
            }`}>
              {waConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      {/* Animated shimmer line below header */}
      <div className="header-shimmer-line" />
    </header>
  )
}

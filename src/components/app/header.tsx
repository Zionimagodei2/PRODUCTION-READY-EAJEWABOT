'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Search, Wifi, WifiOff } from 'lucide-react'


export function Header() {
  const { activeFeature, goBack, waConnected, searchOpen, setSearchOpen, setActiveFeature } = useAppStore()

  // Search button pulse on first render
  const [searchPulsed, setSearchPulsed] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSearchPulsed(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    <header className="sticky top-0 z-40 shrink-0" style={{ background: 'rgba(8, 8, 14, 0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        {/* Left side: Back button OR Logo + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {activeFeature ? (
            <button
              onClick={goBack}
              className="p-2 -ml-1 rounded-xl hover:bg-white/5 transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-white tracking-tight">EW</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold text-white/95 tracking-tight leading-none">EAJE WHATSBOT</h1>
                <p className="text-[8px] text-white/35 font-semibold mt-0.5 tracking-wide">Enterprise Dashboard</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side: Connection status + Search */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* WA Connection status — compact pill that navigates to full page */}
          <button
            onClick={() => setActiveFeature('wa-connection')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold transition-colors duration-150 ${
              waConnected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/8 text-red-400 border border-red-500/15'
            }`}
            aria-label={waConnected ? 'WhatsApp Connected — Tap to manage' : 'WhatsApp Disconnected — Tap to connect'}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${waConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="hidden sm:inline">{waConnected ? 'Live' : 'Offline'}</span>
          </button>

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.08] active:scale-95 transition-all duration-150 ${searchPulsed ? 'animate-pulse-once' : ''}`}
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
      </div>
    </header>
  )
}

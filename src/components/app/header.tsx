'use client'

import { useAppStore } from '@/store/app-store'
import { Wifi, WifiOff, User } from 'lucide-react'
import { motion } from 'framer-motion'

export function Header() {
  const { waConnected, activeFeature, goBack } = useAppStore()

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {activeFeature && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goBack}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight">EAJE WHATSBOT</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            waConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${waConnected ? 'bg-emerald-400 animate-pulse-dot' : 'bg-red-400'}`} />
            {waConnected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span>{waConnected ? 'Connected' : 'Offline'}</span>
          </div>
          
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <User className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
    </header>
  )
}

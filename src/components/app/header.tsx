'use client'

import { useAppStore } from '@/store/app-store'
import { User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WaConnectionModal } from './modals/wa-connection-modal'
import { NotificationCenter } from './modals/notification-center'

export function Header() {
  const { activeFeature, goBack } = useAppStore()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(10, 10, 15, 0.92)', backdropFilter: 'blur(20px)' }}>
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
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
              <span className="text-[10px] font-black text-white">EW</span>
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold gradient-text tracking-tight leading-none">EAJE WHATSBOT</h1>
              <p className="text-[9px] text-white/30 font-medium mt-0.5">Enterprise Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <WaConnectionModal />
          <NotificationCenter />
          <button className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors">
            <User className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>
    </header>
  )
}

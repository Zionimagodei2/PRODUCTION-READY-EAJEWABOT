'use client'

import { useToastStore, type ToastType } from '@/store/toast-store'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

const typeConfig: Record<ToastType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
  },
  warning: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-16 left-0 right-0 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = typeConfig[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full max-w-sm rounded-xl p-3 flex items-start gap-3 shadow-lg"
              style={{
                background: 'rgba(15, 15, 22, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${config.border}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${config.color}15`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: config.bg, border: `1px solid ${config.border}` }}
              >
                <div style={{ color: config.color }}>{config.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white/90">{toast.title}</p>
                {toast.message && (
                  <p className="text-[10px] text-white/50 mt-0.5">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/30" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

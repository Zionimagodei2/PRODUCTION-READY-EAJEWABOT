'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, type TabId } from '@/store/app-store'
import { Home, Megaphone, Users, Wrench, Settings, X, Navigation } from 'lucide-react'
import { motion, AnimatePresence } from '@/lib/framer-shim'

const navItems: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'dashboard', label: 'Home', icon: Home, color: '#3b82f6' },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, color: '#22c55e' },
  { id: 'contacts', label: 'Contacts', icon: Users, color: '#8b5cf6' },
  { id: 'tools', label: 'Tools', icon: Wrench, color: '#f97316' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#ec4899' },
]

export function FloatingNav() {
  const { activeTab, setActiveTab, waConnected, activeFeature } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-close on navigation
  const handleNavClick = useCallback((tabId: TabId) => {
    setActiveTab(tabId)
    setIsOpen(false)
  }, [setActiveTab])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        fabRef.current && !fabRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    // Use mousedown for faster response
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener)
    }
  }, [isOpen])

  // Auto-hide when keyboard is open (visual-viewport API)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const vv = window.visualViewport
    const handleResize = () => {
      // Keyboard is visible when viewport height is significantly less than window height
      const isKeyboard = (window.innerHeight - vv!.height) > 100
      setIsKeyboardVisible(isKeyboard)
      if (isKeyboard) {
        setIsOpen(false)
      }
    }

    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)
    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Hide FAB when on feature pages or keyboard is visible
  if (activeFeature || isKeyboardVisible) return null

  return (
    <>
      {/* Overlay when FAB menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Fan-out navigation items */}
      <AnimatePresence>
        {isOpen && (
          <div
            ref={menuRef}
            className="fixed z-50 flex flex-col-reverse gap-2 items-end"
            style={{
              bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
              right: '1rem',
            }}
          >
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const itemDelay = index * 0.04
              const translateY = (navItems.length - index) * 8

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: translateY, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: translateY, scale: 0.6 }}
                  transition={{ duration: 0.2, delay: itemDelay }}
                  onClick={() => handleNavClick(item.id)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 active:scale-95"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)`
                      : 'rgba(12, 12, 20, 0.92)',
                    borderColor: isActive ? `${item.color}40` : 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: isActive
                      ? `0 0 20px ${item.color}15, 0 4px 16px rgba(0,0,0,0.3)`
                      : '0 4px 16px rgba(0,0,0,0.3)',
                    direction: 'rtl', // So items stack right-aligned
                  }}
                  aria-label={item.label}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                    style={{
                      background: isActive ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                      color: isActive ? item.color : 'rgba(255,255,255,0.45)',
                      filter: isActive ? `drop-shadow(0 0 6px ${item.color}60)` : 'none',
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span
                    className="text-[13px] font-semibold transition-colors duration-200 whitespace-nowrap"
                    style={{
                      color: isActive ? item.color : 'rgba(255,255,255,0.6)',
                      direction: 'ltr', // Reset text direction
                    }}
                  >
                    {item.label}
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: item.color,
                        boxShadow: `0 0 6px ${item.color}80`,
                      }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div
        ref={fabRef}
        className="fixed z-50"
        style={{
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          right: '1rem',
        }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))'
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: isOpen
              ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 4px 24px rgba(59,130,246,0.3), 0 4px 24px rgba(139,92,246,0.2)',
            border: isOpen ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
          }}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white/80" />
          ) : (
            <Navigation className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
          )}

          {/* Red dot indicator when WhatsApp is disconnected */}
          {!waConnected && !isOpen && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 animate-pulse"
              style={{
                background: '#ef4444',
                borderColor: 'rgba(8,8,14,0.95)',
                boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              }}
            />
          )}

          {/* Glow ring animation when closed */}
          {!isOpen && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              }}
            />
          )}
        </motion.button>
      </div>
    </>
  )
}

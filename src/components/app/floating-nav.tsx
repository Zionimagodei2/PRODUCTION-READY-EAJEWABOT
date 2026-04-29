'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, type TabId } from '@/store/app-store'
import { Home, Megaphone, Users, Wrench, Settings, X, Navigation } from 'lucide-react'

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

  const handleNavClick = useCallback((tabId: TabId) => {
    setActiveTab(tabId)
    setIsOpen(false)
  }, [setActiveTab])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener)
    }
  }, [isOpen])

  // Auto-hide when keyboard is open
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const handleResize = () => {
      const isKeyboard = (window.innerHeight - vv!.height) > 100
      setIsKeyboardVisible(isKeyboard)
      if (isKeyboard) setIsOpen(false)
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
      {isOpen && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <div ref={fabRef}>
      {/* Fan-out navigation items */}
      {isOpen && (
        <div
          className="fixed z-[70] flex flex-col gap-2 items-end"
          style={{
            bottom: '5rem',
            right: '1rem',
          }}
        >
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-colors duration-150 active:scale-95"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)`
                    : 'rgba(12, 12, 20, 0.95)',
                  borderColor: isActive ? `${item.color}40` : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: isActive
                    ? `0 0 16px ${item.color}12, 0 4px 12px rgba(0,0,0,0.3)`
                    : '0 4px 12px rgba(0,0,0,0.3)',
                }}
                aria-label={item.label}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    background: isActive ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                    color: isActive ? item.color : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span
                  className="text-[13px] font-semibold whitespace-nowrap"
                  style={{ color: isActive ? item.color : 'rgba(255,255,255,0.6)' }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* FAB Button — fully visible, high z-index */}
      <div
        className="fixed z-[70]"
        style={{
          bottom: '1.25rem',
          right: '1rem',
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-150 active:scale-90"
          style={{
            background: isOpen
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: isOpen
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(59,130,246,0.3), 0 4px 24px rgba(139,92,246,0.2)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white/80" />
          ) : (
            <Navigation className="w-6 h-6 text-white" />
          )}

          {/* Red dot indicator when WhatsApp is disconnected */}
          {!waConnected && !isOpen && (
            <div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: '#ef4444',
                borderColor: 'rgba(8,8,14,0.95)',
                boxShadow: '0 0 8px rgba(239,68,68,0.5)',
              }}
            />
          )}
        </button>
      </div>
      </div>
    </>
  )
}

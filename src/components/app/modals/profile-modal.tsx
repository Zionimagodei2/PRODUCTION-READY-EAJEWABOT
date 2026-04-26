'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Settings, Shield, Bell, Moon, Sun,
  ChevronRight, Smartphone, Camera, Edit3, Mail, Phone, MapPin, Crown, HelpCircle, Info, LogOut
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

type ProfileTab = 'main' | 'edit' | 'preferences'

export function ProfileModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<ProfileTab>('main')
  const { waConnected, setActiveTab } = useAppStore()
  const { addToast } = useToastStore()

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  // Load profile from localStorage on mount
  const loadProfile = useCallback(() => {
    try {
      const saved = localStorage.getItem('eaje-profile')
      if (saved) {
        const profile = JSON.parse(saved)
        return { displayName: profile.displayName || '', email: profile.email || '', phone: profile.phone || '', location: profile.location || '' }
      }
    } catch {}
    return null
  }, [])

  // Apply profile when modal opens
  useEffect(() => {
    if (!isOpen) return
    const profile = loadProfile()
    if (profile) {
      queueMicrotask(() => {
        setDisplayName(profile.displayName)
        setEmail(profile.email)
        setPhone(profile.phone)
        setLocation(profile.location)
      })
    }
  }, [isOpen, loadProfile])

  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setTab('main'), 200)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const saveProfile = () => {
    try {
      localStorage.setItem('eaje-profile', JSON.stringify({
        displayName, email, phone, location
      }))
      setIsEditing(false)
      addToast({ type: 'success', title: 'Profile saved' })
    } catch {
      addToast({ type: 'error', title: 'Failed to save profile' })
    }
  }

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EW'

  return (
    <>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center hover:border-white/20 hover:bg-gradient-to-br hover:from-blue-500/25 hover:to-purple-500/25 transition-all flex-shrink-0"
        aria-label="Profile"
      >
        <User className="w-4 h-4 text-white/60" />
      </button>

      {/* Modal - rendered via portal to escape header containing block */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center"
              onClick={close}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg rounded-t-3xl bg-[#0d0d14] border-t border-white/10 max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-2 flex-shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {tab !== 'main' && (
                      <button
                        onClick={() => setTab('main')}
                        className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors mr-1"
                      >
                        <svg className="w-3.5 h-3.5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}
                    <h3 className="text-base font-bold text-white/95">
                      {tab === 'main' ? 'Profile' : tab === 'edit' ? 'Edit Profile' : 'Preferences'}
                    </h3>
                  </div>
                  <button
                    onClick={close}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-5 py-4">
                  <AnimatePresence mode="wait">
                    {tab === 'main' && (
                      <motion.div
                        key="main"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-5"
                      >
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center text-center pt-2">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 25px rgba(59,130,246,0.3)' }}>
                              <span className="text-2xl font-black text-white">{initials}</span>
                            </div>
                            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/15 transition-colors">
                              <Camera className="w-3.5 h-3.5 text-white/60" />
                            </button>
                            {waConnected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0d0d14] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              </div>
                            )}
                          </div>
                          <h2 className="text-lg font-bold text-white/95 mt-3">
                            {displayName || 'EAJE User'}
                          </h2>
                          <p className="text-xs text-white/40 mt-0.5">
                            {email || 'Set up your profile to get started'}
                          </p>
                          {waConnected && (
                            <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-semibold text-emerald-400">WhatsApp Connected</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Profile Info */}
                        {(displayName || phone || location) && (
                          <div className="glass-card rounded-xl p-3 space-y-2">
                            {displayName && (
                              <div className="flex items-center gap-2.5">
                                <Edit3 className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-xs text-white/60">{displayName}</span>
                              </div>
                            )}
                            {phone && (
                              <div className="flex items-center gap-2.5">
                                <Phone className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-xs text-white/60">{phone}</span>
                              </div>
                            )}
                            {email && (
                              <div className="flex items-center gap-2.5">
                                <Mail className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-xs text-white/60">{email}</span>
                              </div>
                            )}
                            {location && (
                              <div className="flex items-center gap-2.5">
                                <MapPin className="w-3.5 h-3.5 text-white/30" />
                                <span className="text-xs text-white/60">{location}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="space-y-1">
                          <button
                            onClick={() => setTab('edit')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                              <Edit3 className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-white/80">Edit Profile</p>
                              <p className="text-[10px] text-white/30">Update your name, email, and phone</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                          </button>

                          <button
                            onClick={() => setTab('preferences')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/15 flex items-center justify-center">
                              <Settings className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-white/80">Preferences</p>
                              <p className="text-[10px] text-white/30">Theme, notifications, and privacy</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                          </button>

                          <button
                            onClick={() => {
                              close()
                              setActiveTab('settings')
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-pink-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-white/80">Settings</p>
                              <p className="text-[10px] text-white/30">App settings and configuration</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                          </button>

                          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                              <Crown className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-white/80">Upgrade to Pro</p>
                              <p className="text-[10px] text-white/30">Unlock all features and unlimited usage</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                          </button>

                          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                              <HelpCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-semibold text-white/80">Help & Support</p>
                              <p className="text-[10px] text-white/30">FAQs, guides, and contact support</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                          </button>
                        </div>

                        {/* App Info */}
                        <div className="text-center pt-2 pb-4">
                          <p className="text-[10px] text-white/20">EAJE WhatsBot v1.0.0</p>
                          <p className="text-[9px] text-white/15 mt-0.5">Enterprise WhatsApp Automation</p>
                        </div>
                      </motion.div>
                    )}

                    {tab === 'edit' && (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col items-center mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg relative">
                            <span className="text-xl font-black text-white">{initials}</span>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                              <Camera className="w-3 h-3 text-white/60" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] text-white/40 font-medium mb-1.5 block">Display Name</label>
                            <div className="relative">
                              <Edit3 className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-white/40 font-medium mb-1.5 block">Email</label>
                            <div className="relative">
                              <Mail className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-white/40 font-medium mb-1.5 block">Phone Number</label>
                            <div className="relative">
                              <Phone className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+234 801 234 5678"
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-white/40 font-medium mb-1.5 block">Location</label>
                            <div className="relative">
                              <MapPin className="w-3.5 h-3.5 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, Country"
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setTab('main')}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/40 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveProfile}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
                            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                          >
                            Save Profile
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {tab === 'preferences' && (
                      <motion.div
                        key="preferences"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        {/* Theme */}
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              {darkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white/80">Dark Mode</p>
                              <p className="text-[10px] text-white/30">Use dark theme throughout the app</p>
                            </div>
                            <button
                              onClick={() => setDarkMode(!darkMode)}
                              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                                darkMode ? 'bg-purple-500/30 border border-purple-500/40' : 'bg-white/5 border border-white/10'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                                darkMode ? 'left-5 bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'left-0.5 bg-white/30'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Notifications */}
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Bell className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white/80">Push Notifications</p>
                              <p className="text-[10px] text-white/30">Get notified about messages and updates</p>
                            </div>
                            <button
                              onClick={() => setNotifications(!notifications)}
                              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                                notifications ? 'bg-blue-500/30 border border-blue-500/40' : 'bg-white/5 border border-white/10'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                                notifications ? 'left-5 bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'left-0.5 bg-white/30'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Privacy */}
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white/80">Privacy Mode</p>
                              <p className="text-[10px] text-white/30">Hide phone numbers in shared exports</p>
                            </div>
                          </div>
                        </div>

                        {/* About */}
                        <div className="glass-card rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <Info className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-white/80">About EAJE WhatsBot</p>
                              <p className="text-[10px] text-white/30">Version 1.0.0 • Enterprise WhatsApp Automation</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

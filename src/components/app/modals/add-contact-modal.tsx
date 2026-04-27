'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import { X, UserPlus, Phone, Mail, Building2, Tag, StickyNote } from 'lucide-react'

const availableTags = ['customer', 'vip', 'lead', 'prospect', 'wholesale', 'hot']

const tagColors: Record<string, string> = {
  customer: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  vip: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  lead: 'bg-green-500/15 text-green-400 border-green-500/20',
  hot: 'bg-red-500/15 text-red-400 border-red-500/20',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  wholesale: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
}

interface FormData {
  name: string
  phone: string
  email: string
  company: string
  tags: string[]
  notes: string
}

interface FormErrors {
  name?: string
  phone?: string
}

export function AddContactModal() {
  const { addContactOpen, setAddContactOpen, setPendingNewContact } = useAppStore()
  const { addToast } = useToastStore()
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    company: '',
    tags: [],
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const close = useCallback(() => {
    setAddContactOpen(false)
    setForm({ name: '', phone: '', email: '', company: '', tags: [], notes: '' })
    setErrors({})
  }, [setAddContactOpen])

  useEffect(() => {
    if (!addContactOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [addContactOpen, close])

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = 'Full name is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const newContact = {
      id: Date.now().toString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      tags: form.tags,
      lastMessage: '',
      status: 'active' as const,
      dateAdded: new Date().toISOString().split('T')[0],
    }

    setPendingNewContact(newContact)
    addToast({ type: 'success', title: 'Contact Added', message: `${newContact.name} has been added to your contacts`, duration: 3000 })
    close()
  }

  return (
    <AnimatePresence>
      {addContactOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-t-3xl bg-[#0d0d14] border-t border-white/10 p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-neon-blue" />
                </div>
                <h2 className="text-lg font-bold text-white/95">Add New Contact</h2>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                  Full Name *
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }))
                      if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                    }}
                    placeholder="John Smith"
                    className={`w-full bg-white/5 border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none transition-colors ${
                      errors.name
                        ? 'border-red-500/50 focus:border-red-500/70'
                        : 'border-white/10 focus:border-neon-blue/50'
                    }`}
                    style={errors.name ? {} : { background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-red-400 mt-1 ml-1">{errors.name}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-white/40 text-sm">+</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }))
                      if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    placeholder="1 234 567 8901"
                    className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none transition-colors ${
                      errors.phone
                        ? 'border-red-500/50 focus:border-red-500/70'
                        : 'border-white/10 focus:border-neon-blue/50'
                    }`}
                    style={errors.phone ? {} : { background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-red-400 mt-1 ml-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                  Email <span className="text-white/20">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="john@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-blue/50 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                  Company <span className="text-white/20">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Acme Corp"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-blue/50 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                        form.tags.includes(tag)
                          ? tagColors[tag]
                          : 'bg-white/5 text-white/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                  <StickyNote className="w-3 h-3" /> Notes <span className="text-white/20">(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Add any notes about this contact..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-neon-blue/50 transition-colors resize-none"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={close}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(139,92,246,0.15)' }}
              >
                Add Contact
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

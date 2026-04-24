'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'
import {
  ArrowLeft, Wand2, ArrowRight, Check, CheckCheck, ChevronRight,
  Megaphone, MessageSquare, Bell, ClipboardList,
  Type, FileText, Image as ImageIcon, Variable, Calendar, Clock,
  Repeat, Rocket, Users, Target, Send, Eye, Trash2
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

const campaignTypes = [
  { value: 'promotional', label: 'Promotional', icon: <Megaphone className="w-4 h-4" />, color: '#3b82f6' },
  { value: 'transactional', label: 'Transactional', icon: <MessageSquare className="w-4 h-4" />, color: '#22c55e' },
  { value: 'reminder', label: 'Reminder', icon: <Bell className="w-4 h-4" />, color: '#f59e0b' },
  { value: 'survey', label: 'Survey', icon: <ClipboardList className="w-4 h-4" />, color: '#8b5cf6' },
]

interface AudienceOption {
  value: string
  label: string
  count: number
}

interface TemplateOption {
  value: string
  label: string
  content: string
}

const recurrenceOptions = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const stepInfo = [
  { title: 'Details', fullTitle: 'Campaign Details', icon: <Type className="w-4 h-4" /> },
  { title: 'Compose', fullTitle: 'Compose Message', icon: <FileText className="w-4 h-4" /> },
  { title: 'Schedule', fullTitle: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  { title: 'Launch', fullTitle: 'Review & Launch', icon: <Rocket className="w-4 h-4" /> },
]

// Confetti particles for success animation
const confettiColors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']
const confettiParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: confettiColors[i % confettiColors.length],
  left: `${Math.random() * 100}%`,
  delay: Math.random() * 0.5,
  rotation: Math.random() * 360,
  size: 4 + Math.random() * 4,
}))

export function CampaignWizardPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTransition, setShowTransition] = useState(true)

  // Step 1
  const [campaignName, setCampaignName] = useState('')
  const [campaignType, setCampaignType] = useState('promotional')
  const [audience, setAudience] = useState('all')
  const [audiences, setAudiences] = useState<AudienceOption[]>([
    { value: 'all', label: 'All Contacts', count: 0 },
  ])
  const [audiencesLoading, setAudiencesLoading] = useState(true)

  // Step 2
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [mediaFile, setMediaFile] = useState<string | null>(null)
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([
    { value: '', label: 'Write your own...', content: '' },
  ])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // Step 3
  const [sendNow, setSendNow] = useState(true)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [recurrence, setRecurrence] = useState('once')

  // Step direction for animation
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward')

  const charCount = message.length
  const maxChars = 4096

  // Page transition flash effect
  useEffect(() => {
    const timer = setTimeout(() => setShowTransition(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Fetch real audience segments from contacts API
  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const res = await fetch('/api/contacts')
        if (res.ok) {
          const contacts: { id: string; tags: string }[] = await res.json()
          const totalCount = contacts.length

          // Build audience segments from actual contact tags
          const tagMap = new Map<string, number>()
          contacts.forEach((c) => {
            if (c.tags) {
              const tags = c.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
              tags.forEach((tag) => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
              })
            }
          })

          // Build audiences: "All Contacts" + unique tag groups
          const audienceList: AudienceOption[] = [
            { value: 'all', label: 'All Contacts', count: totalCount },
          ]

          Array.from(tagMap.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([tag, count]) => {
              audienceList.push({
                value: tag,
                label: tag.charAt(0).toUpperCase() + tag.slice(1),
                count,
              })
            })

          setAudiences(audienceList)
        }
      } catch {
        // Keep default on failure
      } finally {
        setAudiencesLoading(false)
      }
    }
    fetchAudiences()
  }, [])

  // Fetch real templates from the API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates')
        if (res.ok) {
          const templates: { id: string; name: string; content: string; category: string }[] = await res.json()

          const options: TemplateOption[] = [
            { value: '', label: 'Write your own...', content: '' },
          ]

          templates.forEach((t) => {
            options.push({
              value: t.id,
              label: t.name,
              content: t.content,
            })
          })

          setTemplateOptions(options)
        }
      } catch {
        // Keep default on failure
      } finally {
        setTemplatesLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const insertVariable = useCallback((variable: string) => {
    setMessage((prev) => prev + variable)
  }, [])

  const handleTemplateChange = useCallback((value: string) => {
    setSelectedTemplate(value)
    if (value) {
      const template = templateOptions.find((t) => t.value === value)
      if (template?.content) {
        setMessage(template.content)
      }
    }
  }, [templateOptions])

  const handleNext = useCallback(() => {
    if (currentStep === 1 && !campaignName.trim()) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Please enter a campaign name' })
      return
    }
    if (currentStep === 2 && !message.trim()) {
      addToast({ type: 'warning', title: 'Missing Message', message: 'Please compose your message' })
      return
    }
    if (currentStep === 3 && !sendNow && !scheduleDate) {
      addToast({ type: 'warning', title: 'Missing Schedule', message: 'Please select a date' })
      return
    }
    setStepDirection('forward')
    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step)
  }, [currentStep, campaignName, message, sendNow, scheduleDate, addToast])

  const handleBack = useCallback(() => {
    setStepDirection('back')
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step)
  }, [])

  const handleLaunch = useCallback(() => {
    setIsLaunching(true)
    // Actually create the campaign in the database
    const createCampaign = async () => {
      try {
        const selectedAudienceCount = audiences.find((a) => a.value === audience)?.count ?? 0
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: campaignName || 'Untitled Campaign',
            status: sendNow ? 'active' : 'scheduled',
            total: selectedAudienceCount,
            message: message,
          }),
        })
        if (!res.ok) {
          addToast({ type: 'error', title: 'Failed to create campaign', message: 'Please try again' })
          setIsLaunching(false)
          setShowConfirm(false)
          return
        }
      } catch {
        addToast({ type: 'error', title: 'Network error', message: 'Could not create campaign' })
        setIsLaunching(false)
        setShowConfirm(false)
        return
      }
      setIsLaunching(false)
      setShowConfirm(false)
      setShowSuccess(true)
      addToast({
        type: 'success',
        title: 'Campaign Launched! 🚀',
        message: `"${campaignName}" is now ${sendNow ? 'sending' : 'scheduled'}`,
        duration: 5000,
      })
      // After showing success animation, navigate back
      setTimeout(() => {
        goBack()
      }, 2500)
    }
    createCampaign()
  }, [campaignName, sendNow, addToast, goBack, audiences, audience, message])

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'current'
    return 'upcoming'
  }

  const selectedAudience = audiences.find((a) => a.value === audience) ?? audiences[0]
  const selectedType = campaignTypes.find((t) => t.value === campaignType)

  const slideVariants = {
    enter: (direction: 'forward' | 'back') => ({
      x: direction === 'forward' ? 30 : -30,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'forward' | 'back') => ({
      x: direction === 'forward' ? -30 : 30,
      opacity: 0,
    }),
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Page Transition Flash */}
      {showTransition && <div className="page-transition-flash" />}

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiParticles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ y: -20, x: p.left, rotate: p.rotation, opacity: 1 }}
                  animate={{ y: '110vh', rotate: p.rotation + 360, opacity: 0 }}
                  transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
                  className="absolute"
                  style={{ left: p.left, width: p.size, height: p.size, background: p.color, borderRadius: p.id % 3 === 0 ? '50%' : '2px' }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              {/* Animated Checkmark Circle */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30 flex items-center justify-center animate-success"
                style={{ boxShadow: '0 0 30px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.1)' }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <motion.path
                    d="M12 24L21 33L36 15"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <h3 className="text-xl font-bold text-white/95">Campaign Launched!</h3>
                <p className="text-sm text-white/50 mt-1">Your campaign is now {sendNow ? 'sending' : 'scheduled'}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white/95 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-neon-blue neon-text-glow" />
            Campaign Wizard
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5">Create a new campaign in 4 easy steps</p>
        </div>
      </div>

      {/* Step Progress Indicator - Enhanced */}
      <div className="glass-card rounded-2xl p-4">
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between">
          {stepInfo.map((step, i) => {
            const status = getStepStatus(i + 1)
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      scale: status === 'current' ? 1.15 : 1,
                      backgroundColor:
                        status === 'completed'
                          ? '#22c55e'
                          : status === 'current'
                          ? '#3b82f6'
                          : 'rgba(255,255,255,0.06)',
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      status === 'completed'
                        ? 'border-green-500/40'
                        : status === 'current'
                        ? 'border-blue-500/40'
                        : 'border-white/10'
                    }`}
                    style={
                      status === 'current'
                        ? { boxShadow: '0 0 16px rgba(59,130,246,0.3), 0 0 8px rgba(59,130,246,0.15)' }
                        : status === 'completed'
                        ? { boxShadow: '0 0 12px rgba(34,197,94,0.2)' }
                        : undefined
                    }
                  >
                    {status === 'completed' ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <span
                        className={`text-xs font-bold ${
                          status === 'current' ? 'text-blue-300' : 'text-white/30'
                        }`}
                      >
                        {i + 1}
                      </span>
                    )}
                  </motion.div>
                  <span
                    className={`text-[9px] font-medium text-center leading-tight transition-colors duration-300 ${
                      status === 'current'
                        ? 'text-blue-300'
                        : status === 'completed'
                        ? 'text-green-400/60'
                        : 'text-white/25'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {i < 3 && (
                  <div className="flex-1 mx-1.5 mt-[-16px]">
                    <motion.div
                      className={`h-px ${
                        status === 'completed' ? 'bg-green-500/40' : 'bg-white/8'
                      }`}
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Live Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-inset rounded-xl p-3 campaign-preview-pulse"
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3 h-3 text-blue-400/60" />
          <span className="text-[9px] text-white/30 font-medium uppercase tracking-wider">Live Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">
              {campaignName || 'Untitled Campaign'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: `${selectedType?.color}15`, color: selectedType?.color, border: `1px solid ${selectedType?.color}25` }}
              >
                {selectedType?.label}
              </span>
              <span className="text-[9px] text-white/30">
                → {selectedAudience?.count.toLocaleString()} contacts
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/30">
              {sendNow ? 'Send Now' : `${scheduleDate || 'Not set'}`}
            </p>
            <p className="text-[9px] text-white/20 mt-0.5">
              {message ? `${charCount} chars` : 'No message'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={stepDirection}>
        {/* Step 1: Campaign Details */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            custom={stepDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 neon-glow-blue space-y-4">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-neon-blue" /> Campaign Details
              </h3>

              {/* Campaign Name - Floating Label */}
              <div className="floating-label-group">
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder=" "
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pt-5 pb-2 text-sm text-white placeholder-white/0 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all"
                />
                <label>Campaign Name</label>
              </div>

              {/* Campaign Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50">Campaign Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {campaignTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      onClick={() => setCampaignType(type.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-200 ${
                        campaignType === type.value
                          ? 'border-blue-500/30 bg-blue-500/10'
                          : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                      style={
                        campaignType === type.value
                          ? { boxShadow: `0 0 12px ${type.color}20` }
                          : undefined
                      }
                    >
                      <div style={{ color: type.color }}>{type.icon}</div>
                      <span
                        className={`text-xs font-medium ${
                          campaignType === type.value ? 'text-white/90' : 'text-white/50'
                        }`}
                      >
                        {type.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Target Audience - built from real DB data */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50">Target Audience</label>
                {audiencesLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/6 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {audiences.map((aud) => (
                      <motion.button
                        key={aud.value}
                        onClick={() => setAudience(aud.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-200 ${
                          audience === aud.value
                            ? 'border-blue-500/30 bg-blue-500/10'
                            : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-xs font-medium block ${
                              audience === aud.value ? 'text-white/90' : 'text-white/50'
                            }`}
                          >
                            {aud.label}
                          </span>
                          <span className="text-[9px] text-white/25">{aud.count} contacts</span>
                        </div>
                        {audience === aud.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                          >
                            <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Compose Message */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            custom={stepDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 neon-glow-blue space-y-4">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-neon-blue" /> Compose Message
              </h3>

              {/* Template Selector - uses real templates from DB */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50">Template</label>
                {templatesLoading ? (
                  <div className="h-10 rounded-xl bg-white/[0.03] border border-white/6 animate-pulse" />
                ) : (
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-blue-500/40 transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: 'none' }}
                  >
                    {templateOptions.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#14141f] text-white/80">
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Message Text Area - Floating Label */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-white/50">Message</label>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      charCount > maxChars * 0.9 ? 'text-red-400' : 'text-white/30'
                    }`}
                  >
                    {charCount}/{maxChars}
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.07] transition-all resize-none"
                  />
                  {/* Character count bar */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full transition-colors ${
                          charCount > maxChars * 0.9 ? 'bg-red-500/50' : 'bg-blue-500/30'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((charCount / maxChars) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Variable Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50 flex items-center gap-1">
                  <Variable className="w-3 h-3" /> Insert Variable
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['{name}', '{date}', '{company}'].map((v) => (
                    <motion.button
                      key={v}
                      onClick={() => insertVariable(v)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      {v}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Media Attachment
                </label>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="w-full"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setMediaFile(file.name)
                        addToast({
                          type: 'success',
                          title: 'Media Added',
                          message: `${file.name} attached`,
                        })
                      }
                    }}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/30 transition-colors flex flex-col items-center gap-2 bg-white/[0.02] cursor-pointer"
                  >
                    {mediaFile ? (
                      <>
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                        <span className="text-xs text-blue-300 font-medium">{mediaFile}</span>
                        <span className="text-[10px] text-white/25">Click to change</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-white/20" />
                        <span className="text-xs text-white/40">Click to upload image</span>
                        <span className="text-[10px] text-white/20">JPG, PNG, GIF up to 5MB</span>
                      </>
                    )}
                  </label>
                </motion.div>
                {mediaFile && (
                  <motion.button
                    onClick={() => {
                      setMediaFile(null)
                      addToast({ type: 'info', title: 'Media Removed', message: 'Attachment removed' })
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1 mt-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove attachment
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Schedule */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            custom={stepDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 neon-glow-blue space-y-4">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-neon-blue" /> Schedule
              </h3>

              {/* Send Now / Schedule Toggle */}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setSendNow(true)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    sendNow
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      : 'border-white/8 bg-white/[0.02] text-white/40'
                  }`}
                  style={sendNow ? { boxShadow: '0 0 12px rgba(59,130,246,0.2)' } : undefined}
                >
                  <Send className="w-4 h-4" /> Send Now
                </motion.button>
                <motion.button
                  onClick={() => setSendNow(false)}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                    !sendNow
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                      : 'border-white/8 bg-white/[0.02] text-white/40'
                  }`}
                  style={!sendNow ? { boxShadow: '0 0 12px rgba(59,130,246,0.2)' } : undefined}
                >
                  <Clock className="w-4 h-4" /> Schedule
                </motion.button>
              </div>

              {/* Date & Time Pickers */}
              <AnimatePresence>
                {!sendNow && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="floating-label-group">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        placeholder=" "
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pt-5 pb-2 text-sm text-white/80 focus:outline-none focus:border-blue-500/40 transition-colors"
                      />
                      <label>Date</label>
                    </div>
                    <div className="floating-label-group">
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        placeholder=" "
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 pt-5 pb-2 text-sm text-white/80 focus:outline-none focus:border-blue-500/40 transition-colors"
                      />
                      <label>Time</label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recurrence */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/50 flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> Recurrence
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {recurrenceOptions.map((opt) => (
                    <motion.button
                      key={opt.value}
                      onClick={() => setRecurrence(opt.value)}
                      whileTap={{ scale: 0.95 }}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all duration-200 ${
                        recurrence === opt.value
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                          : 'border-white/8 bg-white/[0.02] text-white/40'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Launch */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            custom={stepDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-4 neon-glow-blue space-y-4">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-neon-blue" /> Review & Launch
              </h3>

              {/* Summary Card */}
              <div className="space-y-3">
                {/* Campaign Info */}
                <div className="bg-white/[0.03] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Campaign</span>
                    <span className="text-xs text-white/70 font-medium">{campaignName || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Type</span>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: selectedType?.color }}>{selectedType?.icon}</span>
                      <span className="text-xs text-white/70 font-medium">{selectedType?.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Audience</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-white/40" />
                      <span className="text-xs text-white/70 font-medium">
                        {selectedAudience?.label} ({selectedAudience?.count})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Preview - WhatsApp style */}
                <div className="bg-white/[0.03] rounded-xl p-3 space-y-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Message</span>
                  <div className="chat-bubble-sent rounded-xl p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs text-white/70 leading-relaxed">
                      {message || 'No message composed'}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[8px] text-white/25">12:00</span>
                      <CheckCheck className="w-2.5 h-2.5 text-blue-400/40" />
                    </div>
                  </div>
                  {mediaFile && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-300/60">
                      <ImageIcon className="w-3 h-3" /> {mediaFile}
                    </div>
                  )}
                </div>

                {/* Schedule Info */}
                <div className="bg-white/[0.03] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Delivery</span>
                    <span className="text-xs text-white/70 font-medium">
                      {sendNow ? 'Send Immediately' : `Scheduled: ${scheduleDate} at ${scheduleTime}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Recurrence</span>
                    <span className="text-xs text-white/70 font-medium capitalize">{recurrence}</span>
                  </div>
                </div>

                {/* Estimated Reach */}
                <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-xl p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center"
                    style={{ boxShadow: '0 0 12px rgba(59,130,246,0.15)' }}
                  >
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Estimated Reach</p>
                    <p className="text-lg font-extrabold text-neon-blue">
                      {selectedAudience?.count.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <motion.button
              onClick={() => setShowConfirm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500/25 to-purple-500/25 border border-blue-500/30 text-white font-bold text-sm hover:from-blue-500/35 hover:to-purple-500/35 transition-all"
              style={{ boxShadow: '0 0 20px rgba(59,130,246,0.2), 0 0 10px rgba(139,92,246,0.15)' }}
            >
              <Rocket className="w-4 h-4" /> Launch Campaign
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex gap-3">
          {currentStep > 1 && (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-sm hover:bg-white/10 transition-colors"
            >
              Back
            </motion.button>
          )}
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-500/10 border border-blue-500/25 text-blue-300 font-semibold text-sm hover:from-blue-500/30 hover:to-blue-500/15 transition-all"
            style={{ boxShadow: '0 0 14px rgba(59,130,246,0.15)' }}
          >
            Next <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#14141f] border-t border-white/10 rounded-t-3xl p-6 space-y-4"
            >
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto" />
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto"
                  style={{ boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}
                >
                  <Rocket className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white/95">Launch Campaign?</h3>
                <p className="text-xs text-white/50">
                  Your campaign &quot;{campaignName}&quot; will be{' '}
                  {sendNow ? 'sent immediately' : `scheduled for ${scheduleDate} at ${scheduleTime}`} to{' '}
                  {selectedAudience?.count.toLocaleString()} contacts.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowConfirm(false)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleLaunch}
                  disabled={isLaunching}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm disabled:opacity-50 transition-opacity"
                >
                  {isLaunching ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Launching...
                    </span>
                  ) : '🚀 Launch Now'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

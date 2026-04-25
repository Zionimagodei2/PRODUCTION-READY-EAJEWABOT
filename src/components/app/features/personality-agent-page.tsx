'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Brain, Sparkles, Loader2, Upload, MessageSquare, 
  ToggleLeft, ToggleRight, Zap, Bot, Smile, ChevronDown, ChevronUp,
  Send, FileText, AlertTriangle, CheckCircle2, RefreshCw, MessageCircle,
  Gauge, TrendingUp, Star, Award
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

interface PersonalityProfile {
  id: string
  tone: string
  style: string
  language: string
  greetingStyle: string
  closingStyle: string
  emojiUsage: string
  formalityLevel: number
  responsePatterns: string
  samplePhrases: string
  lastTrainedAt: string
}

const toneBadgeColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  professional: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'rgba(59,130,246,0.3)' },
  casual: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/20', glow: 'rgba(34,197,94,0.3)' },
  friendly: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.3)' },
  formal: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'rgba(139,92,246,0.3)' },
  enthusiastic: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', glow: 'rgba(249,115,22,0.3)' },
  calm: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'rgba(6,182,212,0.3)' },
}

const styleBadgeColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  concise: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'rgba(6,182,212,0.3)' },
  detailed: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'rgba(59,130,246,0.3)' },
  conversational: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/20', glow: 'rgba(34,197,94,0.3)' },
  direct: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/20', glow: 'rgba(249,115,22,0.3)' },
  storytelling: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'rgba(139,92,246,0.3)' },
}

const emojiIndicators: Record<string, { emoji: string; label: string }> = {
  minimal: { emoji: '😏', label: 'Minimal' },
  moderate: { emoji: '🙂', label: 'Moderate' },
  heavy: { emoji: '🤩', label: 'Heavy' },
  none: { emoji: '😐', label: 'None' },
}

/** Compute a personality match score (0-100) based on profile data */
function computePersonalityScore(profile: PersonalityProfile | null): number {
  if (!profile) return 0
  let score = 0
  // Base score for having a profile
  score += 20
  // Formality level clarity (higher = more defined personality)
  score += Math.min(profile.formalityLevel * 3, 15)
  // Has greeting and closing style
  if (profile.greetingStyle && profile.greetingStyle !== 'N/A') score += 10
  if (profile.closingStyle && profile.closingStyle !== 'N/A') score += 10
  // Has response patterns
  if (profile.responsePatterns) score += 15
  // Has sample phrases
  if (profile.samplePhrases) score += 15
  // Recently trained
  try {
    const trainedDate = new Date(profile.lastTrainedAt)
    const daysSinceTrained = (Date.now() - trainedDate.getTime()) / 86400000
    if (daysSinceTrained < 7) score += 15
    else if (daysSinceTrained < 30) score += 8
  } catch {
    // no bonus
  }
  return Math.min(score, 100)
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Developing'
  if (score > 0) return 'Basic'
  return 'Not Trained'
}

export function PersonalityAgentPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()

  const [profile, setProfile] = useState<PersonalityProfile | null>(null)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainingStep, setTrainingStep] = useState('')
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [testMessage, setTestMessage] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [generatingReply, setGeneratingReply] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importCount, setImportCount] = useState<number | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [conversationCount, setConversationCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/personality')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setAutoReplyEnabled(data.autoReplyEnabled || false)
      }
    } catch {
      console.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchConversationCount = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversationCount(data.total || 0)
      }
    } catch {
      console.error('Failed to fetch conversation count')
    }
  }, [])

  useEffect(() => {
    fetchProfile()
    fetchConversationCount()
  }, [fetchProfile, fetchConversationCount])

  const handleTrain = async () => {
    try {
      setTraining(true)
      setTrainingProgress(0)
      setError(null)

      // Animate progress steps
      const progressSteps = [
        { step: 'Analyzing conversations...', progress: 25 },
        { step: 'Extracting personality traits...', progress: 50 },
        { step: 'Building response patterns...', progress: 75 },
        { step: 'Finalizing model...', progress: 90 },
      ]

      for (const { step, progress } of progressSteps) {
        setTrainingStep(step)
        setTrainingProgress(progress)
        await new Promise(r => setTimeout(r, 600))
      }

      const res = await fetch('/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'train' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to train personality')
        addToast({ type: 'error', message: data.error || 'Training failed' })
        return
      }

      setTrainingStep('Complete! ✓')
      setTrainingProgress(100)

      setProfile(data.profile)
      addToast({ 
        type: 'success', 
        message: `Personality trained! Analyzed ${data.conversationsAnalyzed} conversations.` 
      })
    } catch {
      setError('Network error. Please try again.')
      addToast({ type: 'error', message: 'Network error during training' })
    } finally {
      setTimeout(() => {
        setTraining(false)
        setTrainingStep('')
        setTrainingProgress(0)
      }, 1000)
    }
  }

  const handleGenerateReply = async () => {
    if (!testMessage.trim()) return

    try {
      setGeneratingReply(true)
      setGeneratedReply('')
      setError(null)

      const res = await fetch('/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-reply', message: testMessage }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate reply')
        addToast({ type: 'error', message: data.error || 'Reply generation failed' })
        return
      }

      setGeneratedReply(data.reply)
      addToast({ type: 'success', message: 'Reply generated!' })
    } catch {
      setError('Network error. Please try again.')
      addToast({ type: 'error', message: 'Network error during reply generation' })
    } finally {
      setGeneratingReply(false)
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return

    try {
      setImporting(true)
      setImportCount(null)
      setError(null)

      const res = await fetch('/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import-conversations', conversations: importText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to import conversations')
        addToast({ type: 'error', message: data.error || 'Import failed' })
        return
      }

      setImportCount(data.count)
      setImportText('')
      fetchConversationCount()
      addToast({ type: 'success', message: `Imported ${data.count} messages!` })
    } catch {
      setError('Network error. Please try again.')
      addToast({ type: 'error', message: 'Network error during import' })
    } finally {
      setImporting(false)
    }
  }

  const handleToggleAutoReply = async () => {
    try {
      const newValue = !autoReplyEnabled
      const res = await fetch('/api/personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-auto-reply', enabled: newValue }),
      })

      if (res.ok) {
        setAutoReplyEnabled(newValue)
        addToast({ 
          type: 'success', 
          message: newValue ? 'Auto-reply enabled! Your AI Twin will respond in your style.' : 'Auto-reply disabled' 
        })
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to toggle auto-reply' })
    }
  }

  const toneBadge = profile ? (toneBadgeColors[profile.tone.toLowerCase()] || toneBadgeColors.professional) : toneBadgeColors.professional
  const styleBadge = profile ? (styleBadgeColors[profile.style.toLowerCase()] || styleBadgeColors.concise) : styleBadgeColors.concise
  const emojiInfo = profile ? (emojiIndicators[profile.emojiUsage.toLowerCase()] || emojiIndicators.minimal) : emojiIndicators.minimal

  const personalityScore = computePersonalityScore(profile)
  const scoreColor = getScoreColor(personalityScore)
  const scoreLabel = getScoreLabel(personalityScore)

  const formatLastTrained = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Never'
    }
  }

  // Build personality summary sentence
  const personalitySummary = profile 
    ? `Your AI Twin speaks in a ${profile.tone}, ${profile.style} style, greets with "${profile.greetingStyle}", and closes with "${profile.closingStyle}". It uses ${profile.emojiUsage} emojis and maintains a formality level of ${profile.formalityLevel}/10.`
    : 'Train your AI Twin to learn your communication style.'

  const formalityColor = profile 
    ? profile.formalityLevel <= 3 ? '#22c55e' 
      : profile.formalityLevel <= 6 ? '#f59e0b' 
      : '#8b5cf6'
    : '#f59e0b'

  // SVG ring circumference = 2 * PI * r, r=36, so C = ~226.2
  const ringCircumference = 2 * Math.PI * 36
  const scoreOffset = ringCircumference - (ringCircumference * personalityScore / 100)

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.button
          onClick={goBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold text-white/95 flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            AI Twin
          </h1>
          <p className="text-[11px] text-white/40">Auto-reply in your style</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-Reply Toggle */}
          <motion.button
            onClick={handleToggleAutoReply}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200"
            style={{
              background: autoReplyEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${autoReplyEnabled ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: autoReplyEnabled ? '#4ade80' : '#f87171',
            }}
          >
            {autoReplyEnabled ? (
              <ToggleRight className="w-3.5 h-3.5" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5" />
            )}
            {autoReplyEnabled ? 'ON' : 'OFF'}
          </motion.button>
        </div>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-3 border-red-500/20 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-300">{error}</p>
            </div>
            <motion.button
              onClick={() => setError(null)}
              whileTap={{ scale: 0.9 }}
              className="text-white/30 hover:text-white/60"
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personality Preview Card - "Your AI Twin" with Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-inset rounded-2xl p-5 neon-glow-orange relative overflow-hidden"
      >
        {/* Decorative orb */}
        <div className="glow-orb w-32 h-32 bg-orange-500/30 -top-10 -right-10" style={{ animationDelay: '-2s' }} />
        <div className="glow-orb w-24 h-24 bg-amber-500/20 bottom-0 left-0" style={{ animationDelay: '-5s' }} />

        <div className="relative flex items-start gap-4">
          {/* Robot Avatar + Score Ring */}
          <div className="relative flex-shrink-0">
            {/* Personality Score Ring SVG */}
            <svg width="64" height="64" className="personality-score-ring" style={{ '--score-offset': scoreOffset } as React.CSSProperties}>
              <circle cx="32" cy="32" r="28" strokeWidth="4" className="personality-score-bg" />
              <circle 
                cx="32" cy="32" r="28" 
                strokeWidth="4" 
                stroke={scoreColor}
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 - (2 * Math.PI * 28 * personalityScore / 100)}
                className="personality-score-fill"
                style={{ 
                  filter: `drop-shadow(0 0 4px ${scoreColor}60)`,
                  transition: 'stroke-dashoffset 1s ease-out',
                }}
              />
            </svg>
            {/* Bot icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(245,158,11,0.1))',
                  boxShadow: '0 0 15px rgba(249,115,22,0.2)',
                }}
              >
                <Bot className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            {/* Active indicator */}
            {autoReplyEnabled && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 animate-breathe border border-black/30" style={{ color: '#22c55e' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-white/95">Your AI Twin</h3>
              {autoReplyEnabled && (
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/25">ACTIVE</span>
              )}
            </div>
            {/* Score display */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3" style={{ color: scoreColor }} />
                <span className="text-[11px] font-bold" style={{ color: scoreColor }}>
                  {personalityScore}%
                </span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold"
                style={{ 
                  background: `${scoreColor}15`, 
                  color: scoreColor, 
                  border: `1px solid ${scoreColor}25` 
                }}
              >
                {scoreLabel}
              </span>
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">{personalitySummary}</p>
          </div>
        </div>
      </motion.div>

      {/* Personality Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Personality Profile
          </h3>
          {profile && (
            <span className="text-[9px] text-white/30">
              Trained: {formatLastTrained(profile.lastTrainedAt)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/40">No personality profile yet</p>
            <p className="text-[10px] text-white/25 mt-1">Import conversations and train to create one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tone & Style Row - Animated Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div 
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-[10px] text-white/40 font-medium">Tone:</span>
                <span className={`trait-badge-animated text-[10px] font-bold px-2.5 py-1 rounded-lg ${toneBadge.bg} ${toneBadge.text} border ${toneBadge.border}`}
                  style={{ boxShadow: `0 0 8px ${toneBadge.glow}` }}
                >
                  {profile.tone}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-[10px] text-white/40 font-medium">Style:</span>
                <span className={`trait-badge-animated text-[10px] font-bold px-2.5 py-1 rounded-lg ${styleBadge.bg} ${styleBadge.text} border ${styleBadge.border}`}
                  style={{ boxShadow: `0 0 8px ${styleBadge.glow}` }}
                >
                  {profile.style}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-[10px] text-white/40 font-medium">Lang:</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/[0.06] text-white/60 border border-white/[0.08]">
                  {profile.language}
                </span>
              </motion.div>
            </div>

            {/* Personality Score Visual - Progress bar with glow */}
            <motion.div 
              className="glass-card rounded-xl p-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" style={{ color: scoreColor }} />
                  <span className="text-[10px] text-white/40 font-medium">Personality Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold" style={{ color: scoreColor }}>
                    {personalityScore}%
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold"
                    style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}20` }}
                  >
                    {scoreLabel}
                  </span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${personalityScore}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${scoreColor}50, ${scoreColor})`,
                    boxShadow: `0 0 10px ${scoreColor}40, 0 0 20px ${scoreColor}15`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-white/20">0%</span>
                <span className="text-[8px] text-white/20">100%</span>
              </div>
            </motion.div>

            {/* Greeting & Closing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-3">
                <p className="text-[9px] text-white/35 uppercase tracking-wider font-semibold mb-1">Greeting</p>
                <p className="text-sm text-white/80 font-medium">&ldquo;{profile.greetingStyle}&rdquo;</p>
              </div>
              <div className="glass-card rounded-xl p-3">
                <p className="text-[9px] text-white/35 uppercase tracking-wider font-semibold mb-1">Closing</p>
                <p className="text-sm text-white/80 font-medium">&ldquo;{profile.closingStyle}&rdquo;</p>
              </div>
            </div>

            {/* Emoji Usage */}
            <div className="flex items-center justify-between glass-card rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-white/40 font-medium">Emoji Usage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{emojiInfo.emoji}</span>
                <span className="text-[10px] font-bold text-white/60">{emojiInfo.label}</span>
              </div>
            </div>

            {/* Formality Level Progress Bar */}
            <div className="glass-card rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-white/40 font-medium">Formality Level</span>
                </div>
                <span className="text-xs font-bold" style={{ color: formalityColor }}>
                  {profile.formalityLevel}/10
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.formalityLevel * 10}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${formalityColor}60, ${formalityColor})`,
                    boxShadow: `0 0 8px ${formalityColor}40`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-white/20">Casual</span>
                <span className="text-[8px] text-white/20">Formal</span>
              </div>
            </div>

            {/* Response Patterns */}
            {profile.responsePatterns && (
              <div className="glass-card rounded-xl p-3">
                <p className="text-[9px] text-white/35 uppercase tracking-wider font-semibold mb-1">Response Patterns</p>
                <p className="text-[11px] text-white/60 leading-relaxed">{profile.responsePatterns}</p>
              </div>
            )}

            {/* Sample Phrases */}
            {profile.samplePhrases && (
              <div className="glass-card rounded-xl p-3">
                <p className="text-[9px] text-white/35 uppercase tracking-wider font-semibold mb-2">Sample Phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.samplePhrases.split(',').map((phrase, i) => (
                    <motion.span 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="trait-badge-animated text-[10px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300/80 border border-orange-500/15"
                    >
                      &ldquo;{phrase.trim()}&rdquo;
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Train Personality Button - Enhanced with progress visual */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={handleTrain}
          disabled={training || conversationCount === 0}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
          style={{
            background: training 
              ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,158,11,0.1))' 
              : 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(245,158,11,0.15))',
            border: '1px solid rgba(249,115,22,0.3)',
            boxShadow: training ? 'none' : '0 0 20px rgba(249,115,22,0.15), 0 0 40px rgba(249,115,22,0.05)',
            color: '#fb923c',
          }}
        >
          {training ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {trainingStep}
              {/* Training progress bar inside button */}
              <div className="absolute bottom-0 left-0 h-1 rounded-full"
                style={{
                  width: `${trainingProgress}%`,
                  background: 'linear-gradient(90deg, rgba(249,115,22,0.6), rgba(245,158,11,0.8))',
                  boxShadow: '0 0 8px rgba(249,115,22,0.4)',
                  transition: 'width 0.5s ease-out',
                }}
              />
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Train Personality
              {conversationCount > 0 && (
                <span className="text-[10px] text-orange-400/60">({conversationCount} conversations)</span>
              )}
            </>
          )}
        </motion.button>
        {conversationCount === 0 && !training && (
          <p className="text-[10px] text-white/25 text-center mt-1.5">Import conversations first to train your personality</p>
        )}
      </motion.div>

      {/* Conversation Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <motion.button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-between p-4"
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white/80">Import Conversations</h3>
              <p className="text-[10px] text-white/35">Paste WhatsApp export text</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationCount > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-semibold">
                {conversationCount} msgs
              </span>
            )}
            {showImport ? (
              <ChevronUp className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/30" />
            )}
          </div>
        </motion.button>

        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div className="gradient-divider" />
                
                {/* Format hint */}
                <div className="glass-card rounded-xl p-3">
                  <p className="text-[9px] text-white/35 uppercase tracking-wider font-semibold mb-1.5">Expected Format</p>
                  <code className="text-[10px] text-cyan-300/60 block leading-relaxed">
                    1/15/24, 10:30 AM - John: Hello<br/>
                    1/15/24, 10:31 AM - You: Hi there!
                  </code>
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your WhatsApp conversation export here..."
                  className="w-full h-32 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/30 transition-colors"
                />

                <motion.button
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(6,182,212,0.12)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    color: '#22d3ee',
                  }}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      Parse & Import
                    </>
                  )}
                </motion.button>

                {/* Import success */}
                <AnimatePresence>
                  {importCount !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/15"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[11px] text-green-300 font-medium">Imported {importCount} messages successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Test Personality Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <motion.button
          onClick={() => setShowTest(!showTest)}
          className="w-full flex items-center justify-between p-4"
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white/80">Test Your AI Twin</h3>
              <p className="text-[10px] text-white/35">Simulate an incoming message</p>
            </div>
          </div>
          {showTest ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </motion.button>

        <AnimatePresence>
          {showTest && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                <div className="gradient-divider" />

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateReply()}
                    placeholder="Simulate an incoming message..."
                    className="flex-1 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-purple-500/30 transition-colors"
                  />
                  <motion.button
                    onClick={handleGenerateReply}
                    disabled={generatingReply || !testMessage.trim() || !profile}
                    whileTap={{ scale: 0.95 }}
                    className="h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1))',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#a78bfa',
                      boxShadow: '0 0 12px rgba(139,92,246,0.15)',
                    }}
                  >
                    {generatingReply ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                </div>

                {/* Side-by-side comparison */}
                {generatedReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {/* Incoming message */}
                      <div className="chat-bubble-received rounded-xl p-3 rounded-tl-sm">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mb-1">Incoming</p>
                        <p className="text-[11px] text-white/70">{testMessage}</p>
                      </div>
                      {/* Your personality reply */}
                      <div className="chat-bubble-sent rounded-xl p-3 rounded-tr-sm">
                        <p className="text-[9px] text-green-400/60 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                          <Bot className="w-2.5 h-2.5" /> Your Twin
                        </p>
                        <p className="text-[11px] text-white/80">{generatedReply}</p>
                      </div>
                    </div>

                    {/* Match score indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <TrendingUp className="w-3 h-3 text-purple-400/60" />
                      <span className="text-[9px] text-purple-300/60 font-medium">Style match based on your trained personality</span>
                      <Star className="w-3 h-3 text-purple-400/40 ml-auto" />
                    </div>
                  </motion.div>
                )}

                {!profile && (
                  <p className="text-[10px] text-white/25 text-center">Train your personality first to test replies</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="glass-card rounded-2xl p-4 text-center stat-card-orange card-hover-lift">
          <MessageSquare className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <p className="text-lg font-extrabold text-white/95">{conversationCount}</p>
          <p className="text-[10px] text-white/40 font-medium">Conversations</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center stat-card-purple card-hover-lift">
          <Brain className="w-5 h-5 text-purple-400 mx-auto mb-2" />
          <p className="text-lg font-extrabold text-white/95">{profile ? '1' : '0'}</p>
          <p className="text-[10px] text-white/40 font-medium">Personality Model</p>
        </div>
      </motion.div>

      {/* Retrain hint */}
      {profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
        >
          <RefreshCw className="w-3 h-3 text-white/20" />
          <p className="text-[10px] text-white/25">
            Retrain after importing new conversations for better accuracy
          </p>
        </motion.div>
      )}
    </div>
  )
}

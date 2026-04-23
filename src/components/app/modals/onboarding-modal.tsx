'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Smartphone, Compass, Rocket, ArrowRight, X } from 'lucide-react'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  glowColor: string
}

const steps: OnboardingStep[] = [
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: 'Welcome to EAJE WhatsBot',
    description: 'Your all-in-one WhatsApp automation platform. Send campaigns, auto-reply, build chatbots, and grow your business effortlessly.',
    gradientFrom: 'from-blue-500/30',
    gradientTo: 'to-cyan-500/20',
    glowColor: '#3b82f6',
  },
  {
    icon: <Smartphone className="w-10 h-10" />,
    title: 'Connect WhatsApp',
    description: 'Link your WhatsApp Business account in seconds. Go to Settings or tap the connection badge to pair your device and start automating.',
    gradientFrom: 'from-green-500/30',
    gradientTo: 'to-emerald-500/20',
    glowColor: '#22c55e',
  },
  {
    icon: <Compass className="w-10 h-10" />,
    title: 'Explore Features',
    description: 'Discover powerful tools — bulk messaging, smart auto-replies, AI chatbots, schedulers, group extractors, and detailed analytics.',
    gradientFrom: 'from-purple-500/30',
    gradientTo: 'to-pink-500/20',
    glowColor: '#8b5cf6',
  },
  {
    icon: <Rocket className="w-10 h-10" />,
    title: 'Ready to Go!',
    description: 'You\'re all set! Start creating campaigns, engaging leads, and automating conversations. Your WhatsApp journey begins now.',
    gradientFrom: 'from-amber-500/30',
    gradientTo: 'to-orange-500/20',
    glowColor: '#f59e0b',
  },
]

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem('onboardingComplete') === 'true'
    if (!completed) {
      // Use a microtask to avoid calling setState synchronously during effect
      queueMicrotask(() => setIsOpen(true))
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    localStorage.setItem('onboardingComplete', 'true')
    window.dispatchEvent(new Event('storage'))
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      close()
    }
  }

  const handleSkip = () => {
    close()
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm rounded-3xl bg-[#0d0d14] border border-white/10 p-8 pb-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>

            {/* Background glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-colors duration-700"
              style={{ backgroundColor: step.glowColor }}
            />

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="text-center space-y-5 relative"
              >
                {/* Illustration area */}
                <div className="flex justify-center">
                  <div
                    className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.gradientFrom} ${step.gradientTo} border border-white/10 flex items-center justify-center mx-auto`}
                    style={{ boxShadow: `0 0 40px ${step.glowColor}30` }}
                  >
                    <div style={{ color: step.glowColor, filter: `drop-shadow(0 0 8px ${step.glowColor}60)` }}>
                      {step.icon}
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h2 className="text-xl font-extrabold text-white/95 tracking-tight">{step.title}</h2>
                  <p className="text-sm text-white/50 mt-2 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-8 mb-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className="transition-all duration-300"
                >
                  <motion.div
                    className="rounded-full"
                    animate={{
                      width: i === currentStep ? 24 : 8,
                      height: 8,
                      backgroundColor: i === currentStep ? step.glowColor : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.2 }}
                    style={i === currentStep ? { boxShadow: `0 0 8px ${step.glowColor}60` } : {}}
                  />
                </button>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white/60 transition-all"
              >
                Skip
              </button>
              <motion.button
                onClick={handleNext}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${step.glowColor}, ${step.glowColor}cc)`,
                  boxShadow: `0 0 20px ${step.glowColor}40`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

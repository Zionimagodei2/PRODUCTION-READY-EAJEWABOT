'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from '@/lib/framer-shim'
import { ArrowLeft, CheckCircle2, Crown } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToastStore } from '@/store/toast-store'

type BillingCycle = 'monthly' | 'annual'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  highlighted?: boolean
}

export function PremiumPlansPage() {
  const { goBack } = useAppStore()
  const { addToast } = useToastStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [currentPlan, setCurrentPlan] = useState<string>('starter')
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, settingsRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/settings'),
        ])
        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans || [])
        }
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          setCurrentPlan((settings.plan || 'starter').toLowerCase())
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => a.monthlyPrice - b.monthlyPrice)
  }, [plans])

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === currentPlan) return
    setUpdatingPlanId(plan.id)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'plan', value: plan.name }),
      })

      if (!res.ok) throw new Error('Failed to update plan')
      setCurrentPlan(plan.id)
      addToast({ type: 'success', title: 'Plan updated', message: `You are now on ${plan.name}` })
    } catch {
      addToast({ type: 'error', title: 'Could not update plan', message: 'Please try again.' })
    } finally {
      setUpdatingPlanId(null)
    }
  }

  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <motion.button
          onClick={goBack}
          whileTap={{ scale: 0.92 }}
          className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div>
          <h2 className="text-lg font-extrabold text-white/95">Premium Plans</h2>
          <p className="text-[11px] text-white/40">Production billing tiers with reduced pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-2 p-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        {(['monthly', 'annual'] as const).map(cycle => (
          <button
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              billingCycle === cycle ? 'bg-white/15 text-white' : 'text-white/50'
            }`}
          >
            {cycle === 'monthly' ? 'Monthly' : 'Annual'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-white/50 py-10">Loading plans...</div>
      ) : (
        sortedPlans.map(plan => {
          const isCurrent = currentPlan === plan.id
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-4 border ${
                plan.highlighted ? 'border-amber-400/60 bg-amber-500/5' : 'border-white/[0.12] bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-400/20 text-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Popular
                  </span>
                )}
              </div>

              <p className="text-4xl font-black text-white">
                ${price.toFixed(2)}
                <span className="text-base text-white/60">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
              </p>

              <ul className="space-y-1.5 mt-3 mb-4">
                {plan.features.map(feature => (
                  <li key={feature} className="text-sm text-white/75 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || updatingPlanId === plan.id}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
                  isCurrent
                    ? 'bg-white/10 text-white/50 cursor-default'
                    : 'bg-gradient-to-r from-amber-300 to-amber-500 text-black'
                }`}
              >
                {isCurrent ? 'Current Plan' : updatingPlanId === plan.id ? 'Updating...' : 'Choose Plan'}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}

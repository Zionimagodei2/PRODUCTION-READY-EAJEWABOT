'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!agree) {
      setError('You must agree to the Terms of Service')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      router.push('/sign-in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-amber-400/30 bg-white/[0.03] p-6">
        <h1 className="text-3xl font-black text-center">
          Create <span className="text-amber-300">Business Account</span>
        </h1>
        <p className="text-center text-white/50 text-sm">Premium messaging & automation for businesses</p>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Business Email"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I agree to the Terms of Service
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold bg-gradient-to-r from-amber-300 to-amber-500 text-black disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-amber-300 font-semibold">Sign in</Link>
        </p>
      </form>
    </div>
  )
}

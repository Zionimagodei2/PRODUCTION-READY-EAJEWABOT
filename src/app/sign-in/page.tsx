'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-amber-400/30 bg-white/[0.03] p-6">
        <h1 className="text-3xl font-black text-center">
          EAJE <span className="text-amber-300">WHATSBOT</span>
        </h1>
        <p className="text-center text-white/50 text-sm">Sign in to your business dashboard</p>

        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 outline-none focus:border-amber-400/70"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 font-bold bg-gradient-to-r from-amber-300 to-amber-500 text-black disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p className="text-center text-white/50 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-amber-300 font-semibold">Create one</Link>
        </p>
      </form>
    </div>
  )
}

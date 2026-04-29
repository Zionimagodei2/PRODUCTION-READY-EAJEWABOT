'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-background text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-red-400/30 bg-white/[0.03] p-6 text-center space-y-3">
          <h2 className="text-2xl font-black">Something went wrong</h2>
          <p className="text-sm text-white/60">
            We hit an unexpected issue. You can retry now, and if the issue persists contact support.
          </p>
          <button
            onClick={reset}
            className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-amber-300 to-amber-500 text-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-amber-400/30 bg-white/[0.03] p-6 text-center space-y-5">
        <h1 className="text-4xl font-black">
          EAJE <span className="text-amber-300">WHATSBOT</span>
        </h1>
        <p className="text-white/70">
          Master your reach with AI-driven automation, premium messaging, and production-grade campaign tooling.
        </p>
        <div className="space-y-2">
          <Link
            href="/sign-up"
            className="block w-full rounded-xl py-3 font-bold bg-gradient-to-r from-amber-300 to-amber-500 text-black"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="block w-full rounded-xl py-3 font-semibold border border-white/20 text-white/80"
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

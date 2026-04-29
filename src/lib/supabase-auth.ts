const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
  }
}

async function supabaseAuthFetch(path: string, init: RequestInit) {
  requireSupabaseConfig()
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY as string,
      ...(init.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.msg === 'string' ? data.msg : (data?.error_description || data?.error || 'Supabase auth error')
    throw new Error(message)
  }
  return data
}

export async function supabaseSignUp(email: string, password: string, metadata?: Record<string, string>) {
  return supabaseAuthFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      data: metadata || {},
    }),
  })
}

export async function supabaseSignIn(email: string, password: string) {
  return supabaseAuthFetch('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }) as Promise<{ access_token?: string; refresh_token?: string; user?: { email?: string } }>
}

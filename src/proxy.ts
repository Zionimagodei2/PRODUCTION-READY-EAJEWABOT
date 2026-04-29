import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

type Bucket = { count: number; expiresAt: number }
const buckets = new Map<string, Bucket>()

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `${ip}:${request.nextUrl.pathname}`
}

export function proxy(request: NextRequest) {
  const key = getClientKey(request)
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now > existing.expiresAt) {
    buckets.set(key, { count: 1, expiresAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  if (existing.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    )
  }

  existing.count += 1
  buckets.set(key, existing)
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*'],
}

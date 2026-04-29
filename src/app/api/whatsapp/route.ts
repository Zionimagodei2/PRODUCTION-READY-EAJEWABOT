import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://127.0.0.1:3003'
const WA_FETCH_TIMEOUT_MS = 5_000 // 5 second timeout

async function resolveWaServiceUrl() {
  const fromDb = await db.setting.findUnique({ where: { key: 'wa_service_url' } })
  return fromDb?.value?.trim() || WA_SERVICE_URL
}

async function waFetch(path: string, options?: RequestInit): Promise<{ success?: boolean; error?: string; [key: string]: unknown }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WA_FETCH_TIMEOUT_MS)

  try {
    const baseUrl = await resolveWaServiceUrl()
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      // Handle different HTTP status codes with specific messages
      switch (res.status) {
        case 401:
          return { success: false, error: 'WhatsApp session not authenticated. Please reconnect.' }
        case 404:
          return { success: false, error: 'WhatsApp service endpoint not found. The service may be outdated.' }
        case 429:
          return { success: false, error: 'Too many requests. Please wait a moment and try again.' }
        case 500:
          return { success: false, error: 'WhatsApp service encountered an internal error.' }
        case 503:
          return { success: false, error: 'WhatsApp service is temporarily unavailable. Please try again later.' }
        default:
          return { success: false, error: `WhatsApp service returned error (HTTP ${res.status}).` }
      }
    }

    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)

    // Provide specific error messages based on the failure type
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out. The WhatsApp service is taking too long to respond.' }
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { success: false, error: 'WhatsApp service is not running. Please start the service on configured WA service URL.' }
    }

    return { success: false, error: 'WhatsApp service is unreachable. Please check that the service is running at WA_SERVICE_URL (default: http://127.0.0.1:3003).' }
  }
}

// GET /api/whatsapp - Get session status or health check
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Health check endpoint
  if (action === 'health') {
    try {
      const result = await waFetch('/session/status')
      if (result.error) {
        return NextResponse.json({
          healthy: false,
          service: 'whatsapp',
          error: result.error
        }, { status: 503 })
      }
      return NextResponse.json({
        healthy: true,
        service: 'whatsapp',
        status: result.status || 'unknown',
        authenticated: result.authenticated || false
      })
    } catch {
      return NextResponse.json({
        healthy: false,
        service: 'whatsapp',
        error: 'WhatsApp service is unreachable'
      }, { status: 503 })
    }
  }

  // Default: Get session status
  try {
    const status = await waFetch('/session/status')
    if (status.error && !status.status) {
      return NextResponse.json({
        status: 'offline',
        authenticated: false,
        connected: false,
        error: status.error
      }, { status: 503 })
    }
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({
      status: 'offline',
      authenticated: false,
      connected: false,
      error: 'WhatsApp service is unreachable. Please check that the service is running at WA_SERVICE_URL (default: http://127.0.0.1:3003).'
    }, { status: 503 })
  }
}

// POST /api/whatsapp - Various WhatsApp operations
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'start': {
        const result = await waFetch('/session/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        if (result.error && !result.status) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 503 })
        }
        return NextResponse.json(result)
      }
      case 'pairing-code': {
        if (!params.phoneNumber) {
          return NextResponse.json({ success: false, error: 'Phone number is required for pairing code.' }, { status: 400 })
        }
        const result = await waFetch('/session/pairing-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: params.phoneNumber })
        })
        if (result.error && !result.success) {
          return NextResponse.json({
            success: false,
            error: result.error
          }, { status: 503 })
        }
        return NextResponse.json(result)
      }
      case 'logout': {
        const result = await waFetch('/session/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        return NextResponse.json(result)
      }
      case 'send-message': {
        if (!params.phone || !params.message) {
          return NextResponse.json({ success: false, error: 'Phone number and message are required.' }, { status: 400 })
        }
        const result = await waFetch('/message/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: params.phone, message: params.message })
        })
        return NextResponse.json(result)
      }
      case 'send-media': {
        if (!params.phone) {
          return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 })
        }
        const result = await waFetch('/message/send-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        })
        return NextResponse.json(result)
      }
      case 'check-number': {
        if (!params.phone) {
          return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 })
        }
        const result = await waFetch('/check/number', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: params.phone })
        })
        return NextResponse.json(result)
      }
      case 'get-groups': {
        const result = await waFetch('/groups')
        return NextResponse.json(result)
      }
      case 'get-group-participants': {
        if (!params.groupId) {
          return NextResponse.json({ success: false, error: 'Group ID is required.' }, { status: 400 })
        }
        const result = await waFetch(`/groups/${params.groupId}/participants`)
        return NextResponse.json(result)
      }
      default:
        return NextResponse.json({ error: `Invalid action: "${action}". Valid actions are: start, pairing-code, logout, send-message, send-media, check-number, get-groups, get-group-participants.` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'WhatsApp service error',
      details: message
    }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

const WA_SERVICE_PORT = 3003

async function waFetch(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`http://localhost:${WA_SERVICE_PORT}${path}`, options)
    return await res.json()
  } catch {
    return { success: false, error: 'WhatsApp service unavailable' }
  }
}

// GET /api/whatsapp - Get session status
export async function GET() {
  try {
    const status = await waFetch('/session/status')
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ status: 'offline', authenticated: false, connected: false }, { status: 503 })
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
        return NextResponse.json(result)
      }
      case 'pairing-code': {
        const result = await waFetch('/session/pairing-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: params.phoneNumber })
        })
        return NextResponse.json(result)
      }
      case 'logout': {
        const result = await waFetch('/session/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        return NextResponse.json(result)
      }
      case 'send-message': {
        const result = await waFetch('/message/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: params.phone, message: params.message })
        })
        return NextResponse.json(result)
      }
      case 'send-media': {
        const result = await waFetch('/message/send-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        })
        return NextResponse.json(result)
      }
      case 'check-number': {
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
        const result = await waFetch(`/groups/${params.groupId}/participants`)
        return NextResponse.json(result)
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'WhatsApp service error' }, { status: 500 })
  }
}

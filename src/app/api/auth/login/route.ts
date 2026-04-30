import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { supabaseSignIn } from '@/lib/supabase-auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400)
    }

    const session = await supabaseSignIn(email, password)
    if (!session.access_token) {
      throw new ApiError('Login failed. No access token returned by Supabase.', 401)
    }

    const response = ok({
      success: true,
      user: {
        email: session.user?.email || email,
        role: 'owner',
      },
    }, 200, requestId)
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    return response
  } catch (error: unknown) {
    return handleApiError(error, 'Login failed', requestId)
  }
}

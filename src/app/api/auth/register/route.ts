import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getRequestId } from '@/lib/request-id'
import { supabaseSignUp } from '@/lib/supabase-auth'

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const fullName = String(body?.fullName || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const phone = String(body?.phone || '').trim()
    const password = String(body?.password || '')

    if (!fullName || !email || !phone || !password) {
      throw new ApiError('Full name, email, phone, and password are required', 400)
    }

    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400)
    }

    const existingOwnerEmail = await db.setting.findUnique({ where: { key: 'owner_email' } })
    if (existingOwnerEmail?.value && existingOwnerEmail.value === email) {
      throw new ApiError('Account already exists for this email', 409)
    }

    await supabaseSignUp(email, password, { full_name: fullName, phone })

    const settingsToPersist = [
      { key: 'owner_name', value: fullName },
      { key: 'owner_email', value: email },
      { key: 'owner_phone', value: phone },
      { key: 'profile_name', value: fullName },
      { key: 'profile_email', value: email },
      { key: 'business_phone', value: phone },
      { key: 'plan', value: 'Starter' },
      { key: 'owner_api_token', value: randomBytes(24).toString('hex') },
    ]

    await Promise.all(
      settingsToPersist.map(({ key, value }) =>
        db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return ok({ success: true, message: 'Account created successfully' }, 201, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create account', requestId)
  }
}

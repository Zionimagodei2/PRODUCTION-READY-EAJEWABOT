import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { getRequestId } from '@/lib/request-id'

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (!email || !password) {
      throw new ApiError('Email and password are required', 400)
    }

    const [ownerEmail, ownerPasswordHash, ownerName] = await Promise.all([
      db.setting.findUnique({ where: { key: 'owner_email' } }),
      db.setting.findUnique({ where: { key: 'owner_password_hash' } }),
      db.setting.findUnique({ where: { key: 'owner_name' } }),
    ])

    if (!ownerEmail?.value || !ownerPasswordHash?.value) {
      throw new ApiError('No account found. Please create an account first.', 404)
    }

    if (ownerEmail.value !== email || !verifyPassword(password, ownerPasswordHash.value)) {
      throw new ApiError('Invalid email or password', 401)
    }

    return ok({
      success: true,
      user: {
        name: ownerName?.value || 'Business Owner',
        email: ownerEmail.value,
        role: 'owner',
      },
    }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Login failed', requestId)
  }
}

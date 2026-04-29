import { ApiError } from '@/lib/api-response'
import { db } from '@/lib/db'
import { timingSafeTokenEqual } from '@/lib/token-utils'

const TOKEN_KEY = 'owner_api_token'
const AUTH_HEADER = 'x-owner-token'

export async function requireOwnerToken(request: Request) {
  const token = request.headers.get(AUTH_HEADER)?.trim()
  if (!token) {
    throw new ApiError('Missing owner token', 401)
  }

  const stored = await db.setting.findUnique({ where: { key: TOKEN_KEY } })
  if (!stored?.value) {
    throw new ApiError('Owner token is not configured', 503)
  }

  if (!timingSafeTokenEqual(token, stored.value)) {
    throw new ApiError('Invalid owner token', 403)
  }
}

export function ownerTokenHeaderName() {
  return AUTH_HEADER
}

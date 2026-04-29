import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { db } from '@/lib/db'
import { defaultFeatureFlags, parseFeatureFlags } from '@/lib/feature-flags'
import { getRequestId } from '@/lib/request-id'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const row = await db.setting.findUnique({ where: { key: 'feature_flags' } })
    const flags = parseFeatureFlags(row?.value)
    return ok({ flags }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch feature flags', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const flags = body?.flags
    if (!flags || typeof flags !== 'object') {
      throw new ApiError('flags object is required', 400)
    }

    const merged = {
      ...defaultFeatureFlags,
      ...flags,
    }

    await db.setting.upsert({
      where: { key: 'feature_flags' },
      update: { value: JSON.stringify(merged) },
      create: { key: 'feature_flags', value: JSON.stringify(merged) },
    })

    return ok({ flags: merged }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update feature flags', requestId)
  }
}

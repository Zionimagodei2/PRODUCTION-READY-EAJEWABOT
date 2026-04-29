import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { listAuditLogs } from '@/lib/audit-log'
import { getRequestId } from '@/lib/request-id'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100

    if (Number.isNaN(limit) || limit < 1 || limit > 500) {
      throw new ApiError('limit must be between 1 and 500', 400)
    }

    const logs = await listAuditLogs(limit)
    return ok({ logs, count: logs.length }, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch audit logs', requestId)
  }
}

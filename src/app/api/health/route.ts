import { db } from '@/lib/db'
import { ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { queueStats } from '@/lib/job-queue'

const startTime = Date.now()

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  // Check database connectivity
  let dbStatus = 'ok'
  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    dbStatus = 'error'
  }

  // Check WhatsApp service port reachability
  let waServiceStatus = 'unknown'
  try {
    const waRes = await fetch('http://localhost:3003/health', {
      signal: AbortSignal.timeout(3000),
    })
    if (waRes.ok) {
      waServiceStatus = 'ok'
    } else {
      waServiceStatus = 'error'
    }
  } catch {
    waServiceStatus = 'offline'
  }

  const overallStatus = dbStatus === 'ok' && waServiceStatus !== 'error' ? 'ok' : 'degraded'
  const queue = await queueStats()

  return ok({
    status: overallStatus,
    uptime,
    timestamp,
    services: {
      database: dbStatus,
      whatsapp: waServiceStatus,
      api: 'ok',
    },
    queue,
  }, 200, requestId)
}

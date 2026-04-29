import { db } from '@/lib/db'
import { ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { queueStats } from '@/lib/job-queue'

const startTime = Date.now()
const WA_SERVICE_URL = process.env.WA_SERVICE_URL || 'http://127.0.0.1:3003'

async function resolveWaServiceUrl() {
  const fromDb = await db.setting.findUnique({ where: { key: 'wa_service_url' } })
  return fromDb?.value?.trim() || WA_SERVICE_URL
}

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
    const baseUrl = await resolveWaServiceUrl()
    const waRes = await fetch(`${baseUrl}/health`, {
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

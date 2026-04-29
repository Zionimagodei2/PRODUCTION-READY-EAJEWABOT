import { db } from '@/lib/db'
import { actorFromRequest, parseAuditLogValue } from '@/lib/audit-log-utils'

export type AuditEntity = 'contact' | 'campaign' | 'setting' | 'export' | 'system'

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  entity: AuditEntity
  entityId?: string
  metadata?: Record<string, unknown>
  requestId?: string
  createdAt: string
}

const AUDIT_SETTINGS_KEY = 'audit_trail'
const MAX_AUDIT_LOGS = 500

export { actorFromRequest, parseAuditLogValue }

export async function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
  const setting = await db.setting.findUnique({ where: { key: AUDIT_SETTINGS_KEY } })
  const currentLogs = parseAuditLogValue(setting?.value) as AuditLogEntry[]

  const newEntry: AuditLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  const nextLogs = [newEntry, ...currentLogs].slice(0, MAX_AUDIT_LOGS)

  await db.setting.upsert({
    where: { key: AUDIT_SETTINGS_KEY },
    create: { key: AUDIT_SETTINGS_KEY, value: JSON.stringify(nextLogs) },
    update: { value: JSON.stringify(nextLogs) },
  })
}

export async function listAuditLogs(limit = 100) {
  const setting = await db.setting.findUnique({ where: { key: AUDIT_SETTINGS_KEY } })
  const logs = parseAuditLogValue(setting?.value) as AuditLogEntry[]
  return logs.slice(0, Math.max(1, Math.min(limit, MAX_AUDIT_LOGS)))
}

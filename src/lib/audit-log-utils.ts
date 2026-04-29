export interface ParsedAuditLogEntry {
  id: string
  actor: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
  requestId?: string
  createdAt: string
}

export function parseAuditLogValue(value: string | undefined): ParsedAuditLogEntry[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as ParsedAuditLogEntry[] : []
  } catch {
    return []
  }
}

export function actorFromRequest(request: Request) {
  return request.headers.get('x-owner-email')
    || request.headers.get('x-actor-email')
    || 'system'
}

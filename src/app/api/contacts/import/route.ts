import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'
import { db } from '@/lib/db'
import { getRequestId } from '@/lib/request-id'

type ImportContactInput = {
  name?: string
  phone?: string
  email?: string
  company?: string
  tags?: string
  location?: string
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, '')
}

function normalizeEntry(entry: ImportContactInput) {
  return {
    name: (entry.name || '').trim(),
    phone: (entry.phone || '').trim(),
    email: (entry.email || '').trim(),
    company: (entry.company || '').trim(),
    tags: (entry.tags || '').trim(),
    location: (entry.location || '').trim(),
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const entries: ImportContactInput[] = Array.isArray(body?.contacts) ? body.contacts : []

    if (entries.length === 0) {
      throw new ApiError('contacts must be a non-empty array', 400)
    }
    if (entries.length > 2000) {
      throw new ApiError('A maximum of 2000 contacts can be imported per request', 400)
    }

    const existingContacts = await db.contact.findMany({ select: { phone: true } })
    const existingPhones = new Set(existingContacts.map((contact) => normalizePhone(contact.phone)))
    const seenInPayload = new Set<string>()

    const createPayload: Array<{
      name: string
      phone: string
      email: string
      company: string
      location: string
      tags: string
      status: string
      score: number
      segments: string
      lastMessage: string
    }> = []

    let duplicates = 0
    let skipped = 0

    for (const raw of entries) {
      const entry = normalizeEntry(raw)
      const normalizedPhone = normalizePhone(entry.phone)

      if (!entry.phone || normalizedPhone.length < 7) {
        skipped++
        continue
      }

      if (existingPhones.has(normalizedPhone) || seenInPayload.has(normalizedPhone)) {
        duplicates++
        continue
      }

      seenInPayload.add(normalizedPhone)
      createPayload.push({
        name: entry.name || 'Unknown',
        phone: entry.phone,
        email: entry.email,
        company: entry.company,
        location: entry.location,
        tags: entry.tags,
        status: 'active',
        score: 50,
        segments: '',
        lastMessage: '',
      })
    }

    if (createPayload.length > 0) {
      await db.contact.createMany({ data: createPayload })
    }

    const result = {
      success: createPayload.length,
      duplicates,
      skipped,
      errors: 0,
      total: entries.length,
    }

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'import',
      entity: 'contact',
      requestId,
      metadata: result,
    })

    return ok(result, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to import contacts', requestId)
  }
}

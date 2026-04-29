import { db } from '@/lib/db'
import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } })
    return ok(contacts, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch contacts', requestId)
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    if (!body?.name || !body?.phone) {
      throw new ApiError('Name and phone are required', 400)
    }

    const contact = await db.contact.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || '',
        company: body.company || '',
        location: body.location || '',
        tags: body.tags || '',
        lastMessage: body.lastMessage || '',
        status: body.status || 'active',
        score: body.score || 50,
        segments: body.segments || '',
      }
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'create',
      entity: 'contact',
      entityId: contact.id,
      requestId,
      metadata: { name: contact.name, phone: contact.phone },
    })

    return ok(contact, 201, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to create contact', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      throw new ApiError('Contact ID is required', 400)
    }
    const contact = await db.contact.update({
      where: { id },
      data,
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'update',
      entity: 'contact',
      entityId: contact.id,
      requestId,
      metadata: { fields: Object.keys(data) },
    })

    return ok(contact, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update contact', requestId)
  }
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new ApiError('Contact ID is required', 400)
    }
    await db.contact.delete({ where: { id } })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'delete',
      entity: 'contact',
      entityId: id,
      requestId,
    })

    return ok({ success: true }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to delete contact', requestId)
  }
}

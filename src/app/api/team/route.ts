import { db } from '@/lib/db'
import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { requireOwnerToken } from '@/lib/api-auth'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'

function parsePermissions(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// GET - Fetch all team members
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    await requireOwnerToken(request)
    const members = await db.teamMember.findMany({ orderBy: { createdAt: 'desc' } })
    return ok({ members: members.map((m) => ({ ...m, permissions: parsePermissions(m.permissions) })) }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch team members', requestId)
  }
}

// POST - Add a new team member
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    await requireOwnerToken(request)
    const { name, email, role, permissions, avatarColor } = await request.json()
    if (!name || !email) throw new ApiError('Name and email required', 400)

    const existing = await db.teamMember.findFirst({ where: { email } })
    if (existing) throw new ApiError('Member with this email already exists', 409)

    const member = await db.teamMember.create({
      data: {
        name,
        email,
        role: role || 'agent',
        permissions: JSON.stringify(Array.isArray(permissions) ? permissions : []),
        avatarColor: avatarColor || '#8b5cf6',
        isOnline: true,
        lastActive: 'Now',
      },
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'create',
      entity: 'setting',
      entityId: member.id,
      requestId,
      metadata: { resource: 'team-member', email: member.email },
    })

    return ok({ member: { ...member, permissions: parsePermissions(member.permissions) } }, 201, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to add team member', requestId)
  }
}

// PUT - Update a team member
export async function PUT(request: Request) {
  const requestId = getRequestId(request)
  try {
    await requireOwnerToken(request)
    const { id, name, email, role, permissions, avatarColor, isOnline, lastActive } = await request.json()
    if (!id) throw new ApiError('ID is required', 400)

    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(permissions !== undefined && { permissions: JSON.stringify(permissions) }),
        ...(avatarColor !== undefined && { avatarColor }),
        ...(isOnline !== undefined && { isOnline }),
        ...(lastActive !== undefined && { lastActive }),
      },
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'update',
      entity: 'setting',
      entityId: member.id,
      requestId,
      metadata: { resource: 'team-member' },
    })

    return ok({ member: { ...member, permissions: parsePermissions(member.permissions) } }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update team member', requestId)
  }
}

// DELETE - Remove a team member
export async function DELETE(request: Request) {
  const requestId = getRequestId(request)
  try {
    await requireOwnerToken(request)
    const { id } = await request.json()
    if (!id) throw new ApiError('ID is required', 400)

    await db.teamMember.delete({ where: { id } })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'delete',
      entity: 'setting',
      entityId: id,
      requestId,
      metadata: { resource: 'team-member' },
    })

    return ok({ success: true }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to remove team member', requestId)
  }
}

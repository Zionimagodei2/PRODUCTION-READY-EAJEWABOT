import { db } from '@/lib/db'
import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'
import { enqueueJob } from '@/lib/job-queue'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const campaigns = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
    return ok(campaigns, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch campaigns', requestId)
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    if (!body?.name) {
      throw new ApiError('Campaign name is required', 400)
    }

    const campaign = await db.campaign.create({
      data: {
        name: body.name,
        status: body.status || 'scheduled',
        total: body.total || 0,
        sent: body.sent || 0,
        delivered: body.delivered || 0,
        replies: body.replies || 0,
        message: body.message || '',
      },
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'create',
      entity: 'campaign',
      entityId: campaign.id,
      requestId,
      metadata: { name: campaign.name, status: campaign.status },
    })

    const queueResult = await enqueueJob({
      type: 'campaign_dispatch',
      payload: { campaignId: campaign.id },
      dedupeKey: `campaign-dispatch:${campaign.id}`,
      maxRetries: 5,
    })

    return ok({ ...campaign, dispatchQueued: queueResult.enqueued, dispatchDeduped: queueResult.deduped }, 201, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to create campaign', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      throw new ApiError('Campaign ID is required', 400)
    }

    const campaign = await db.campaign.update({
      where: { id },
      data,
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'update',
      entity: 'campaign',
      entityId: campaign.id,
      requestId,
      metadata: { fields: Object.keys(data) },
    })

    return ok(campaign, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to update campaign', requestId)
  }
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new ApiError('Campaign ID is required', 400)
    }

    await db.campaign.delete({ where: { id } })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'delete',
      entity: 'campaign',
      entityId: id,
      requestId,
    })

    return ok({ success: true }, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to delete campaign', requestId)
  }
}

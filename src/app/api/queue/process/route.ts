import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { db } from '@/lib/db'
import { claimDueJobs, completeJob, failJob, queueStats, QueueJob } from '@/lib/job-queue'
import { getRequestId } from '@/lib/request-id'

type CampaignDispatchPayload = {
  campaignId: string
}

async function processCampaignDispatch(job: QueueJob<CampaignDispatchPayload>) {
  const campaignId = job.payload?.campaignId
  if (!campaignId) {
    throw new ApiError('campaignId is required for campaign dispatch job', 400)
  }

  const campaign = await db.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign) {
    throw new ApiError(`Campaign not found: ${campaignId}`, 404)
  }

  const sent = Math.min(campaign.total, Math.max(campaign.sent, Math.ceil(campaign.total * 0.9)))
  const delivered = Math.min(sent, Math.max(campaign.delivered, Math.floor(sent * 0.95)))
  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      status: sent >= campaign.total ? 'completed' : 'active',
      sent,
      delivered,
    },
  })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.max(1, Math.min(Number(body?.limit) || 10, 50))
    const claimedJobs = await claimDueJobs(limit)

    for (const job of claimedJobs) {
      try {
        if (job.type === 'campaign_dispatch') {
          await processCampaignDispatch(job as QueueJob<CampaignDispatchPayload>)
        } else {
          throw new ApiError(`Unsupported job type: ${job.type}`, 400)
        }
        await completeJob(job.id)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown job processing error'
        await failJob(job.id, message)
      }
    }

    const stats = await queueStats()
    return ok({ processed: claimedJobs.length, stats }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to process queue jobs', requestId)
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const stats = await queueStats()
    return ok(stats, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to get queue stats', requestId)
  }
}

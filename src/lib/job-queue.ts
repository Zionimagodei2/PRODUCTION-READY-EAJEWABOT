import { db } from '@/lib/db'

const QUEUE_KEY = 'job_queue_v1'
const DEAD_LETTER_KEY = 'job_dead_letter_v1'

export type QueueJobType = 'campaign_dispatch'
type QueueJobStatus = 'pending' | 'processing'

export type QueueJob<T = Record<string, unknown>> = {
  id: string
  type: QueueJobType
  payload: T
  dedupeKey?: string
  attempts: number
  maxRetries: number
  status: QueueJobStatus
  nextRunAt: number
  createdAt: number
  updatedAt: number
}

type DeadLetterJob = QueueJob & { failedAt: number; error: string }

function now() {
  return Date.now()
}

function safeParseQueue(value: string | undefined): QueueJob[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((job) => job && typeof job.id === 'string')
  } catch {
    return []
  }
}

function safeParseDeadLetter(value: string | undefined): DeadLetterJob[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function readSetting(key: string) {
  return db.setting.findUnique({ where: { key } })
}

async function writeSetting(key: string, value: string) {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function enqueueJob<T = Record<string, unknown>>(input: {
  type: QueueJobType
  payload: T
  dedupeKey?: string
  maxRetries?: number
}) {
  const queue = safeParseQueue((await readSetting(QUEUE_KEY))?.value)
  if (input.dedupeKey && queue.some((job) => job.dedupeKey === input.dedupeKey)) {
    return { enqueued: false, deduped: true, job: null as QueueJob<T> | null }
  }

  const queued: QueueJob<T> = {
    id: `job-${input.type}-${now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    payload: input.payload,
    dedupeKey: input.dedupeKey,
    attempts: 0,
    maxRetries: input.maxRetries ?? 3,
    status: 'pending',
    nextRunAt: now(),
    createdAt: now(),
    updatedAt: now(),
  }
  queue.push(queued as QueueJob)
  await writeSetting(QUEUE_KEY, JSON.stringify(queue))
  return { enqueued: true, deduped: false, job: queued }
}

export async function claimDueJobs(limit = 10) {
  const queue = safeParseQueue((await readSetting(QUEUE_KEY))?.value)
  const dueJobs = queue.filter((job) => job.status === 'pending' && job.nextRunAt <= now()).slice(0, limit)

  dueJobs.forEach((job) => {
    const target = queue.find((queued) => queued.id === job.id)
    if (target) {
      target.status = 'processing'
      target.attempts += 1
      target.updatedAt = now()
    }
  })

  await writeSetting(QUEUE_KEY, JSON.stringify(queue))
  return dueJobs
}

export async function completeJob(jobId: string) {
  const queue = safeParseQueue((await readSetting(QUEUE_KEY))?.value)
  const nextQueue = queue.filter((job) => job.id !== jobId)
  await writeSetting(QUEUE_KEY, JSON.stringify(nextQueue))
}

export async function failJob(jobId: string, errorMessage: string) {
  const queue = safeParseQueue((await readSetting(QUEUE_KEY))?.value)
  const deadLetter = safeParseDeadLetter((await readSetting(DEAD_LETTER_KEY))?.value)
  const target = queue.find((job) => job.id === jobId)
  if (!target) return

  if (target.attempts >= target.maxRetries) {
    const failed: DeadLetterJob = {
      ...target,
      failedAt: now(),
      error: errorMessage,
    }
    deadLetter.push(failed)
    await writeSetting(DEAD_LETTER_KEY, JSON.stringify(deadLetter.slice(-1000)))
    await completeJob(jobId)
    return
  }

  target.status = 'pending'
  target.nextRunAt = now() + Math.min(60_000, 2 ** target.attempts * 1000)
  target.updatedAt = now()
  await writeSetting(QUEUE_KEY, JSON.stringify(queue))
}

export async function queueStats() {
  const queue = safeParseQueue((await readSetting(QUEUE_KEY))?.value)
  const deadLetter = safeParseDeadLetter((await readSetting(DEAD_LETTER_KEY))?.value)
  return {
    pending: queue.filter((job) => job.status === 'pending').length,
    processing: queue.filter((job) => job.status === 'processing').length,
    deadLetter: deadLetter.length,
  }
}

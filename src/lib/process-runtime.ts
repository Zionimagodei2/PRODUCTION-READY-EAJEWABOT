export type ProcessType = 'send' | 'extract' | 'lead-gen' | 'import' | 'other'

type ActiveProcess = {
  id: string
  type: ProcessType
  startedAt: number
}

const STORAGE_KEY = 'eaje_active_processes'
const MAX_ACTIVE_PROCESSES = 6
const PROCESS_TTL_MS = 30 * 60 * 1000

function now() {
  return Date.now()
}

function readProcesses(): ActiveProcess[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item: ActiveProcess) => now() - item.startedAt < PROCESS_TTL_MS)
  } catch {
    return []
  }
}

function writeProcesses(processes: ActiveProcess[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processes))
}

export function getActiveProcesses() {
  const processes = readProcesses()
  writeProcesses(processes)
  return processes
}

export function startProcess(type: ProcessType) {
  const active = readProcesses()
  if (active.length >= MAX_ACTIVE_PROCESSES) {
    return { ok: false as const, activeCount: active.length, limit: MAX_ACTIVE_PROCESSES }
  }

  const process: ActiveProcess = {
    id: `${type}-${now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    startedAt: now(),
  }
  const next = [...active, process]
  writeProcesses(next)
  return { ok: true as const, process, activeCount: next.length, limit: MAX_ACTIVE_PROCESSES }
}

export function finishProcess(processId: string) {
  const active = readProcesses()
  const next = active.filter((process) => process.id !== processId)
  writeProcesses(next)
  return next.length
}

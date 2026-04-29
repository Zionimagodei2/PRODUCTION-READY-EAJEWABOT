import { NextResponse } from 'next/server'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function headersWithRequestId(requestId?: string) {
  if (!requestId) return undefined
  return { 'x-request-id': requestId }
}

export function ok<T>(data: T, status = 200, requestId?: string) {
  return NextResponse.json(data, { status, headers: headersWithRequestId(requestId) })
}

export function fail(message: string, status = 500, details?: unknown, requestId?: string) {
  return NextResponse.json(
    {
      error: message,
      ...(requestId ? { requestId } : {}),
      ...(details ? { details } : {}),
    },
    { status, headers: headersWithRequestId(requestId) }
  )
}

export function handleApiError(error: unknown, fallbackMessage: string, requestId?: string) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status, error.details, requestId)
  }

  console.error(`[${requestId || 'no-request-id'}] ${fallbackMessage}`, error)
  return fail(fallbackMessage, 500, undefined, requestId)
}

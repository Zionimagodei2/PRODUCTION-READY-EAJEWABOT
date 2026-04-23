import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const messages = await db.scheduledMessage.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scheduled messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = await db.scheduledMessage.create({
      data: {
        message: body.message,
        recipients: body.recipients || '',
        date: body.date,
        time: body.time,
        recurring: body.recurring || 'none',
        status: body.status || 'pending',
      }
    })
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to schedule message' }, { status: 500 })
  }
}

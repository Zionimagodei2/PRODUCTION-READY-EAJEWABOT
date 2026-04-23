import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const flows = await db.chatbotFlow.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(flows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chatbot flows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const flow = await db.chatbotFlow.create({
      data: {
        name: body.name,
        description: body.description || '',
        nodes: body.nodes || '[]',
        active: body.active || false,
      }
    })
    return NextResponse.json(flow, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 })
  }
}

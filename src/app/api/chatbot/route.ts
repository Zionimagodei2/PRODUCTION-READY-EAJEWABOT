import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const flows = await db.chatbotFlow.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(flows.map(f => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Chatbot GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbot flows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Flow name is required' }, { status: 400 })
    }

    const flow = await db.chatbotFlow.create({
      data: {
        name: body.name,
        description: body.description || '',
        nodes: typeof body.nodes === 'object' ? JSON.stringify(body.nodes) : (body.nodes || '[]'),
        active: body.active ?? false,
        triggers: body.triggers ?? 0,
      },
    })

    return NextResponse.json({
      ...flow,
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Chatbot POST error:', error)
    return NextResponse.json({ error: 'Failed to create chatbot flow' }, { status: 500 })
  }
}

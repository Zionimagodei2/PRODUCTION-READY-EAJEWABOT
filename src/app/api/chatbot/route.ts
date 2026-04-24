import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const flows = await db.chatbotFlow.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(flows.map(f => ({
      ...f,
      nodes: typeof f.nodes === 'string' ? JSON.parse(f.nodes) : f.nodes,
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
      nodes: typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes,
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Chatbot POST error:', error)
    return NextResponse.json({ error: 'Failed to create chatbot flow' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 })
    }

    // Serialize nodes if it's an object
    if (data.nodes && typeof data.nodes === 'object') {
      data.nodes = JSON.stringify(data.nodes)
    }

    const flow = await db.chatbotFlow.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ...flow,
      nodes: typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes,
      createdAt: flow.createdAt.toISOString(),
      updatedAt: flow.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Chatbot PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update chatbot flow' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 })
    }
    await db.chatbotFlow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Chatbot DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete chatbot flow' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const defaultTemplateSeed = [
  { name: 'Welcome Message', category: 'greeting', content: 'Hi {name}, welcome to our WhatsApp support. How can we help you today?', starred: true, variables: 'name' },
  { name: 'Order Update', category: 'transaction', content: 'Hi {name}, your order {order_id} is now {status}.', starred: true, variables: 'name,order_id,status' },
  { name: 'Promo Offer', category: 'marketing', content: 'Hello {name}! Use code {code} to get {discount}% off today.', starred: false, variables: 'name,code,discount' },
  { name: 'Follow-up Check', category: 'follow-up', content: 'Hi {name}, just checking in if you still need help with {topic}.', starred: false, variables: 'name,topic' },
]

export async function GET() {
  try {
    let templates = await db.messageTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    if (templates.length === 0) {
      await db.messageTemplate.createMany({ data: defaultTemplateSeed })
      templates = await db.messageTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    }
    return NextResponse.json(templates.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })))
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const template = await db.messageTemplate.create({
      data: {
        name: body.name,
        content: body.content,
        category: body.category || 'general',
        starred: body.starred ?? false,
        variables: Array.isArray(body.variables) ? body.variables.join(',') : (body.variables || ''),
      },
    })

    return NextResponse.json({
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Templates POST error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const existing = await db.messageTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Determine update data based on what's provided
    const data: { starred?: boolean; name?: string; content?: string; category?: string } = {}

    if (body.starred !== undefined) {
      data.starred = body.starred
    }
    if (body.name !== undefined) {
      data.name = body.name
    }
    if (body.content !== undefined) {
      data.content = body.content
    }
    if (body.category !== undefined) {
      data.category = body.category
    }

    const template = await db.messageTemplate.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Templates PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Support both query param (?id=xxx) and JSON body ({ id: xxx })
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {
        // No JSON body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const existing = await db.messageTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db.messageTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    console.error('Templates DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}

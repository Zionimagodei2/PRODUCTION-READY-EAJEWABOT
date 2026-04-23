import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rules = await db.autoReplyRule.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(rules)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch auto-reply rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rule = await db.autoReplyRule.create({
      data: {
        trigger: body.trigger,
        response: body.response,
        matchType: body.matchType || 'contains',
        active: body.active !== undefined ? body.active : true,
      }
    })
    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }
    const rule = await db.autoReplyRule.update({
      where: { id },
      data,
    })
    return NextResponse.json(rule)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }
    await db.autoReplyRule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(campaigns)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const campaign = await db.campaign.create({
      data: {
        name: body.name,
        status: body.status || 'scheduled',
        total: body.total || 0,
        sent: body.sent || 0,
        delivered: body.delivered || 0,
        replies: body.replies || 0,
        message: body.message || '',
      }
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }
    const campaign = await db.campaign.update({
      where: { id },
      data,
    })
    return NextResponse.json(campaign)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }
    await db.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}

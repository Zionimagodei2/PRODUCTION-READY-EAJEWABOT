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
        message: body.message || '',
      }
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

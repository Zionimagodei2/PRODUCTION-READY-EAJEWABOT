import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const contacts = await db.contact.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const contact = await db.contact.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || '',
        company: body.company || '',
        location: body.location || '',
        tags: body.tags || '',
        lastMessage: body.lastMessage || '',
        status: body.status || 'active',
        score: body.score || 50,
        segments: body.segments || '',
      }
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }
    const contact = await db.contact.update({
      where: { id },
      data,
    })
    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }
    await db.contact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}

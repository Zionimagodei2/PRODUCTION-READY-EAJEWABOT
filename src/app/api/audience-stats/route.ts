import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allContacts = await db.contact.count()
    const vipContacts = await db.contact.count({ where: { tags: { contains: 'vip' } } })
    const customerContacts = await db.contact.count({ where: { tags: { contains: 'customer' } } })
    const leadContacts = await db.contact.count({ where: { tags: { contains: 'lead' } } })

    return NextResponse.json({
      all: allContacts,
      vip: vipContacts,
      customers: customerContacts,
      leads: leadContacts,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audience stats' }, { status: 500 })
  }
}

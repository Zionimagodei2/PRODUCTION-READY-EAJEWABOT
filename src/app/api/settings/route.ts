import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })
    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }

    if (value === undefined) {
      return NextResponse.json({ error: 'Setting value is required' }, { status: 400 })
    }

    const setting = await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({ key: setting.key, value: setting.value })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

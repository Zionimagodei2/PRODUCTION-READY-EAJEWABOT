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

// Test API connection
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, key } = body

    if (!type || !key) {
      return NextResponse.json({ error: 'Type and key are required' }, { status: 400 })
    }

    // In demo mode, simulate connection test
    if (type === 'gemini') {
      // Simulate a Gemini API connection test
      if (key.length < 10) {
        return NextResponse.json({ success: false, error: 'Invalid API key format' })
      }
      // In a real app, we'd call the Gemini API to verify
      return NextResponse.json({ success: true, message: 'Gemini API connection verified' })
    }

    if (type === 'whatsapp') {
      // Simulate a WhatsApp Business API connection test
      if (key.length < 10) {
        return NextResponse.json({ success: false, error: 'Invalid API key format' })
      }
      return NextResponse.json({ success: true, message: 'WhatsApp API connection verified' })
    }

    return NextResponse.json({ error: 'Unknown API type' }, { status: 400 })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 })
  }
}

// Clear all data
export async function DELETE() {
  try {
    // Delete all data from all tables except settings
    await db.conversation.deleteMany()
    await db.scheduledMessage.deleteMany()
    await db.campaign.deleteMany()
    await db.contact.deleteMany()
    await db.autoReplyRule.deleteMany()
    await db.chatbotFlow.deleteMany()
    await db.messageTemplate.deleteMany()
    await db.leadSearch.deleteMany()
    await db.whatsAppGroup.deleteMany()
    await db.flow.deleteMany()
    await db.teamMember.deleteMany()
    await db.personalityProfile.deleteMany()

    return NextResponse.json({ success: true, message: 'All data cleared' })
  } catch (error) {
    console.error('Settings DELETE error:', error)
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 })
  }
}

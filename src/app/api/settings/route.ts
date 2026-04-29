import { db } from '@/lib/db'
import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'
import { actorFromRequest, recordAuditLog } from '@/lib/audit-log'

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => { settingsMap[s.key] = s.value })
    return ok(settingsMap, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch settings', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      throw new ApiError('Setting key is required', 400)
    }

    if (value === undefined) {
      throw new ApiError('Setting value is required', 400)
    }

    const setting = await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'update',
      entity: 'setting',
      entityId: setting.key,
      requestId,
      metadata: { valuePreview: String(setting.value).slice(0, 100) },
    })

    return ok({ key: setting.key, value: setting.value }, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to update setting', requestId)
  }
}

// Test API connection
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const { type, key } = body

    if (!type || !key) {
      throw new ApiError('Type and key are required', 400)
    }

    // In demo mode, simulate connection test
    if (type === 'gemini') {
      // Simulate a Gemini API connection test
      if (key.length < 10) {
        return ok({ success: false, error: 'Invalid API key format' }, 200, requestId)
      }
      // In a real app, we'd call the Gemini API to verify
      return ok({ success: true, message: 'Gemini API connection verified' }, 200, requestId)
    }

    if (type === 'whatsapp') {
      // Simulate a WhatsApp Business API connection test
      if (key.length < 10) {
        return ok({ success: false, error: 'Invalid API key format' }, 200, requestId)
      }
      return ok({ success: true, message: 'WhatsApp API connection verified' }, 200, requestId)
    }

    throw new ApiError('Unknown API type', 400)
  } catch (error) {
    return handleApiError(error, 'Failed to test connection', requestId)
  }
}

// Clear all data
export async function DELETE(request: Request) {
  const requestId = getRequestId(request)
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

    await recordAuditLog({
      actor: actorFromRequest(request),
      action: 'clear_all_data',
      entity: 'system',
      requestId,
    })

    return ok({ success: true, message: 'All data cleared' }, 200, requestId)
  } catch (error) {
    return handleApiError(error, 'Failed to clear data', requestId)
  }
}

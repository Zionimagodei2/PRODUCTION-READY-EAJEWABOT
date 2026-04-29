import { db } from '@/lib/db'
import { ApiError, handleApiError, ok } from '@/lib/api-response'
import { getRequestId } from '@/lib/request-id'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  highlighted?: boolean
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    features: ['Unlimited WhatsApp Messaging', 'Basic Automation', '500 Contacts'],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 39.99,
    annualPrice: 399.99,
    features: ['Advanced AI Training', 'Lead Scraper', 'Anti-ban Protection', 'Unlimited Contacts'],
    highlighted: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 69.99,
    annualPrice: 699.99,
    features: ['Enterprise API Access', 'Dedicated Account Manager', 'Custom Integrations'],
  },
]

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const plansSetting = await db.setting.findUnique({ where: { key: 'billing_plans' } })
    if (!plansSetting?.value) return ok({ plans: defaultPlans }, 200, requestId)

    const parsed = JSON.parse(plansSetting.value) as Plan[]
    return ok({ plans: parsed }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to fetch plans', requestId)
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const plans = body?.plans as Plan[] | undefined
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      throw new ApiError('A non-empty plans array is required', 400)
    }

    await db.setting.upsert({
      where: { key: 'billing_plans' },
      update: { value: JSON.stringify(plans) },
      create: { key: 'billing_plans', value: JSON.stringify(plans) },
    })

    return ok({ success: true }, 200, requestId)
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to update plans', requestId)
  }
}

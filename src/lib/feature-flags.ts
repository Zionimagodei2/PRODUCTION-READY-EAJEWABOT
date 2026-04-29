export type FeatureFlags = {
  premiumPlans: boolean
  aiSmartReply: boolean
  bulkScheduler: boolean
  campaignAnalytics: boolean
}

export const defaultFeatureFlags: FeatureFlags = {
  premiumPlans: true,
  aiSmartReply: true,
  bulkScheduler: true,
  campaignAnalytics: true,
}

export function parseFeatureFlags(raw: string | null | undefined): FeatureFlags {
  if (!raw) return defaultFeatureFlags

  try {
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>
    return {
      premiumPlans: parsed.premiumPlans ?? defaultFeatureFlags.premiumPlans,
      aiSmartReply: parsed.aiSmartReply ?? defaultFeatureFlags.aiSmartReply,
      bulkScheduler: parsed.bulkScheduler ?? defaultFeatureFlags.bulkScheduler,
      campaignAnalytics: parsed.campaignAnalytics ?? defaultFeatureFlags.campaignAnalytics,
    }
  } catch {
    return defaultFeatureFlags
  }
}

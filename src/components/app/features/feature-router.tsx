'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type FeaturePage } from '@/store/app-store'
import { SendMessagePage } from './send-message-page'
import { AutoReplyPage } from './auto-reply-page'
import { ChatbotPage } from './chatbot-page'
import { SchedulerPage } from './scheduler-page'
import { AnalyticsPage } from './analytics-page'
import { CampaignReportsPage } from './campaign-reports-page'
import { GroupExtractorPage } from './group-extractor-page'
import { LeadScraperPage } from './lead-scraper-page'
import { LinkGeneratorPage } from './link-generator-page'
import { MessageTemplatesPage } from './message-templates-page'
import { CampaignDetailPage } from './campaign-detail-page'
import { ContactDetailPage } from './contact-detail-page'
import { BroadcastListsPage } from './broadcast-lists-page'
import { AiChatPage } from './ai-chat-page'
import { DataExportPage } from './data-export-page'
import { ApiHealthPage } from './api-health-page'
import { NumberValidatorPage } from './number-validator-page'
import { CampaignWizardPage } from './campaign-wizard-page'
import { ContactImportPage } from './contact-import-page'
import { QrCodePage } from './qr-code-page'
import { ResponseTimePage } from './response-time-page'
import { InboxPage } from './inbox-page'
import { ContactGroupsPage } from './contact-groups-page'
import { FlowBuilderPage } from './flow-builder-page'
import { MessageStatusPage } from './message-status-page'
import { WebhookManagerPage } from './webhook-manager-page'
import { TeamManagementPage } from './team-management-page'
import { PersonalityAgentPage } from './personality-agent-page'
import { AntiBanPage } from './anti-ban-page'
import { NumberGeneratorPage } from './number-generator-page'
import { AiSmartReplyPage } from './ai-smart-reply-page'
import { CampaignAnalyticsPage } from './campaign-analytics-page'
import { BulkSchedulerPage } from './bulk-scheduler-page'
import { WaConnectionPage } from './wa-connection-page'
import { PremiumPlansPage } from './premium-plans-page'
import { defaultFeatureFlags, type FeatureFlags } from '@/lib/feature-flags'

const featureFlagMap: Partial<Record<Exclude<FeaturePage, null>, keyof FeatureFlags>> = {
  'premium-plans': 'premiumPlans',
  'ai-smart-reply': 'aiSmartReply',
  'bulk-scheduler': 'bulkScheduler',
  'campaign-analytics': 'campaignAnalytics',
}

const featureComponents: Record<FeaturePage, React.ComponentType> = {
  'send-message': SendMessagePage,
  'auto-reply': AutoReplyPage,
  'chatbot': ChatbotPage,
  'scheduler': SchedulerPage,
  'group-extractor': GroupExtractorPage,
  'lead-scraper': LeadScraperPage,
  'link-generator': LinkGeneratorPage,
  'analytics': AnalyticsPage,
  'campaign-reports': CampaignReportsPage,
  'message-templates': MessageTemplatesPage,
  'campaign-detail': CampaignDetailPage,
  'contact-detail': ContactDetailPage,
  'broadcast-lists': BroadcastListsPage,
  'ai-chat': AiChatPage,
  'data-export': DataExportPage,
  'api-health': ApiHealthPage,
  'number-validator': NumberValidatorPage,
  'campaign-wizard': CampaignWizardPage,
  'contact-import': ContactImportPage,
  'qr-code': QrCodePage,
  'response-time': ResponseTimePage,
  'inbox': InboxPage,
  'contact-groups': ContactGroupsPage,
  'flow-builder': FlowBuilderPage,
  'message-status': MessageStatusPage,
  'webhook-manager': WebhookManagerPage,
  'team-management': TeamManagementPage,
  'personality-agent': PersonalityAgentPage,
  'anti-ban': AntiBanPage,
  'number-generator': NumberGeneratorPage,
  'ai-smart-reply': AiSmartReplyPage,
  'campaign-analytics': CampaignAnalyticsPage,
  'bulk-scheduler': BulkSchedulerPage,
  'wa-connection': WaConnectionPage,
  'premium-plans': PremiumPlansPage,
}

export function FeatureRouter() {
  const { activeFeature } = useAppStore()
  const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags)

  useEffect(() => {
    let cancelled = false
    async function loadFlags() {
      try {
        const res = await fetch('/api/feature-flags')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.flags) setFlags(data.flags)
      } catch {
        // keep defaults on error
      }
    }
    loadFlags()
    return () => {
      cancelled = true
    }
  }, [])

  if (!activeFeature) return null

  const flagName = featureFlagMap[activeFeature]
  if (flagName && !flags[flagName]) {
    return (
      <div className="px-4 py-10 text-center text-white/70">
        <h3 className="text-lg font-bold text-white mb-2">Feature Disabled</h3>
        <p className="text-sm">This feature is currently disabled by your deployment configuration.</p>
      </div>
    )
  }

  const Component = featureComponents[activeFeature]
  if (!Component) return null

  return <Component />
}

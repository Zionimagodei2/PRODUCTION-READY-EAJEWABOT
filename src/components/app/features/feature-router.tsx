'use client'

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
import { motion, AnimatePresence } from 'framer-motion'

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
}

export function FeatureRouter() {
  const { activeFeature } = useAppStore()

  if (!activeFeature) return null

  const Component = featureComponents[activeFeature]
  if (!Component) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  )
}

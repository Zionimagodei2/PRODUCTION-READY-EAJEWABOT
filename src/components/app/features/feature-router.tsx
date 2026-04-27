'use client'

import { useAppStore, type FeaturePage } from '@/store/app-store'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from '@/lib/framer-shim'
import { DashboardSkeleton } from '@/components/app/loading-skeleton'

// Lazy load all feature pages for code splitting and faster initial load
const SendMessagePage = dynamic(() => import('./send-message-page').then(m => ({ default: m.SendMessagePage })), { loading: () => <FeatureLoading /> })
const AutoReplyPage = dynamic(() => import('./auto-reply-page').then(m => ({ default: m.AutoReplyPage })), { loading: () => <FeatureLoading /> })
const ChatbotPage = dynamic(() => import('./chatbot-page').then(m => ({ default: m.ChatbotPage })), { loading: () => <FeatureLoading /> })
const SchedulerPage = dynamic(() => import('./scheduler-page').then(m => ({ default: m.SchedulerPage })), { loading: () => <FeatureLoading /> })
const AnalyticsPage = dynamic(() => import('./analytics-page').then(m => ({ default: m.AnalyticsPage })), { loading: () => <FeatureLoading /> })
const CampaignReportsPage = dynamic(() => import('./campaign-reports-page').then(m => ({ default: m.CampaignReportsPage })), { loading: () => <FeatureLoading /> })
const GroupExtractorPage = dynamic(() => import('./group-extractor-page').then(m => ({ default: m.GroupExtractorPage })), { loading: () => <FeatureLoading /> })
const LeadScraperPage = dynamic(() => import('./lead-scraper-page').then(m => ({ default: m.LeadScraperPage })), { loading: () => <FeatureLoading /> })
const LinkGeneratorPage = dynamic(() => import('./link-generator-page').then(m => ({ default: m.LinkGeneratorPage })), { loading: () => <FeatureLoading /> })
const MessageTemplatesPage = dynamic(() => import('./message-templates-page').then(m => ({ default: m.MessageTemplatesPage })), { loading: () => <FeatureLoading /> })
const CampaignDetailPage = dynamic(() => import('./campaign-detail-page').then(m => ({ default: m.CampaignDetailPage })), { loading: () => <FeatureLoading /> })
const ContactDetailPage = dynamic(() => import('./contact-detail-page').then(m => ({ default: m.ContactDetailPage })), { loading: () => <FeatureLoading /> })
const BroadcastListsPage = dynamic(() => import('./broadcast-lists-page').then(m => ({ default: m.BroadcastListsPage })), { loading: () => <FeatureLoading /> })
const AiChatPage = dynamic(() => import('./ai-chat-page').then(m => ({ default: m.AiChatPage })), { loading: () => <FeatureLoading /> })
const DataExportPage = dynamic(() => import('./data-export-page').then(m => ({ default: m.DataExportPage })), { loading: () => <FeatureLoading /> })
const ApiHealthPage = dynamic(() => import('./api-health-page').then(m => ({ default: m.ApiHealthPage })), { loading: () => <FeatureLoading /> })
const NumberValidatorPage = dynamic(() => import('./number-validator-page').then(m => ({ default: m.NumberValidatorPage })), { loading: () => <FeatureLoading /> })
const CampaignWizardPage = dynamic(() => import('./campaign-wizard-page').then(m => ({ default: m.CampaignWizardPage })), { loading: () => <FeatureLoading /> })
const ContactImportPage = dynamic(() => import('./contact-import-page').then(m => ({ default: m.ContactImportPage })), { loading: () => <FeatureLoading /> })
const QrCodePage = dynamic(() => import('./qr-code-page').then(m => ({ default: m.QrCodePage })), { loading: () => <FeatureLoading /> })
const ResponseTimePage = dynamic(() => import('./response-time-page').then(m => ({ default: m.ResponseTimePage })), { loading: () => <FeatureLoading /> })
const InboxPage = dynamic(() => import('./inbox-page').then(m => ({ default: m.InboxPage })), { loading: () => <FeatureLoading /> })
const ContactGroupsPage = dynamic(() => import('./contact-groups-page').then(m => ({ default: m.ContactGroupsPage })), { loading: () => <FeatureLoading /> })
const FlowBuilderPage = dynamic(() => import('./flow-builder-page').then(m => ({ default: m.FlowBuilderPage })), { loading: () => <FeatureLoading /> })
const MessageStatusPage = dynamic(() => import('./message-status-page').then(m => ({ default: m.MessageStatusPage })), { loading: () => <FeatureLoading /> })
const WebhookManagerPage = dynamic(() => import('./webhook-manager-page').then(m => ({ default: m.WebhookManagerPage })), { loading: () => <FeatureLoading /> })
const TeamManagementPage = dynamic(() => import('./team-management-page').then(m => ({ default: m.TeamManagementPage })), { loading: () => <FeatureLoading /> })
const PersonalityAgentPage = dynamic(() => import('./personality-agent-page').then(m => ({ default: m.PersonalityAgentPage })), { loading: () => <FeatureLoading /> })
const AntiBanPage = dynamic(() => import('./anti-ban-page').then(m => ({ default: m.AntiBanPage })), { loading: () => <FeatureLoading /> })
const NumberGeneratorPage = dynamic(() => import('./number-generator-page').then(m => ({ default: m.NumberGeneratorPage })), { loading: () => <FeatureLoading /> })

function FeatureLoading() {
  return (
    <div className="px-4 py-4 pb-24 max-w-lg mx-auto">
      <DashboardSkeleton />
    </div>
  )
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

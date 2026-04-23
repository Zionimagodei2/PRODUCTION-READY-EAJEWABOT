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

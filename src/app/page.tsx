'use client'

import { useAppStore } from '@/store/app-store'
import { Header } from '@/components/app/header'
import { BottomNav } from '@/components/app/bottom-nav'
import { DashboardPage } from '@/components/app/dashboard-page'
import { CampaignsPage } from '@/components/app/campaigns-page'
import { ContactsPage } from '@/components/app/contacts-page'
import { ToolsPage } from '@/components/app/tools-page'
import { SettingsPage } from '@/components/app/settings-page'
import { FeatureRouter } from '@/components/app/features/feature-router'
import { OnboardingModal } from '@/components/app/modals/onboarding-modal'
import { QuickSearchModal } from '@/components/app/modals/quick-search-modal'
import { AddContactModal } from '@/components/app/modals/add-contact-modal'
import { ToastContainer } from '@/components/app/toast-container'
import { AnimatePresence, motion } from 'framer-motion'

const tabComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  campaigns: CampaignsPage,
  contacts: ContactsPage,
  tools: ToolsPage,
  settings: SettingsPage,
}

export default function Home() {
  const { activeTab, activeFeature } = useAppStore()

  const TabComponent = tabComponents[activeTab]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated mesh background */}
      <div className="mesh-bg" />
      
      <Header />
      <main className="flex-1 overflow-y-auto">
        {activeFeature ? (
          <FeatureRouter />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <TabComponent />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <BottomNav />
      <OnboardingModal />
      <QuickSearchModal />
      <AddContactModal />
      <ToastContainer />
    </div>
  )
}

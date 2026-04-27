'use client'

import { useAppStore } from '@/store/app-store'
import { Header } from '@/components/app/header'
import { FloatingNav } from '@/components/app/floating-nav'
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
import { OfflineIndicator } from '@/components/app/offline-indicator'
import { PWAInstallBanner, PermissionPrompt } from '@/components/app/modals/pwa-install-banner'
import { AnimatePresence, motion } from '@/lib/framer-shim'

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
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden w-full max-w-[100vw]">
      {/* Animated mesh background */}
      <div className="mesh-bg" />
      
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
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
      <FloatingNav />
      <OnboardingModal />
      <QuickSearchModal />
      <AddContactModal />
      <PWAInstallBanner />
      <PermissionPrompt />
      <OfflineIndicator />
      <ToastContainer />
    </div>
  )
}

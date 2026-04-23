'use client'

import { useAppStore } from '@/store/app-store'
import { Header } from '@/components/app/header'
import { BottomNav } from '@/components/app/bottom-nav'
import { DashboardPage } from '@/components/app/dashboard-page'
import { FeatureRouter } from '@/components/app/features/feature-router'
import { OnboardingModal } from '@/components/app/modals/onboarding-modal'
import { QuickSearchModal } from '@/components/app/modals/quick-search-modal'
import { AddContactModal } from '@/components/app/modals/add-contact-modal'
import { ToastContainer } from '@/components/app/toast-container'
import { OfflineIndicator } from '@/components/app/offline-indicator'
import { PWAInstallBanner, PermissionPrompt } from '@/components/app/modals/pwa-install-banner'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'

// Lazy load non-dashboard tab pages
const CampaignsPage = dynamic(() => import('@/components/app/campaigns-page').then(m => ({ default: m.CampaignsPage })), { 
  loading: () => <TabLoading /> 
})
const ContactsPage = dynamic(() => import('@/components/app/contacts-page').then(m => ({ default: m.ContactsPage })), { 
  loading: () => <TabLoading /> 
})
const ToolsPage = dynamic(() => import('@/components/app/tools-page').then(m => ({ default: m.ToolsPage })), { 
  loading: () => <TabLoading /> 
})
const SettingsPage = dynamic(() => import('@/components/app/settings-page').then(m => ({ default: m.SettingsPage })), { 
  loading: () => <TabLoading /> 
})

function TabLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

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
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
      <PWAInstallBanner />
      <PermissionPrompt />
      <OfflineIndicator />
      <ToastContainer />
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
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

const tabComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  campaigns: CampaignsPage,
  contacts: ContactsPage,
  tools: ToolsPage,
  settings: SettingsPage,
}

export default function Home() {
  const store = useAppStore()
  const { activeTab, activeFeature } = store
  const mainRef = useRef<HTMLElement | null>(null)

  // Expose store for headless browser automation testing
  useEffect(() => {
    (window as Record<string, unknown>).__APP_STORE__ = store
  }, [store])

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: 'auto' })
  }, [activeTab, activeFeature])

  const TabComponent = tabComponents[activeTab]

  return (
    <div className="min-h-screen flex flex-col bg-background w-full max-w-[100vw] overflow-x-hidden">
      {/* Animated mesh background */}
      <div className="mesh-bg" />
      
      <Header />
      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-14">
        {activeFeature ? (
          <FeatureRouter />
        ) : (
          <TabComponent />
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

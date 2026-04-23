import { create } from 'zustand'

export type TabId = 'dashboard' | 'campaigns' | 'contacts' | 'tools' | 'settings'
export type FeaturePage = 
  | 'send-message' 
  | 'auto-reply' 
  | 'chatbot' 
  | 'scheduler'
  | 'group-extractor' 
  | 'lead-scraper' 
  | 'link-generator'
  | 'analytics' 
  | 'campaign-reports'
  | 'message-templates'
  | 'campaign-detail'
  | null

interface AppState {
  activeTab: TabId
  activeFeature: FeaturePage
  sidebarOpen: boolean
  waConnected: boolean
  selectedCampaignId: string | null
  
  setActiveTab: (tab: TabId) => void
  setActiveFeature: (feature: FeaturePage) => void
  setSidebarOpen: (open: boolean) => void
  setWaConnected: (connected: boolean) => void
  setSelectedCampaignId: (id: string | null) => void
  goBack: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  activeFeature: null,
  sidebarOpen: false,
  waConnected: true,
  selectedCampaignId: null,
  
  setActiveTab: (tab) => set({ activeTab: tab, activeFeature: null }),
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setWaConnected: (connected) => set({ waConnected: connected }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  goBack: () => set({ activeFeature: null }),
}))

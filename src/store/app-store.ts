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
  | null

interface AppState {
  activeTab: TabId
  activeFeature: FeaturePage
  sidebarOpen: boolean
  waConnected: boolean
  
  setActiveTab: (tab: TabId) => void
  setActiveFeature: (feature: FeaturePage) => void
  setSidebarOpen: (open: boolean) => void
  setWaConnected: (connected: boolean) => void
  goBack: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  activeFeature: null,
  sidebarOpen: false,
  waConnected: true,
  
  setActiveTab: (tab) => set({ activeTab: tab, activeFeature: null }),
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setWaConnected: (connected) => set({ waConnected: connected }),
  goBack: () => set({ activeFeature: null }),
}))

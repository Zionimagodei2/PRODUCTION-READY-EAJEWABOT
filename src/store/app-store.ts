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
  | 'contact-detail'
  | 'broadcast-lists'
  | 'ai-chat'
  | 'data-export'
  | 'api-health'
  | 'number-validator'
  | 'campaign-wizard'
  | 'contact-import'
  | 'qr-code'
  | 'response-time'
  | 'inbox'
  | 'contact-groups'
  | 'flow-builder'
  | 'message-status'
  | 'webhook-manager'
  | 'team-management'
  | 'personality-agent'
  | 'number-generator'
  | 'anti-ban'
  | 'ai-smart-reply'
  | 'campaign-analytics'
  | 'bulk-scheduler'
  | 'wa-connection'
  | 'premium-plans'
  | null

interface AppState {
  activeTab: TabId
  activeFeature: FeaturePage
  sidebarOpen: boolean
  waConnected: boolean
  selectedCampaignId: string | null
  selectedContactId: string | null
  searchOpen: boolean
  addContactOpen: boolean
  pendingNewContact: {
    id: string
    name: string
    phone: string
    tags: string[]
    lastMessage: string
    status: 'active' | 'inactive'
    dateAdded: string
  } | null
  
  setActiveTab: (tab: TabId) => void
  setSearchOpen: (open: boolean) => void
  setAddContactOpen: (open: boolean) => void
  setPendingNewContact: (contact: AppState['pendingNewContact']) => void
  setActiveFeature: (feature: FeaturePage) => void
  setSidebarOpen: (open: boolean) => void
  setWaConnected: (connected: boolean) => void
  setSelectedCampaignId: (id: string | null) => void
  setSelectedContactId: (id: string | null) => void
  goBack: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  activeFeature: null,
  sidebarOpen: false,
  waConnected: false,
  selectedCampaignId: null,
  selectedContactId: null,
  searchOpen: false,
  addContactOpen: false,
  pendingNewContact: null,
  
  setActiveTab: (tab) => set({ activeTab: tab, activeFeature: null }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setAddContactOpen: (open) => set({ addContactOpen: open }),
  setPendingNewContact: (contact) => set({ pendingNewContact: contact }),
  setActiveFeature: (feature) => set({ activeFeature: feature }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setWaConnected: (connected) => set({ waConnected: connected }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setSelectedContactId: (id) => set({ selectedContactId: id }),
  goBack: () => set({ activeFeature: null }),
}))

// Expose store for debugging (headless browser automation)
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).__APP_STORE__ = useAppStore
}

// Also expose on module load via a side-effect
if (typeof window !== 'undefined') {
  setTimeout(() => {
    (window as Record<string, unknown>).__APP_STORE__ = useAppStore
    console.log('[DEBUG] Store exposed on window.__APP_STORE__')
  }, 100)
}

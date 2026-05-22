import { create } from 'zustand'

export type PageId = 
  | 'dashboard'
  | 'trading'      // Stock trading screen
  | 'stockOverview' // Stock detail/overview page
  | 'positions'    // Positions with Index/Stock tabs
  | 'orders'       // Orders with Index/Stock tabs
  | 'portfolio'    // Portfolio overview
  | 'reports'      // Reports/analytics
  | 'optionChain'  // Option chain (accessible from index detail)
  | 'futures'      // Futures trading
  | 'learning'     // Learn section
  | 'profile'      // Profile/settings
  // Footer pages
  | 'privacy-policy'
  | 'terms-of-service'
  | 'support'
  | 'contact-us'
  | 'faq'
  | 'disclaimer'
  | 'about-us'
  | 'refund-policy'

interface AppState {
  currentPage: PageId
  sidebarOpen: boolean
  selectedStockSymbol: string | null
  setCurrentPage: (page: PageId) => void
  setSidebarOpen: (open: boolean) => void
  setSelectedStockSymbol: (symbol: string | null) => void
  navigateToStock: (symbol: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  selectedStockSymbol: null,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedStockSymbol: (symbol) => set({ selectedStockSymbol: symbol }),
  navigateToStock: (symbol) => set({ selectedStockSymbol: symbol, currentPage: 'stockOverview', sidebarOpen: false }),
}))

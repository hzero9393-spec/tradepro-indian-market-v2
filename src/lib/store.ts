import { create } from 'zustand'

export type PageId = 
  | 'dashboard'
  | 'trading'      // Stock trading screen
  | 'positions'    // Positions with Index/Stock tabs
  | 'orders'       // Orders with Index/Stock tabs
  | 'portfolio'    // Portfolio overview
  | 'reports'      // Reports/analytics
  | 'optionChain'  // Option chain (accessible from index detail)
  | 'futures'      // Futures trading
  | 'learning'     // Learn section
  | 'profile'      // Profile/settings

interface AppState {
  currentPage: PageId
  sidebarOpen: boolean
  setCurrentPage: (page: PageId) => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

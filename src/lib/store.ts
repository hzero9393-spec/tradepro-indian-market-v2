import { create } from 'zustand'

export type PageId = 
  | 'dashboard'
  | 'trading'
  | 'portfolio'
  | 'orders'
  | 'analytics'
  | 'challenges'
  | 'leaderboard'
  | 'learning'
  | 'settings'

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

import { create } from 'zustand'

export type PageId = 
  | 'dashboard'
  | 'trading'      // Stock trading screen
  | 'stockOverview' // Stock detail/overview page
  | 'indexDetail'  // Index detail page with chart + stats
  | 'positions'    // Positions with Index/Stock tabs
  | 'orders'       // Orders with Index/Stock tabs
  | 'portfolio'    // Portfolio overview
  | 'reports'      // Reports/analytics
  | 'optionChain'  // Option chain (accessible from index detail)
  | 'futures'      // Futures trading
  | 'learning'     // Learn section
  | 'profile'      // Profile/settings
  | 'activeDevices' // Active devices/sessions detail
  | 'helpSupport'   // Help & Support detail page
  // Footer pages
  | 'privacy-policy'
  | 'terms-of-service'
  | 'support'
  | 'contact-us'
  | 'faq'
  | 'disclaimer'
  | 'about-us'
  | 'refund-policy'

// ─── URL ↔ Page Mapping ──────────────────────────────────────────

const PAGE_TO_URL: Record<PageId, string> = {
  dashboard: '/',
  trading: '/stocks',
  stockOverview: '/stocks', // will have ?symbol= param
  indexDetail: '/index',    // will have ?symbol= param
  positions: '/positions',
  orders: '/orders',
  portfolio: '/portfolio',
  reports: '/reports',
  optionChain: '/option-chain',
  futures: '/futures',
  learning: '/learning',
  profile: '/profile',
  activeDevices: '/active-devices',
  helpSupport: '/help-support',
  'privacy-policy': '/privacy-policy',
  'terms-of-service': '/terms-of-service',
  support: '/support',
  'contact-us': '/contact-us',
  faq: '/faq',
  disclaimer: '/disclaimer',
  'about-us': '/about-us',
  'refund-policy': '/refund-policy',
}

const URL_TO_PAGE: Record<string, PageId> = {
  '/': 'dashboard',
  '/stocks': 'trading',
  '/positions': 'positions',
  '/orders': 'orders',
  '/portfolio': 'portfolio',
  '/reports': 'reports',
  '/option-chain': 'optionChain',
  '/futures': 'futures',
  '/learning': 'learning',
  '/profile': 'profile',
  '/active-devices': 'activeDevices',
  '/help-support': 'helpSupport',
  '/privacy-policy': 'privacy-policy',
  '/terms-of-service': 'terms-of-service',
  '/support': 'support',
  '/contact-us': 'contact-us',
  '/faq': 'faq',
  '/disclaimer': 'disclaimer',
  '/about-us': 'about-us',
  '/refund-policy': 'refund-policy',
}

/** Get the PageId from the current browser URL */
export function getPageFromUrl(pathname: string): PageId {
  // Exact match first
  if (URL_TO_PAGE[pathname]) return URL_TO_PAGE[pathname]

  // /stock/[symbol] → stockOverview
  if (pathname.startsWith('/stock/')) return 'stockOverview'
  // /index/[symbol] → indexDetail
  if (pathname.startsWith('/index/')) return 'indexDetail'

  return 'dashboard'
}

interface AppState {
  currentPage: PageId
  sidebarOpen: boolean
  selectedStockSymbol: string | null
  selectedIndexSymbol: string | null
  setCurrentPage: (page: PageId) => void
  setSidebarOpen: (open: boolean) => void
  setSelectedStockSymbol: (symbol: string | null) => void
  setSelectedIndexSymbol: (symbol: string | null) => void
  navigateToStock: (symbol: string) => void
  navigateToIndex: (symbol: string) => void
  /** Set page from popstate (back/forward) — does NOT push URL */
  setCurrentPageFromUrl: (page: PageId, stockSymbol?: string | null, indexSymbol?: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  selectedStockSymbol: null,
  selectedIndexSymbol: null,
  setCurrentPage: (page) => {
    const state = get()
    set({ currentPage: page, sidebarOpen: false })

    // Update browser URL
    let url = PAGE_TO_URL[page] || '/'
    if (page === 'stockOverview' && state.selectedStockSymbol) {
      url = `/stock/${state.selectedStockSymbol}`
    } else if (page === 'indexDetail' && state.selectedIndexSymbol) {
      url = `/index/${state.selectedIndexSymbol}`
    }
    if (typeof window !== 'undefined' && window.location.pathname !== url) {
      window.history.pushState({ page, stockSymbol: state.selectedStockSymbol, indexSymbol: state.selectedIndexSymbol }, '', url)
    }
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedStockSymbol: (symbol) => set({ selectedStockSymbol: symbol }),
  setSelectedIndexSymbol: (symbol) => set({ selectedIndexSymbol: symbol }),
  navigateToStock: (symbol) => {
    set({ selectedStockSymbol: symbol, currentPage: 'stockOverview', sidebarOpen: false })
    // Push URL
    if (typeof window !== 'undefined') {
      const url = `/stock/${symbol}`
      window.history.pushState({ page: 'stockOverview', stockSymbol: symbol }, '', url)
    }
  },
  navigateToIndex: (symbol) => {
    set({ selectedIndexSymbol: symbol, currentPage: 'indexDetail', sidebarOpen: false })
    // Push URL
    if (typeof window !== 'undefined') {
      const url = `/index/${symbol}`
      window.history.pushState({ page: 'indexDetail', indexSymbol: symbol }, '', url)
    }
  },
  setCurrentPageFromUrl: (page, stockSymbol, indexSymbol) => {
    set({
      currentPage: page,
      sidebarOpen: false,
      ...(stockSymbol !== undefined && { selectedStockSymbol: stockSymbol }),
      ...(indexSymbol !== undefined && { selectedIndexSymbol: indexSymbol }),
    })
  },
}))

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Flame,
  Search,
  BarChart3,
  ChevronRight,
  CandlestickChart,
  GraduationCap,
  Briefcase,
  Radio,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useMarketData } from '@/lib/market-data'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '@/lib/format'
import { NotificationBanner } from '@/components/tradepro/ui/notification-banner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface IndexData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  isEnabled: boolean
}

interface StockData {
  id: string
  symbol: string
  name: string
  sector: string
  currentPrice: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  isFuturesAvailable: boolean
  isOptionsAvailable: boolean
}

// Map to convert live engine data to display format
function liveIndexToDisplay(live: { symbol: string; name: string; price: number; change: number; changePercent: number }): IndexData {
  return {
    id: live.symbol,
    symbol: live.symbol,
    name: live.name,
    currentPrice: live.price,
    change: live.change,
    changePercent: live.changePercent,
    isEnabled: true,
  }
}

function liveStockToDisplay(live: { symbol: string; name: string; price: number; change: number; changePercent: number; sector: string; isFuturesAvailable: boolean; isOptionsAvailable: boolean; volume: number }): StockData {
  return {
    id: live.symbol,
    symbol: live.symbol,
    name: live.name,
    sector: live.sector,
    currentPrice: live.price,
    change: live.change,
    changePercent: live.changePercent,
    volume: live.volume,
    isFuturesAvailable: live.isFuturesAvailable,
    isOptionsAvailable: live.isOptionsAvailable,
  }
}

// ─── Fallback Data (ALWAYS shows something) ─────────────────────────────────

const MAIN_INDICES_ORDER = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX']

const fallbackIndices: IndexData[] = [
  { id: '1', symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 22356.10, change: 142.30, changePercent: 0.64, isEnabled: true },
  { id: '2', symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 47210.45, change: -82.10, changePercent: -0.17, isEnabled: true },
  { id: '3', symbol: 'FINNIFTY', name: 'FIN NIFTY', currentPrice: 23450.80, change: 95.60, changePercent: 0.41, isEnabled: true },
  { id: '4', symbol: 'SENSEX', name: 'SENSEX', currentPrice: 73645.25, change: 450.15, changePercent: 0.61, isEnabled: true },
]

const fallbackGainers: StockData[] = [
  { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', currentPrice: 2890.50, change: 34.25, changePercent: 1.20, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '2', symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', currentPrice: 1642.75, change: 18.50, changePercent: 1.14, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '3', symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', currentPrice: 1124.60, change: 12.40, changePercent: 1.12, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '4', symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', currentPrice: 628.45, change: 8.75, changePercent: 1.41, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '5', symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', currentPrice: 1520.30, change: 22.80, changePercent: 1.52, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '6', symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', currentPrice: 678.90, change: 14.30, changePercent: 2.15, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '7', symbol: 'WIPRO', name: 'Wipro', sector: 'IT', currentPrice: 458.25, change: 9.85, changePercent: 2.19, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '8', symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Conglomerate', currentPrice: 2890.60, change: 56.40, changePercent: 1.99, isFuturesAvailable: true, isOptionsAvailable: true },
]

const fallbackLosers: StockData[] = [
  { id: '1', symbol: 'TCS', name: 'Tata Consultancy', sector: 'IT', currentPrice: 3945.00, change: -22.30, changePercent: -0.56, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '2', symbol: 'INFY', name: 'Infosys', sector: 'IT', currentPrice: 1578.30, change: -8.70, changePercent: -0.55, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '3', symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', currentPrice: 2345.80, change: -15.20, changePercent: -0.64, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '4', symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', currentPrice: 438.65, change: -3.10, changePercent: -0.70, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '5', symbol: 'ASIANPAINT', name: 'Asian Paints', sector: 'Paints', currentPrice: 2890.15, change: -24.60, changePercent: -0.84, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '6', symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infra', currentPrice: 3245.70, change: -18.90, changePercent: -0.58, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '7', symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Finance', currentPrice: 6789.40, change: -45.30, changePercent: -0.66, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '8', symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', currentPrice: 10456.80, change: -72.50, changePercent: -0.69, isFuturesAvailable: true, isOptionsAvailable: true },
]

const fallbackOtherStocks: StockData[] = [
  { id: '1', symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking', currentPrice: 1785.20, change: 9.60, changePercent: 0.54, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '2', symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banking', currentPrice: 1098.35, change: -4.20, changePercent: -0.38, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '3', symbol: 'SUNPHARMA', name: 'Sun Pharma', sector: 'Pharma', currentPrice: 1234.50, change: 6.80, changePercent: 0.55, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '4', symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer', currentPrice: 3456.90, change: -12.40, changePercent: -0.36, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '5', symbol: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Cement', currentPrice: 9876.30, change: 45.60, changePercent: 0.46, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '6', symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Power', currentPrice: 289.75, change: 3.45, changePercent: 1.21, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '7', symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power', currentPrice: 345.60, change: -2.80, changePercent: -0.80, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '8', symbol: 'ONGC', name: 'Oil & Natural Gas', sector: 'Energy', currentPrice: 256.40, change: 5.30, changePercent: 2.11, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '9', symbol: 'COALINDIA', name: 'Coal India', sector: 'Mining', currentPrice: 412.80, change: -6.90, changePercent: -1.64, isFuturesAvailable: true, isOptionsAvailable: true },
  { id: '10', symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', currentPrice: 1567.20, change: 11.40, changePercent: 0.73, isFuturesAvailable: true, isOptionsAvailable: true },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Stock Row Component ────────────────────────────────────────────────────

function StockRow({ stock, onClick }: { stock: StockData; onClick: () => void }) {
  const isPositive = stock.changePercent >= 0
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-3 hover:bg-[#f5f7fa] rounded-lg cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
          isPositive ? 'bg-[#00B386]/8' : 'bg-[#EB5B3C]/8'
        }`}>
          <span className={`text-[10px] font-bold ${isPositive ? 'text-[#00B386]' : 'text-[#EB5B3C]'}`}>
            {stock.symbol.substring(0, 2)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-[#1a1a1a] truncate">{stock.symbol}</span>
            {stock.isFuturesAvailable && stock.isOptionsAvailable && (
              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-bold border-[#00D09C]/30 text-[#00D09C] bg-[#00D09C]/5">
                F&O
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-[#6b7280] truncate">{stock.name}</p>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3 flex items-center gap-2">
        <div>
          <div className="text-sm font-bold font-mono font-tabular text-[#1a1a1a]">
            ₹{formatPrice(stock.currentPrice)}
          </div>
          <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
            isPositive ? 'text-[#00B386]' : 'text-[#EB5B3C]'
          }`}>
            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              isPositive ? 'bg-[#00B386]/10' : 'bg-[#EB5B3C]/10'
            }`}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <ChevronRight className="size-4 text-[#d1d5db] group-hover:text-[#6b7280] shrink-0 transition-colors" />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DashboardPage() {
  const { navigateToStock, navigateToIndex, setCurrentPage } = useAppStore()

  // ─── REAL-TIME MARKET DATA (primary source) ──────────────
  const { indices: liveIndices, stocks: liveStocks, isConnected: isLiveConnected, dataSource } = useMarketData()

  // Active tab
  const [activeTab, setActiveTab] = useState<'stocks' | 'options' | 'portfolio' | 'learn'>('stocks')

  // Data states (fallback for when live data not available)
  const [apiIndices, setApiIndices] = useState<IndexData[]>([])
  const [apiStocks, setApiStocks] = useState<StockData[]>([])
  const [apiGainers, setApiGainers] = useState<StockData[]>([])
  const [apiLosers, setApiLosers] = useState<StockData[]>([])

  // Loading
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [stocksLoading, setStocksLoading] = useState(true)
  const [gainersLoading, setGainersLoading] = useState(true)
  const [losersLoading, setLosersLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Fetch Indices (fallback) ──────────────────────────────
  const fetchIndices = useCallback(async () => {
    try {
      setIndicesLoading(true)
      const res = await fetch('/api/indices')
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) setApiIndices(json.data)
      }
    } catch { /* fallback */ }
    finally { setIndicesLoading(false) }
  }, [])

  // ─── Fetch Stocks (fallback) ───────────────────────────────
  const fetchStocks = useCallback(async () => {
    try {
      setStocksLoading(true)
      const res = await fetch('/api/stocks')
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) setApiStocks(json.data)
      }
    } catch { /* fallback */ }
    finally { setStocksLoading(false) }
  }, [])

  // ─── Fetch Gainers (fallback) ──────────────────────────────
  const fetchGainers = useCallback(async () => {
    try {
      setGainersLoading(true)
      const res = await fetch('/api/stocks/gainers')
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) setApiGainers(json.data)
      }
    } catch { /* fallback */ }
    finally { setGainersLoading(false) }
  }, [])

  // ─── Fetch Losers (fallback) ───────────────────────────────
  const fetchLosers = useCallback(async () => {
    try {
      setLosersLoading(true)
      const res = await fetch('/api/stocks/losers')
      if (res.ok) {
        const json = await res.json()
        if (json.data?.length > 0) setApiLosers(json.data)
      }
    } catch { /* fallback */ }
    finally { setLosersLoading(false) }
  }, [])

  // ─── Load API data as fallback ────────────────────────────
  useEffect(() => {
    // Only fetch from API if live engine is not connected
    if (!isLiveConnected) {
      fetchIndices()
      fetchStocks()
      fetchGainers()
      fetchLosers()
    } else {
      // Mark as loaded since live data is available
      setIndicesLoading(false)
      setStocksLoading(false)
      setGainersLoading(false)
      setLosersLoading(false)
    }
  }, [fetchIndices, fetchStocks, fetchGainers, fetchLosers, isLiveConnected])

  // ─── Convert live engine data to display format ───────────
  const liveIndicesList = useMemo(() => {
    if (!isLiveConnected || liveIndices.size === 0) return []
    const result: IndexData[] = []
    for (const [, idx] of liveIndices) {
      result.push(liveIndexToDisplay(idx))
    }
    return result
  }, [isLiveConnected, liveIndices])

  const liveStocksList = useMemo(() => {
    if (!isLiveConnected || liveStocks.size === 0) return []
    const result: StockData[] = []
    for (const [, stock] of liveStocks) {
      result.push(liveStockToDisplay(stock))
    }
    return result
  }, [isLiveConnected, liveStocks])

  // ─── Display data (live > API > fallback) ──────────────────
  const displayIndices = useMemo(() => {
    // Prefer live data, then API data, then fallback
    const source = liveIndicesList.length > 0 ? liveIndicesList
      : apiIndices.length > 0 ? apiIndices
      : fallbackIndices
    // Sort to always show 4 main indices in correct order
    const sorted = [...source].sort((a, b) => {
      const ai = MAIN_INDICES_ORDER.indexOf(a.symbol)
      const bi = MAIN_INDICES_ORDER.indexOf(b.symbol)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    return sorted.slice(0, 4)
  }, [liveIndicesList, apiIndices])

  const liveGainers = useMemo(() => {
    if (liveStocksList.length === 0) return []
    return [...liveStocksList]
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 8)
  }, [liveStocksList])

  const liveLosers = useMemo(() => {
    if (liveStocksList.length === 0) return []
    return [...liveStocksList]
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 8)
  }, [liveStocksList])

  const displayGainers = useMemo(() => {
    if (liveGainers.length > 0) return liveGainers
    return apiGainers.length > 0
      ? apiGainers
      : apiStocks.length > 0
        ? [...apiStocks].filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 8)
        : fallbackGainers
  }, [liveGainers, apiGainers, apiStocks])

  const displayLosers = useMemo(() => {
    if (liveLosers.length > 0) return liveLosers
    return apiLosers.length > 0
      ? apiLosers
      : apiStocks.length > 0
        ? [...apiStocks].filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 8)
        : fallbackLosers
  }, [liveLosers, apiLosers, apiStocks])

  const getOtherStocks = useMemo(() => {
    const allStocks = liveStocksList.length > 0 ? liveStocksList
      : apiStocks.length > 0 ? apiStocks
      : fallbackOtherStocks
    const gainersSet = new Set(displayGainers.map(s => s.symbol))
    const losersSet = new Set(displayLosers.map(s => s.symbol))
    let others = allStocks.filter(s => !gainersSet.has(s.symbol) && !losersSet.has(s.symbol))
    if (others.length === 0) others = allStocks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      others = others.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    }
    return others.slice(0, 10)
  }, [liveStocksList, apiStocks, displayGainers, displayLosers, searchQuery])

  // Tab config
  const tabs = [
    { key: 'stocks' as const, label: 'Stocks', icon: BarChart3 },
    { key: 'options' as const, label: 'Options', icon: CandlestickChart },
    { key: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
    { key: 'learn' as const, label: 'Learn', icon: GraduationCap },
  ]

  const handleTabClick = (key: 'stocks' | 'options' | 'portfolio' | 'learn') => {
    if (key === 'stocks') {
      setActiveTab('stocks')
    } else if (key === 'options') {
      setCurrentPage('optionChain')
    } else if (key === 'portfolio') {
      setCurrentPage('portfolio')
    } else if (key === 'learn') {
      setCurrentPage('learning')
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ═══ NOTIFICATION BANNER ═══════════════════════════════════════════ */}
      <NotificationBanner />

      {/* ═══ LIVE INDICATOR ═══════════════════════════════════════════════ */}
      {isLiveConnected && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-[#00D09C]/5 border-b border-[#00D09C]/10">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#00D09C] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#00D09C]" />
          </span>
          <span className="text-[11px] font-bold text-[#00D09C] tracking-wider uppercase">Live Market Data</span>
          <span className="text-[10px] text-[#6b7280]">• Prices update every second</span>
        </div>
      )}

      {/* ═══ TAB BAR ═══════════════════════════════════════════════════════ */}
      <div className="sticky top-[96px] md:top-[96px] z-30 bg-white border-b border-[#e5e7eb] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'text-[#00D09C] border-[#00D09C]'
                    : 'text-[#6b7280] border-transparent hover:text-[#1a1a1a] hover:border-[#e5e7eb]'
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ STOCKS TAB CONTENT ═══════════════════════════════════════════ */}
      {activeTab === 'stocks' && (
        <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5">

          {/* ── 4 Index Cards ─────────────────────────────────────────────── */}
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {indicesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <Skeleton className="h-3 w-16 mb-2 bg-[#f5f5f5]" />
                      <Skeleton className="h-7 w-28 mb-1.5 bg-[#f5f5f5]" />
                      <Skeleton className="h-3 w-24 bg-[#f5f5f5]" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                displayIndices.slice(0, 4).map((index, i) => {
                  const isPositive = index.changePercent >= 0
                  return (
                    <Card
                      key={index.id || i}
                      onClick={() => navigateToIndex(index.symbol)}
                      className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md hover:border-[#00D09C]/30 transition-all cursor-pointer group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-bold text-[#6b7280] tracking-wider uppercase">
                            {index.name || index.symbol}
                          </span>
                          {isPositive ? (
                            <TrendingUp className="size-4 text-[#00B386] group-hover:scale-110 transition-transform" />
                          ) : (
                            <TrendingDown className="size-4 text-[#EB5B3C] group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="text-2xl font-bold font-mono font-tabular text-[#1a1a1a] mb-1">
                          {formatPrice(index.currentPrice)}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-[#00B386]' : 'text-[#EB5B3C]'}`}>
                          {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          <span>{isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Top Gainers ──────────────────────────────────────────────── */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-[#00B386]/10 flex items-center justify-center">
                    <Flame className="size-3.5 text-[#00B386]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Top Gainers</h3>
                </div>
                <span className="text-[11px] text-[#6b7280] font-medium">{displayGainers.length} stocks</span>
              </div>
              {gainersLoading ? (
                <div className="px-5 pb-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-4 w-20 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f5f5f5]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2 pb-2 divide-y divide-[#f0f0f0]">
                  {displayGainers.map((stock) => (
                    <StockRow key={stock.id} stock={stock} onClick={() => navigateToStock(stock.symbol)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Top Losers ───────────────────────────────────────────────── */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-[#EB5B3C]/10 flex items-center justify-center">
                    <TrendingDown className="size-3.5 text-[#EB5B3C]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Top Losers</h3>
                </div>
                <span className="text-[11px] text-[#6b7280] font-medium">{displayLosers.length} stocks</span>
              </div>
              {losersLoading ? (
                <div className="px-5 pb-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-4 w-20 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f5f5f5]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-2 pb-2 divide-y divide-[#f0f0f0]">
                  {displayLosers.map((stock) => (
                    <StockRow key={stock.id} stock={stock} onClick={() => navigateToStock(stock.symbol)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Other Stocks ─────────────────────────────────────────────── */}
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 pt-4 pb-2 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-[#6b7280]/10 flex items-center justify-center">
                    <BarChart3 className="size-3.5 text-[#6b7280]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Other Stocks</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#f5f7fa] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#00D09C]/50 w-full sm:w-48 transition-all"
                  />
                </div>
              </div>
              {stocksLoading ? (
                <div className="px-5 pb-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-4 w-20 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f5f5f5]" />
                    </div>
                  ))}
                </div>
              ) : getOtherStocks.length === 0 ? (
                <div className="px-5 pb-5 text-center py-6">
                  <p className="text-sm text-[#6b7280]">
                    {searchQuery ? `No stocks found for "${searchQuery}"` : 'No stocks available'}
                  </p>
                </div>
              ) : (
                <div className="px-2 pb-2 divide-y divide-[#f0f0f0]">
                  {getOtherStocks.map((stock) => (
                    <StockRow key={stock.id} stock={stock} onClick={() => navigateToStock(stock.symbol)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}

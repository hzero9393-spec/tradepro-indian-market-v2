'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ShoppingCart,
  ArrowUpFromLine,
  Hourglass,
  BarChart3,
  Briefcase,
  Shield,
  Zap,
  Clock,
  ChevronsUp,
  MoreVertical,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { IndexDetailDrawer } from '@/components/tradepro/index-detail-drawer'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PortfolioData {
  virtualBalance: number
  marginUsed: number
  availableMargin: number
  totalInvested: number
  totalCurrentValue: number
  totalUnrealizedPnl: number
  totalRealizedPnl: number
  totalPortfolioValue: number
  totalPnl: number
  totalReturn: number
  totalTrades: number
  initialCapital: number
  openPositionsCount: number
  segments: {
    equity: { count: number; invested: number; currentValue: number; unrealizedPnl: number; positions?: PositionData[] }
    futures: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number; positions?: PositionData[] }
    options: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number; positions?: PositionData[] }
  }
}

interface PositionData {
  id: string
  segment: string
  productType: string
  tradeDirection: string
  symbol: string
  optionType?: string | null
  strikePrice?: number | null
  expiryDate?: string | null
  quantity: number
  entryPrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  isOpen: boolean
  createdAt: string
}

interface TradeData {
  id: string
  symbol: string
  tradeDirection: 'BUY' | 'SELL'
  segment: string
  fillPrice: number
  quantity: number
  totalValue: number
  brokerage: number
  pnl: number | null
  pnlPercent: number | null
  executedAt: string
  order?: {
    status: string
  }
}

interface IndexData {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  isEnabled: boolean
}

// ─── Fallback Data ──────────────────────────────────────────────────────────

const fallbackPortfolio: PortfolioData = {
  virtualBalance: 100000,
  marginUsed: 0,
  availableMargin: 100000,
  totalInvested: 0,
  totalCurrentValue: 0,
  totalUnrealizedPnl: 0,
  totalRealizedPnl: 0,
  totalPortfolioValue: 100000,
  totalPnl: 0,
  totalReturn: 0,
  totalTrades: 0,
  initialCapital: 100000,
  openPositionsCount: 0,
  segments: {
    equity: { count: 0, invested: 0, currentValue: 0, unrealizedPnl: 0 },
    futures: { count: 0, invested: 0, currentValue: 0, unrealizedPnl: 0, marginUsed: 0 },
    options: { count: 0, invested: 0, currentValue: 0, unrealizedPnl: 0, marginUsed: 0 },
  },
}

const fallbackIndices: IndexData[] = [
  { id: '1', symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 22356.10, change: 142.30, changePercent: 0.64, isEnabled: true },
  { id: '2', symbol: 'SENSEX', name: 'SENSEX', currentPrice: 73645.25, change: 450.15, changePercent: 0.61, isEnabled: true },
  { id: '3', symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 47210.45, change: -82.10, changePercent: -0.17, isEnabled: true },
]

const fallbackTrades: TradeData[] = []

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function formatTimeOfDay(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
}

// ─── Stagger Animation Variants ─────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { token, user } = useAuthStore()
  const { setCurrentPage, navigateToStock } = useAppStore()

  // Index detail drawer state
  const [selectedIndexSymbol, setSelectedIndexSymbol] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleIndexClick = (symbol: string) => {
    setSelectedIndexSymbol(symbol)
    setDrawerOpen(true)
  }

  // Data states
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [positions, setPositions] = useState<PositionData[]>([])
  const [trades, setTrades] = useState<TradeData[]>([])
  const [marketIndices, setMarketIndices] = useState<IndexData[]>([])

  // Loading states
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [positionsLoading, setPositionsLoading] = useState(true)
  const [tradesLoading, setTradesLoading] = useState(true)
  const [marketLoading, setMarketLoading] = useState(true)

  // ─── Fetch Portfolio ─────────────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    if (!token) { setPortfolioLoading(false); return }
    try {
      setPortfolioLoading(true)
      const res = await fetch('/api/trade/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPortfolio(json.data)
      } else {
        setPortfolio(fallbackPortfolio)
      }
    } catch {
      setPortfolio(fallbackPortfolio)
    } finally {
      setPortfolioLoading(false)
    }
  }, [token])

  // ─── Fetch Positions ─────────────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    if (!token) { setPositionsLoading(false); return }
    try {
      setPositionsLoading(true)
      const res = await fetch('/api/trade/positions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPositions(json.data || [])
      } else {
        setPositions([])
      }
    } catch {
      setPositions([])
    } finally {
      setPositionsLoading(false)
    }
  }, [token])

  // ─── Fetch Trades ────────────────────────────────────────────────
  const fetchTrades = useCallback(async () => {
    if (!token) { setTradesLoading(false); return }
    try {
      setTradesLoading(true)
      const res = await fetch('/api/trade/trades?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrades(json.data || [])
      } else {
        setTrades(fallbackTrades)
      }
    } catch {
      setTrades(fallbackTrades)
    } finally {
      setTradesLoading(false)
    }
  }, [token])

  // ─── Fetch Market Indices ────────────────────────────────────────
  const fetchMarketIndices = useCallback(async () => {
    try {
      setMarketLoading(true)
      const res = await fetch('/api/indices')
      if (res.ok) {
        const json = await res.json()
        setMarketIndices(json.data || [])
      } else {
        setMarketIndices(fallbackIndices)
      }
    } catch {
      setMarketIndices(fallbackIndices)
    } finally {
      setMarketLoading(false)
    }
  }, [])

  // ─── Load all data on mount ──────────────────────────────────────
  useEffect(() => {
    fetchPortfolio()
    fetchPositions()
    fetchTrades()
    fetchMarketIndices()
  }, [fetchPortfolio, fetchPositions, fetchTrades, fetchMarketIndices])

  // ─── Auto-refresh positions & portfolio every 10 sec for live P&L ──
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPositions()
      fetchPortfolio()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchPositions, fetchPortfolio])

  // ─── Listen for index detail events from ticker ────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.symbol) {
        handleIndexClick(detail.symbol)
      }
    }
    window.addEventListener('openIndexDetail', handler)
    return () => window.removeEventListener('openIndexDetail', handler)
  }, [])

  // ─── Derived values ──────────────────────────────────────────────
  const portfolioData = portfolio ?? fallbackPortfolio
  const totalBalance = portfolioData.totalPortfolioValue
  const dayPnl = portfolioData.totalUnrealizedPnl + portfolioData.totalRealizedPnl
  const totalTrades = portfolioData.totalTrades
  const winRate = user?.winRate ?? 0

  // Market indices - use API data or fallback
  const displayIndices = marketIndices.length > 0 ? marketIndices : fallbackIndices

  // Positions for the table - use API positions or extract from portfolio segments
  const displayPositions = positions.length > 0
    ? positions
    : [
        ...(portfolioData.segments.equity.positions || []),
        ...(portfolioData.segments.futures.positions || []),
        ...(portfolioData.segments.options.positions || []),
      ]

  // Trades for activity feed - ONLY real data, no fallback
  const displayTrades = trades

  // Greeting
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ═══ Market Pulse Section ════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
            Market Pulse
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-[#00d09c]/10 text-[#00d09c] text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="size-1.5 rounded-full bg-[#00d09c] animate-pulse" />
              LIVE
            </span>
            <span className="text-xs font-medium text-[#6b7280] bg-white border border-[#e5e7eb] px-2.5 py-1 rounded-lg">
              NSE
            </span>
          </div>
        </div>

        {/* Index Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {marketLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3 bg-[#f5f5f5]" />
                  <Skeleton className="h-8 w-32 mb-2 bg-[#f5f5f5]" />
                  <Skeleton className="h-4 w-28 bg-[#f5f5f5]" />
                </CardContent>
              </Card>
            ))
          ) : (
            displayIndices.slice(0, 3).map((index, i) => {
              const isPositive = index.changePercent >= 0
              return (
                <motion.div
                  key={index.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <Card
                    onClick={() => handleIndexClick(index.symbol)}
                    className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md hover:border-[#00D09C]/30 transition-all cursor-pointer group"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase">
                            {index.name || index.symbol}
                          </span>
                          <span className="text-[9px] font-bold text-[#00D09C] opacity-0 group-hover:opacity-100 transition-opacity bg-[#00D09C]/8 px-1.5 py-0.5 rounded">
                            VIEW DETAILS →
                          </span>
                        </div>
                        {isPositive ? (
                          <TrendingUp className="size-5 text-[#00d09c] group-hover:scale-110 transition-transform" />
                        ) : (
                          <TrendingDown className="size-5 text-[#eb5b3c] group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono-data text-[#1a1a1a] mb-1">
                          {index.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                          {isPositive ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownRight className="size-3.5" />
                          )}
                          <span>
                            {isPositive ? '+' : ''}{index.change.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.section>

      {/* ═══ Stats Grid ═════════════════════════════════════════════════════════ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Stat 1 - Total Balance */}
        <motion.div variants={staggerItem}>
          <Card className="bg-white border border-[#e5e7eb] rounded-xl border-l-4 border-l-[#00D09C] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase mb-2">
                Total Balance
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-40 mb-2 bg-[#f5f5f5]" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono-data text-[#1a1a1a]">
                    {formatINRWhole(totalBalance)}
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    .{Math.abs(totalBalance % 1).toFixed(2).substring(2)}
                  </span>
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-32 mt-2 bg-[#f5f5f5]" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#00d09c]">
                  <ChevronsUp className="size-3.5" />
                  <span>{portfolioData.totalReturn >= 0 ? '+' : ''}{portfolioData.totalReturn.toFixed(2)}% from start</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 2 - Today's P&L */}
        <motion.div variants={staggerItem}>
          <Card className={`bg-white border border-[#e5e7eb] rounded-xl border-l-4 shadow-sm ${dayPnl >= 0 ? 'border-l-[#00d09c]' : 'border-l-[#eb5b3c]'}`}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase mb-2">
                Today&apos;s P&amp;L
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-36 mb-2 bg-[#f5f5f5]" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold font-mono-data ${dayPnl >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {dayPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(dayPnl))}
                  </span>
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-2 w-full mt-3 bg-[#f5f5f5]" />
              ) : (
                <div className="mt-3 h-1.5 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${dayPnl >= 0 ? 'bg-[#00d09c]' : 'bg-[#eb5b3c]'}`}
                    style={{ width: `${Math.min(100, Math.max(5, Math.abs(dayPnl / (totalBalance || 1)) * 100 * 10))}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 3 - Win Rate */}
        <motion.div variants={staggerItem}>
          <Card className="bg-white border border-[#e5e7eb] rounded-xl border-l-4 border-l-[#00D09C] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase mb-2">
                Win Rate
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-20 mb-2 bg-[#f5f5f5]" />
              ) : (
                <div className="text-2xl font-bold font-mono-data text-[#1a1a1a]">
                  {winRate.toFixed(0)}%
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-32 mt-2 bg-[#f5f5f5]" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#6b7280]">
                  <Clock className="size-3.5" />
                  <span>Based on last {totalTrades || 50} trades</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 4 - Total Trades */}
        <motion.div variants={staggerItem}>
          <Card className="bg-white border border-[#e5e7eb] rounded-xl border-l-4 border-l-[#6b7280] shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase mb-2">
                Total Trades
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-16 mb-2 bg-[#f5f5f5]" />
              ) : (
                <div className="text-2xl font-bold font-mono-data text-[#1a1a1a]">
                  {totalTrades}
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-24 mt-2 bg-[#f5f5f5]" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#00D09C]">
                  <Zap className="size-3.5" />
                  <span>{displayPositions.length} open positions</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ═══ Two Column: Active Positions + Trade Feed ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Active Positions Table ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg:col-span-2"
        >
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-[#1a1a1a]">Active Positions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#00D09C] text-xs font-semibold hover:underline px-0"
                  onClick={() => setCurrentPage('portfolio')}
                >
                  VIEW PORTFOLIO
                </Button>
              </div>

              {positionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-20 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-20 bg-[#f5f5f5]" />
                      <Skeleton className="h-6 w-24 bg-[#f5f5f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f5f5f5]" />
                    </div>
                  ))}
                </div>
              ) : displayPositions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-14 rounded-full bg-[#fafafa] flex items-center justify-center mb-4">
                    <Briefcase className="size-7 text-[#6b7280]/40" />
                  </div>
                  <p className="text-[#1a1a1a] font-semibold text-sm">No open positions</p>
                  <p className="text-[#6b7280] text-xs mt-1">
                    Start trading to see your positions here
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1.5 bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-lg"
                    onClick={() => setCurrentPage('trading')}
                  >
                    <Plus className="size-3.5" />
                    Start Trading
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-[#e5e7eb]">
                        <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase pb-4 bg-[#fafafa]">
                          Instrument
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase pb-4 bg-[#fafafa]">
                          LTP
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase pb-4 bg-[#fafafa]">
                          Avg. Cost
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase pb-4 bg-[#fafafa]">
                          P&amp;L
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase pb-4 bg-[#fafafa]">
                          Chg %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-[#e5e7eb]">
                      {displayPositions.slice(0, 5).map((pos) => {
                        const pnlValue = pos.unrealizedPnl
                        const pnlPercent = pos.unrealizedPnlPercent
                        const isPositive = pnlValue >= 0
                        // Build instrument label
                        const instrumentLabel = pos.symbol
                        const subLabel = pos.segment === 'OPTIONS'
                          ? `${pos.strikePrice} ${pos.optionType || ''}`
                          : pos.segment === 'FUTURES'
                            ? 'FUT'
                            : 'Equity'

                        return (
                          <TableRow
                            key={pos.id}
                            className="hover:bg-[#fafafa] transition-colors cursor-pointer"
                            onClick={() => navigateToStock(pos.symbol)}
                          >
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-[#1a1a1a]">{instrumentLabel}</span>
                                <span className="text-xs text-[#6b7280]">{subLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 font-mono-data text-sm text-[#1a1a1a]">
                              {pos.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-4 font-mono-data text-sm text-[#6b7280]">
                              {pos.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                                isPositive
                                  ? 'bg-[#00d09c]/10 text-[#00d09c]'
                                  : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'
                              }`}>
                                {isPositive ? '+' : '-'}{formatINR(Math.abs(pnlValue))}
                              </span>
                            </TableCell>
                            <TableCell className={`py-4 font-mono-data text-sm font-medium ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                              {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Trade Feed ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-[#1a1a1a]">Trade Feed</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#6b7280] hover:text-[#1a1a1a]">
                  <MoreVertical className="size-4" />
                </Button>
              </div>

              {tradesLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="size-8 rounded-full shrink-0 bg-[#f5f5f5]" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32 bg-[#f5f5f5]" />
                        <Skeleton className="h-3 w-48 bg-[#f5f5f5]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-14 rounded-full bg-[#fafafa] flex items-center justify-center mb-4">
                    <Clock className="size-7 text-[#6b7280]/40" />
                  </div>
                  <p className="text-[#1a1a1a] font-semibold text-sm">No activity yet</p>
                  <p className="text-[#6b7280] text-xs mt-1">
                    Your trade history will appear here
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-[#e5e7eb]" />

                  <div className="space-y-6">
                    {displayTrades.slice(0, 5).map((trade) => {
                      const isBuy = trade.tradeDirection === 'BUY'
                      // Determine activity type
                      const isCancelled = trade.order?.status === 'CANCELLED'
                      const isPending = trade.order?.status === 'PENDING'

                      // Choose icon and colors
                      let IconComponent: React.ComponentType<{ className?: string }>
                      let dotBg: string

                      if (isCancelled || isPending) {
                        IconComponent = Hourglass
                        dotBg = 'bg-[#6b7280]'
                      } else if (isBuy) {
                        IconComponent = ShoppingCart
                        dotBg = 'bg-[#00d09c]'
                      } else {
                        IconComponent = ArrowUpFromLine
                        dotBg = 'bg-[#eb5b3c]'
                      }

                      // Label
                      const actionLabel = isCancelled
                        ? `CANCELLED ${trade.symbol}`
                        : isPending
                          ? `PENDING ${trade.symbol}`
                          : isBuy
                            ? `BUY ${trade.symbol}`
                            : `SELL ${trade.symbol}`

                      // Status text
                      const statusText = isCancelled
                        ? 'Cancelled'
                        : isPending
                          ? 'Pending'
                          : 'Executed'

                      return (
                        <div key={trade.id} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className={`absolute left-0 top-1 size-8 rounded-full bg-white border-2 ${dotBg} flex items-center justify-center z-10`}>
                            <div className={`size-2 rounded-full ${dotBg}`} />
                          </div>

                          {/* Content */}
                          <div className="flex flex-col">
                            <div className="flex justify-between items-start">
                              <span className={`font-bold text-sm ${isBuy ? 'text-[#00d09c]' : isCancelled || isPending ? 'text-[#6b7280]' : 'text-[#eb5b3c]'}`}>{actionLabel}</span>
                              <span className="text-[10px] font-semibold text-[#6b7280] uppercase">
                                {formatTimeOfDay(trade.executedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-[#6b7280] mt-0.5">
                              {trade.quantity} Shares @ {formatINR(trade.fillPrice)} • {statusText}
                            </p>
                            {trade.pnl !== null && trade.pnl !== undefined && (
                              <span className={`text-xs font-semibold mt-0.5 ${trade.pnl >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                                P&L: {trade.pnl >= 0 ? '+' : ''}{formatINR(trade.pnl)}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-6 py-2.5 rounded-lg border-[#e5e7eb] text-[#6b7280] text-xs font-semibold hover:bg-[#fafafa] hover:text-[#1a1a1a] transition-all"
                    onClick={() => setCurrentPage('orders')}
                  >
                    VIEW ALL ACTIVITY
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ Quick Actions Row ═════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Smart Analytics */}
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm group hover:shadow-md hover:border-[#00D09C]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-[#00D09C]/10 flex items-center justify-center mb-4 group-hover:bg-[#00D09C]/15 transition-colors">
              <BarChart3 className="size-5 text-[#00D09C]" />
            </div>
            <h3 className="font-semibold text-[#1a1a1a] text-base">Smart Analytics</h3>
            <p className="text-sm text-[#6b7280] mt-1.5 leading-relaxed">
              Get real-time AI-powered analysis of market trends and opportunities.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-[#00D09C] border-[#00D09C]/30 hover:bg-[#00D09C]/8 hover:text-[#00D09C] rounded-lg"
              onClick={() => setCurrentPage('reports')}
            >
              Explore
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Risk Monitor */}
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm group hover:shadow-md hover:border-[#eb5b3c]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-[#eb5b3c]/10 flex items-center justify-center mb-4 group-hover:bg-[#eb5b3c]/15 transition-colors">
              <Shield className="size-5 text-[#eb5b3c]" />
            </div>
            <h3 className="font-semibold text-[#1a1a1a] text-base">Risk Monitor</h3>
            <p className="text-sm text-[#6b7280] mt-1.5 leading-relaxed">
              Monitor your portfolio risk exposure with advanced analytics and alerts.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-[#eb5b3c] border-[#eb5b3c]/30 hover:bg-[#eb5b3c]/8 hover:text-[#eb5b3c] rounded-lg"
              onClick={() => setCurrentPage('reports')}
            >
              Analyze
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Lab */}
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm group hover:shadow-md hover:border-[#00d09c]/30 transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-[#00d09c]/10 flex items-center justify-center mb-4 group-hover:bg-[#00d09c]/15 transition-colors">
              <Zap className="size-5 text-[#00d09c]" />
            </div>
            <h3 className="font-semibold text-[#1a1a1a] text-base">Strategy Lab</h3>
            <p className="text-sm text-[#6b7280] mt-1.5 leading-relaxed">
              Create and backtest custom trading strategies with intuitive tools.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-[#00d09c] border-[#00d09c]/30 hover:bg-[#00d09c]/8 hover:text-[#00d09c] rounded-lg"
              onClick={() => setCurrentPage('optionChain')}
            >
              Build
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ Index Detail Drawer ════════════════════════════════════════════════ */}
      <IndexDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        symbol={selectedIndexSymbol}
      />

      {/* ═══ Floating Action Button - New Trade ════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 md:right-[calc(280px+24px)]">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Button
              className="flex items-center gap-3 px-6 py-3 bg-[#00D09C] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all group font-semibold"
              onClick={() => setCurrentPage('trading')}
            >
              <Plus className="size-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-xs font-semibold tracking-wider uppercase">New Trade</span>
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

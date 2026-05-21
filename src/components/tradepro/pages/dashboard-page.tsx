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
  Rocket,
  Clock,
  ChevronsUp,
  MoreVertical,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
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

const fallbackTrades: TradeData[] = [
  { id: '1', symbol: 'RELIANCE', tradeDirection: 'BUY', segment: 'EQUITY', fillPrice: 2950.00, quantity: 50, totalValue: 147500, brokerage: 73.75, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 120000).toISOString() },
  { id: '2', symbol: 'HDFCBANK', tradeDirection: 'SELL', segment: 'EQUITY', fillPrice: 1420.00, quantity: 100, totalValue: 142000, brokerage: 71, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 900000).toISOString() },
  { id: '3', symbol: 'TCS', tradeDirection: 'BUY', segment: 'EQUITY', fillPrice: 4100.00, quantity: 20, totalValue: 82000, brokerage: 41, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 3600000).toISOString() },
]

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
  const { setCurrentPage } = useAppStore()

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

  // Trades for activity feed
  const displayTrades = trades.length > 0 ? trades : fallbackTrades

  // Greeting
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-tp-surface px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ═══ Market Overview Section ════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            Market Overview
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-tp-secondary-container text-tp-on-secondary-container text-[10px] font-semibold px-2 py-0.5 border-0">
              LIVE
            </Badge>
            <span className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
              NSE - Open
            </span>
          </div>
        </div>

        {/* Index Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {marketLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-tp-surface-container-lowest shadow-md rounded-xl border border-tp-outline-variant/10">
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-28" />
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
                  <Card className="bg-tp-surface-container-lowest shadow-md rounded-xl border border-tp-outline-variant/10 hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase">
                          {index.name || index.symbol}
                        </span>
                        {isPositive ? (
                          <TrendingUp className="size-5 text-tp-secondary group-hover:scale-110 transition-transform" />
                        ) : (
                          <TrendingDown className="size-5 text-tp-tertiary group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold font-mono-data text-tp-on-surface mb-1">
                          {index.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
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
          <Card className="bg-tp-surface shadow-md rounded-xl border-l-4 border-l-tp-primary border-y border-r border-y-tp-outline-variant/10 border-r-tp-outline-variant/10">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-2">
                Total Balance
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-40 mb-2" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                    {formatINRWhole(totalBalance)}
                  </span>
                  <span className="text-xs text-tp-on-surface-variant">
                    .{Math.abs(totalBalance % 1).toFixed(2).substring(2)}
                  </span>
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-32 mt-2" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-tp-secondary">
                  <ChevronsUp className="size-3.5" />
                  <span>{portfolioData.totalReturn >= 0 ? '+' : ''}{portfolioData.totalReturn.toFixed(2)}% from start</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 2 - Today's P&L */}
        <motion.div variants={staggerItem}>
          <Card className="bg-tp-surface shadow-md rounded-xl border-l-4 border-l-tp-secondary border-y border-r border-y-tp-outline-variant/10 border-r-tp-outline-variant/10">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-2">
                Today&apos;s P&amp;L
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-36 mb-2" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold font-mono-data ${dayPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                    {dayPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(dayPnl))}
                  </span>
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-2 w-full mt-3" />
              ) : (
                <div className="mt-3 h-1.5 w-full bg-tp-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${dayPnl >= 0 ? 'bg-tp-secondary' : 'bg-tp-tertiary'}`}
                    style={{ width: `${Math.min(100, Math.max(5, Math.abs(dayPnl / (totalBalance || 1)) * 100 * 10))}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 3 - Win Rate */}
        <motion.div variants={staggerItem}>
          <Card className="bg-tp-surface shadow-md rounded-xl border-l-4 border-l-tp-primary-container border-y border-r border-y-tp-outline-variant/10 border-r-tp-outline-variant/10">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-2">
                Win Rate
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-20 mb-2" />
              ) : (
                <div className="text-2xl font-bold font-mono-data text-tp-on-surface">
                  {winRate.toFixed(0)}%
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-32 mt-2" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-tp-on-surface-variant">
                  <Clock className="size-3.5" />
                  <span>Based on last {totalTrades || 50} trades</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat 4 - Total Trades */}
        <motion.div variants={staggerItem}>
          <Card className="bg-tp-surface shadow-md rounded-xl border-l-4 border-l-tp-outline border-y border-r border-y-tp-outline-variant/10 border-r-tp-outline-variant/10">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase mb-2">
                Total Trades
              </p>
              {portfolioLoading ? (
                <Skeleton className="h-8 w-16 mb-2" />
              ) : (
                <div className="text-2xl font-bold font-mono-data text-tp-on-surface">
                  {totalTrades}
                </div>
              )}
              {portfolioLoading ? (
                <Skeleton className="h-4 w-24 mt-2" />
              ) : (
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-tp-primary">
                  <Rocket className="size-3.5" />
                  <span>{displayPositions.length} open positions</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ═══ Two Column: Open Positions + Activity ═════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Open Positions Table ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="lg:col-span-2"
        >
          <Card className="bg-tp-surface shadow-md rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-tp-on-surface">Open Positions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-tp-primary text-xs font-semibold hover:underline px-0"
                  onClick={() => setCurrentPage('portfolio')}
                >
                  VIEW PORTFOLIO
                </Button>
              </div>

              {positionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : displayPositions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
                    <Briefcase className="size-6 text-tp-on-surface-variant/40" />
                  </div>
                  <p className="text-tp-on-surface-variant font-medium text-sm">No open positions</p>
                  <p className="text-tp-on-surface-variant/60 text-xs mt-1">
                    Start trading to see your positions here
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1.5 bg-tp-primary hover:bg-tp-primary/90"
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
                      <TableRow className="hover:bg-transparent border-b border-tp-outline-variant/30">
                        <TableHead className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase pb-4">
                          Instrument
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase pb-4">
                          LTP
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase pb-4">
                          Avg. Cost
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase pb-4">
                          P&amp;L
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-tp-on-surface-variant tracking-wider uppercase pb-4">
                          Chg %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-tp-outline-variant/10">
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
                            className="hover:bg-tp-surface-container-low transition-colors cursor-pointer"
                          >
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-tp-on-surface">{instrumentLabel}</span>
                                <span className="text-xs text-tp-on-surface-variant">{subLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 font-mono-data text-sm text-tp-on-surface">
                              {pos.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-4 font-mono-data text-sm text-tp-on-surface-variant">
                              {pos.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isPositive
                                  ? 'bg-tp-secondary-container text-tp-on-secondary-container'
                                  : 'bg-tp-error-container text-tp-on-error-container'
                              }`}>
                                {isPositive ? '+' : '-'}{formatINR(Math.abs(pnlValue))}
                              </span>
                            </TableCell>
                            <TableCell className={`py-4 font-mono-data text-sm font-medium ${isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
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

        {/* ── Activity Feed ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Card className="bg-tp-surface shadow-md rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-tp-on-surface">Activity</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-tp-on-surface-variant hover:text-tp-on-surface">
                  <MoreVertical className="size-4" />
                </Button>
              </div>

              {tradesLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="size-8 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-tp-surface-container flex items-center justify-center mb-3">
                    <Clock className="size-6 text-tp-on-surface-variant/40" />
                  </div>
                  <p className="text-tp-on-surface-variant font-medium text-sm">No activity yet</p>
                  <p className="text-tp-on-surface-variant/60 text-xs mt-1">
                    Your trade history will appear here
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-tp-outline-variant/30" />

                  <div className="space-y-6">
                    {displayTrades.slice(0, 5).map((trade) => {
                      const isBuy = trade.tradeDirection === 'BUY'
                      // Determine activity type
                      const isCancelled = trade.order?.status === 'CANCELLED'
                      const isPending = trade.order?.status === 'PENDING'

                      // Choose icon and colors
                      let IconComponent: React.ComponentType<{ className?: string }>
                      let iconBg: string
                      let iconText: string

                      if (isCancelled || isPending) {
                        IconComponent = Hourglass
                        iconBg = 'bg-tp-surface-container-high'
                        iconText = 'text-tp-on-surface-variant'
                      } else if (isBuy) {
                        IconComponent = ShoppingCart
                        iconBg = 'bg-tp-secondary-container'
                        iconText = 'text-tp-on-secondary-container'
                      } else {
                        IconComponent = ArrowUpFromLine
                        iconBg = 'bg-tp-error-container'
                        iconText = 'text-tp-on-error-container'
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
                          <div className={`absolute left-0 top-1 size-8 rounded-full ${iconBg} flex items-center justify-center ${iconText} z-10 border-4 border-tp-surface`}>
                            <IconComponent className="size-3.5" />
                          </div>

                          {/* Content */}
                          <div className="flex flex-col">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-sm text-tp-on-surface">{actionLabel}</span>
                              <span className="text-[10px] font-semibold text-tp-on-surface-variant uppercase">
                                {formatTimeOfDay(trade.executedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-tp-on-surface-variant mt-0.5">
                              {trade.quantity} Shares @ {formatINR(trade.fillPrice)} • {statusText}
                            </p>
                            {trade.pnl !== null && trade.pnl !== undefined && (
                              <span className={`text-xs font-semibold mt-0.5 ${trade.pnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
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
                    className="w-full mt-6 py-2.5 rounded-lg border-tp-outline-variant/30 text-tp-on-surface-variant text-xs font-semibold hover:bg-tp-surface-container-low transition-all"
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
        {/* AI Market Insights */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-tp-primary/10 flex items-center justify-center mb-4 group-hover:bg-tp-primary/20 transition-colors">
              <BarChart3 className="size-5 text-tp-primary" />
            </div>
            <h3 className="font-semibold text-tp-on-surface text-base">AI Market Insights</h3>
            <p className="text-sm text-tp-on-surface-variant mt-1.5 leading-relaxed">
              Get real-time AI-powered analysis of market trends and opportunities.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-tp-primary border-tp-primary/30 hover:bg-tp-primary/10 hover:text-tp-primary spring-interaction"
              onClick={() => setCurrentPage('analytics')}
            >
              Explore
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-tp-tertiary/10 flex items-center justify-center mb-4 group-hover:bg-tp-tertiary/20 transition-colors">
              <Shield className="size-5 text-tp-tertiary" />
            </div>
            <h3 className="font-semibold text-tp-on-surface text-base">Risk Analysis</h3>
            <p className="text-sm text-tp-on-surface-variant mt-1.5 leading-relaxed">
              Monitor your portfolio risk exposure with advanced analytics and alerts.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-tp-tertiary border-tp-tertiary/30 hover:bg-tp-tertiary/10 hover:text-tp-tertiary spring-interaction"
              onClick={() => setCurrentPage('analytics')}
            >
              Analyze
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Builder */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-tp-secondary/10 flex items-center justify-center mb-4 group-hover:bg-tp-secondary/20 transition-colors">
              <Zap className="size-5 text-tp-secondary" />
            </div>
            <h3 className="font-semibold text-tp-on-surface text-base">Strategy Builder</h3>
            <p className="text-sm text-tp-on-surface-variant mt-1.5 leading-relaxed">
              Create and backtest custom trading strategies with intuitive tools.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-tp-secondary border-tp-secondary/30 hover:bg-tp-secondary/10 hover:text-tp-secondary spring-interaction"
              onClick={() => setCurrentPage('optionChain')}
            >
              Build
              <ArrowUpRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ Floating Action Button - New Trade ════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 md:right-[calc(280px+24px)]">
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Button
              className="flex items-center gap-3 px-6 py-3 bg-tp-primary text-tp-on-primary rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all group"
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

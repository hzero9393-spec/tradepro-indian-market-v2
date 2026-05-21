'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Plus,
  ArrowDownToLine,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Target,
  Brain,
  Shield,
  Zap,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

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
    equity: { count: number; invested: number; currentValue: number; unrealizedPnl: number }
    futures: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number }
    options: { count: number; invested: number; currentValue: number; unrealizedPnl: number; marginUsed: number }
  }
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

// ─── Fallback Mock Data ──────────────────────────────────────────────────────

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

const fallbackTrades: TradeData[] = [
  { id: '1', symbol: 'RELIANCE', tradeDirection: 'BUY', segment: 'EQUITY', fillPrice: 2945.30, quantity: 10, totalValue: 29453, brokerage: 20, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 120000).toISOString() },
  { id: '2', symbol: 'TCS', tradeDirection: 'SELL', segment: 'EQUITY', fillPrice: 3812.75, quantity: 5, totalValue: 19063.75, brokerage: 20, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 900000).toISOString() },
  { id: '3', symbol: 'HDFCBANK', tradeDirection: 'BUY', segment: 'EQUITY', fillPrice: 1645.20, quantity: 20, totalValue: 32904, brokerage: 20, pnl: null, pnlPercent: null, executedAt: new Date(Date.now() - 3600000).toISOString() },
]

const fallbackMarketOverview = [
  { name: 'NIFTY 50', value: '22,456.30', change: +0.84, icon: BarChart3 },
  { name: 'SENSEX', value: '74,012.45', change: +1.12, icon: TrendingUp },
  { name: 'BANK NIFTY', value: '48,312.80', change: -0.43, icon: ArrowUpRight },
  { name: 'NIFTY IT', value: '35,624.15', change: +2.15, icon: ArrowUpRight },
  { name: 'NIFTY PHARMA', value: '18,742.60', change: +0.28, icon: Target },
]

const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: '#0058be',
  },
} satisfies ChartConfig

const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value.toFixed(0)}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { token, user } = useAuthStore()
  const [activeRange, setActiveRange] = useState<string>('1M')

  // Data states
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [trades, setTrades] = useState<TradeData[]>([])
  const [marketIndices, setMarketIndices] = useState<IndexData[]>([])

  // Loading states
  const [portfolioLoading, setPortfolioLoading] = useState(true)
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

  // ─── Fetch Trades ────────────────────────────────────────────────
  const fetchTrades = useCallback(async () => {
    if (!token) { setTradesLoading(false); return }
    try {
      setTradesLoading(true)
      const res = await fetch('/api/trade/trades?limit=5', {
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
        setMarketIndices([])
      }
    } catch {
      setMarketIndices([])
    } finally {
      setMarketLoading(false)
    }
  }, [])

  // ─── Load all data on mount ──────────────────────────────────────
  useEffect(() => {
    fetchPortfolio()
    fetchTrades()
    fetchMarketIndices()
  }, [fetchPortfolio, fetchTrades, fetchMarketIndices])

  // ─── Derived values ──────────────────────────────────────────────
  const portfolioData = portfolio ?? fallbackPortfolio
  const portfolioValue = portfolioData.totalPortfolioValue
  const totalReturn = portfolioData.totalReturn
  const dayPnl = portfolioData.totalUnrealizedPnl + portfolioData.totalRealizedPnl
  const openPositions = portfolioData.openPositionsCount
  const winRate = user?.winRate ?? 0

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // ─── Portfolio Performance Chart Data ────────────────────────────
  // Use generated data around the real portfolio value
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const base = portfolioValue * 0.92
    const trend = (portfolioValue - base) * (i / 29)
    const noise = (Math.sin(i * 0.8) * portfolioValue * 0.008) + (Math.cos(i * 1.3) * portfolioValue * 0.004)
    return {
      day: i + 1,
      date: new Date(2026, 2, i + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(base + trend + noise),
    }
  })

  // ─── Market Overview items ───────────────────────────────────────
  const marketOverviewItems = marketIndices.length > 0
    ? marketIndices.map((idx) => ({
        name: idx.name || idx.symbol,
        value: idx.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: idx.changePercent,
        icon: idx.changePercent >= 0 ? TrendingUp : TrendingDown,
        isPositive: idx.changePercent >= 0,
      }))
    : fallbackMarketOverview.map((item) => ({
        ...item,
        isPositive: item.change >= 0,
      }))

  const displayTrades = trades.length > 0 ? trades : fallbackTrades

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'Trader'}!
          </h1>
          <p className="text-tp-on-surface-variant mt-1 text-sm">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 spring-interaction">
            <Plus className="size-4" />
            New Trade
          </Button>
          <Button variant="outline" className="gap-2 spring-interaction">
            <ArrowDownToLine className="size-4" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* ── Key Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {/* Portfolio Value */}
        <Card className="glass-card border-l-4 border-l-tp-primary rounded-xl shadow-sm py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tp-on-surface-variant">Portfolio Value</p>
              <div className="size-8 rounded-lg bg-tp-primary/10 flex items-center justify-center">
                <Briefcase className="size-4 text-tp-primary" />
              </div>
            </div>
            {portfolioLoading ? (
              <Skeleton className="h-9 w-40 mt-2" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
                {formatINR(portfolioValue)}
              </p>
            )}
            {portfolioLoading ? (
              <Skeleton className="h-4 w-28 mt-2" />
            ) : (
              <div className="flex items-center gap-1.5 mt-2">
                {totalReturn >= 0 ? (
                  <ArrowUpRight className="size-3.5 text-tp-secondary" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-tp-tertiary" />
                )}
                <span className={`text-sm font-medium ${totalReturn >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                </span>
                <span className="text-xs text-tp-on-surface-variant">overall return</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's P&L */}
        <Card className="glass-card border-l-4 border-l-tp-secondary rounded-xl shadow-sm py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tp-on-surface-variant">Today&apos;s P&amp;L</p>
              <div className="size-8 rounded-lg bg-tp-secondary/10 flex items-center justify-center">
                <TrendingUp className="size-4 text-tp-secondary" />
              </div>
            </div>
            {portfolioLoading ? (
              <Skeleton className="h-9 w-36 mt-2" />
            ) : (
              <p className={`text-2xl sm:text-3xl font-bold font-mono-data mt-2 ${dayPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                {dayPnl >= 0 ? '+' : '-'}{formatINR(Math.abs(dayPnl))}
              </p>
            )}
            {portfolioLoading ? (
              <Skeleton className="h-4 w-24 mt-2" />
            ) : (
              <div className="flex items-center gap-1.5 mt-2">
                {dayPnl >= 0 ? (
                  <ArrowUpRight className="size-3.5 text-tp-secondary" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-tp-tertiary" />
                )}
                <span className={`text-sm font-medium ${dayPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'}`}>
                  {portfolioValue > 0 ? `${dayPnl >= 0 ? '+' : ''}${((dayPnl / portfolioValue) * 100).toFixed(2)}%` : '0.00%'}
                </span>
                <span className="text-xs text-tp-on-surface-variant">today</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Positions */}
        <Card className="glass-card border-l-4 border-l-tp-outline-variant rounded-xl shadow-sm py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tp-on-surface-variant">Open Positions</p>
              <div className="size-8 rounded-lg bg-tp-outline-variant/20 flex items-center justify-center">
                <Target className="size-4 text-tp-on-surface-variant" />
              </div>
            </div>
            {portfolioLoading ? (
              <Skeleton className="h-9 w-12 mt-2" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
                {openPositions}
              </p>
            )}
            {portfolioLoading ? (
              <Skeleton className="h-4 w-24 mt-2" />
            ) : (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-sm text-tp-on-surface-variant">
                  {openPositions > 0
                    ? `across ${[portfolioData.segments.equity.count > 0, portfolioData.segments.futures.count > 0, portfolioData.segments.options.count > 0].filter(Boolean).length} segment${[portfolioData.segments.equity.count > 0, portfolioData.segments.futures.count > 0, portfolioData.segments.options.count > 0].filter(Boolean).length !== 1 ? 's' : ''}`
                    : 'no active positions'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="glass-card border-l-4 border-l-tp-secondary rounded-xl shadow-sm py-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-tp-on-surface-variant">Win Rate</p>
              <div className="size-8 rounded-lg bg-tp-secondary/10 flex items-center justify-center">
                <Shield className="size-4 text-tp-secondary" />
              </div>
            </div>
            {portfolioLoading ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
                {winRate.toFixed(1)}%
              </p>
            )}
            {portfolioLoading ? (
              <Skeleton className="h-2 w-full mt-3" />
            ) : (
              <div className="mt-3">
                <Progress value={winRate} className="h-2 bg-tp-secondary/20" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Portfolio Performance Chart ─────────────────────────────────── */}
      <Card className="glass-card rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-tp-on-surface">
                Portfolio Performance
              </CardTitle>
              <div className="flex items-center gap-3 mt-1.5">
                {portfolioLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                    {formatINRCompact(portfolioValue)}
                  </span>
                )}
                {portfolioLoading ? (
                  <Skeleton className="h-5 w-16" />
                ) : (
                  <Badge
                    variant="secondary"
                    className={`gap-1 border-0 text-xs font-medium ${
                      totalReturn >= 0
                        ? 'bg-tp-secondary/10 text-tp-secondary'
                        : 'bg-tp-tertiary/10 text-tp-tertiary'
                    }`}
                  >
                    {totalReturn >= 0 ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={activeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs font-medium"
                  onClick={() => setActiveRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer config={chartConfig} className="h-[280px] sm:h-[320px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0058be" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0058be" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                tickFormatter={(value: number) =>
                  `₹${(value / 100000).toFixed(1)}L`
                }
                domain={['dataMin - 10000', 'dataMax + 10000']}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono-data font-semibold">
                        ₹{Number(value).toLocaleString('en-IN')}
                      </span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0058be"
                strokeWidth={2.5}
                fill="url(#fillValue)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── Two Column: Recent Trades + Market Overview ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Recent Trades Table */}
        <Card className="glass-card rounded-xl shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-tp-on-surface">
                Recent Trades
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-tp-primary text-xs gap-1">
                View All
                <ArrowRight className="size-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : displayTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="size-10 text-tp-on-surface-variant/40 mb-3" />
                <p className="text-tp-on-surface-variant font-medium">No trades yet</p>
                <p className="text-tp-on-surface-variant/70 text-sm mt-1">
                  Start trading to see your recent activity here
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Symbol
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Type
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Price
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      P&amp;L
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTrades.map((trade) => {
                    const isBuy = trade.tradeDirection === 'BUY'
                    const pnl = trade.pnl
                    return (
                      <TableRow
                        key={trade.id}
                        className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50"
                      >
                        <TableCell>
                          <div>
                            <span className="font-semibold text-tp-on-surface">{trade.symbol}</span>
                            {trade.segment !== 'EQUITY' && (
                              <span className="ml-1.5 text-[10px] text-tp-on-surface-variant uppercase bg-tp-surface-container/60 px-1.5 py-0.5 rounded">
                                {trade.segment}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              isBuy
                                ? 'bg-tp-secondary/10 text-tp-secondary border-0 text-xs font-semibold gap-1'
                                : 'bg-tp-tertiary/10 text-tp-tertiary border-0 text-xs font-semibold gap-1'
                            }
                          >
                            {isBuy ? (
                              <ArrowDownRight className="size-3" />
                            ) : (
                              <ArrowUpRight className="size-3" />
                            )}
                            {isBuy ? 'Buy' : 'Sell'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono-data text-tp-on-surface">
                          ₹{trade.fillPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell
                          className={`font-mono-data font-medium ${
                            pnl === null
                              ? 'text-tp-on-surface-variant'
                              : pnl >= 0
                                ? 'text-tp-secondary'
                                : 'text-tp-tertiary'
                          }`}
                        >
                          {pnl === null
                            ? '—'
                            : `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </TableCell>
                        <TableCell className="text-tp-on-surface-variant text-right text-xs">
                          {formatRelativeTime(trade.executedAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Market Overview */}
        <Card className="glass-card rounded-xl shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-tp-on-surface">
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-lg" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {marketOverviewItems.map((item) => {
                  const Icon = 'icon' in item ? (item as { icon: React.ComponentType<{ className?: string }> }).icon : (item.isPositive ? TrendingUp : TrendingDown)
                  const isPositive = item.isPositive
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-tp-surface-container-low/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center ${
                            isPositive ? 'bg-tp-secondary/10' : 'bg-tp-tertiary/10'
                          }`}
                        >
                          <Icon
                            className={`size-4 ${
                              isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'
                            }`}
                          />
                        </div>
                        <span className="font-medium text-sm text-tp-on-surface">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-data text-sm font-semibold text-tp-on-surface">
                          {item.value}
                        </p>
                        <p
                          className={`text-xs font-medium flex items-center justify-end gap-0.5 ${
                            isPositive ? 'text-tp-secondary' : 'text-tp-tertiary'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="size-3" />
                          ) : (
                            <ArrowDownRight className="size-3" />
                          )}
                          {isPositive ? '+' : ''}
                          {item.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
        {/* AI Market Insights */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="size-10 rounded-xl bg-tp-primary/10 flex items-center justify-center mb-4 group-hover:bg-tp-primary/20 transition-colors">
              <Brain className="size-5 text-tp-primary" />
            </div>
            <h3 className="font-semibold text-tp-on-surface text-base">AI Market Insights</h3>
            <p className="text-sm text-tp-on-surface-variant mt-1.5 leading-relaxed">
              Get real-time AI-powered analysis of market trends and opportunities.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 text-tp-primary border-tp-primary/30 hover:bg-tp-primary/10 hover:text-tp-primary spring-interaction"
            >
              Explore
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-shadow">
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
            >
              Analyze
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Strategy Builder */}
        <Card className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-shadow">
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
            >
              Build
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Upgrade Banner ──────────────────────────────────────────────── */}
      <Card className="rounded-xl shadow-sm overflow-hidden border-0">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-r from-tp-primary via-tp-primary/90 to-tp-secondary px-6 py-8 sm:px-10 sm:py-10">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 size-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 right-1/4 size-24 bg-white/5 rounded-full translate-y-1/2" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Optimize Your Strategy
                </h2>
                <p className="text-white/80 mt-1.5 text-sm sm:text-base max-w-lg leading-relaxed">
                  Upgrade to TradePro Premium for AI-powered insights, advanced risk management, and
                  unlimited strategy backtesting.
                </p>
              </div>
              <Button className="bg-white text-tp-primary hover:bg-white/90 font-semibold gap-2 spring-interaction shrink-0 shadow-lg">
                Upgrade Now
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

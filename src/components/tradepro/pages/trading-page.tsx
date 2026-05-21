'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Area,
  Bar,
  ComposedChart,
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CandlestickChart,
  Newspaper,
  Clock,
  Radio,
  Loader2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

// ─── Types ────────────────────────────────────────────────────────────────

interface TradeableStock {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  sector: string
  lotSize: number
  isFnoBan: boolean
  isFuturesAvailable: boolean
  isOptionsAvailable: boolean
  volume: number
  marketCap: number
  week52High: number
  week52Low: number
  peRatio: number | null
}

interface Position {
  id: string
  segment: string
  productType: string
  tradeDirection: string
  symbol: string
  quantity: number
  entryPrice: number
  currentPrice: number
  totalInvested: number
  currentValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  marginUsed: number
  isOpen: boolean
  createdAt: string
}

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
  initialCapital: number
  openPositionsCount: number
}

// ─── Static Data ──────────────────────────────────────────────────────────

const marketNews = [
  { title: 'RBI Holds Repo Rate Steady at 6.5%', source: 'ET Markets', time: '12m ago', icon: Radio },
  { title: 'NIFTY 50 Hits All-Time High on FII Inflows', source: 'Moneycontrol', time: '34m ago', icon: TrendingUp },
  { title: 'SEBI Tightens F&O Margin Rules for Retail Traders', source: 'NDTV Profit', time: '1h ago', icon: CandlestickChart },
]

const chartConfig = {
  price: { label: 'Price', color: '#0058be' },
  volume: { label: 'Volume', color: '#c2c6d6' },
} satisfies ChartConfig

const timeRanges = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as const

// ─── Helpers ──────────────────────────────────────────────────────────────

function generateChartData(basePrice: number) {
  return Array.from({ length: 48 }, (_, i) => {
    const range = basePrice * 0.01 // ~1% range
    const trend = (i / 48) * range
    const noise = Math.sin(i * 0.5) * (range * 0.3) + Math.cos(i * 0.8) * (range * 0.2)
    const open = basePrice - range * 0.5 + trend + noise
    const close = open + (Math.random() - 0.45) * (range * 0.4)
    const high = Math.max(open, close) + Math.random() * (range * 0.15)
    const low = Math.min(open, close) - Math.random() * (range * 0.15)
    const volume = Math.round(2000000 + Math.random() * 3000000)
    const hour = Math.floor(i / 4)
    const minute = (i % 4) * 15
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      price: Math.round(close * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
      barValue: close >= open ? volume : -volume,
    }
  })
}

function calculateBrokerage(totalValue: number): number {
  const brokeragePercent = 0.0005 // 0.05%
  const calculated = totalValue * brokeragePercent
  return Math.max(20, Math.min(500, Math.round(calculated * 100) / 100))
}

function generateSparkline(basePrice: number, changePercent: number): number[] {
  const points: number[] = []
  const startPrice = basePrice / (1 + changePercent / 100)
  for (let i = 0; i < 6; i++) {
    const progress = i / 5
    const noise = (Math.random() - 0.5) * basePrice * 0.003
    points.push(startPrice + (basePrice - startPrice) * progress + noise)
  }
  return points
}

// ─── Mini Sparkline Component ─────────────────────────────────────────────

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 60
  const h = 24
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#006c49' : '#b61722'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────

export function TradingPage() {
  const { token, user } = useAuthStore()

  // ── State ─────────────────────────────────────────────────────────────
  const [stocks, setStocks] = useState<TradeableStock[]>([])
  const [selectedStock, setSelectedStock] = useState<TradeableStock | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)

  const [loadingStocks, setLoadingStocks] = useState(true)
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [squaringOff, setSquaringOff] = useState<string | null>(null)

  const [activeRange, setActiveRange] = useState<string>('15m')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('MARKET')
  const [productType, setProductType] = useState('INTRADAY')
  const [quantity, setQuantity] = useState(10)
  const [price, setPrice] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Chart Data ────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const base = selectedStock?.currentPrice ?? 1000
    return generateChartData(base)
  }, [selectedStock?.currentPrice])

  // ── Estimated Total & Brokerage ───────────────────────────────────────
  const estimatedTotal = useMemo(() => {
    const p = orderType === 'MARKET'
      ? (selectedStock?.currentPrice ?? 0)
      : (parseFloat(price) || 0)
    return quantity * p
  }, [quantity, price, orderType, selectedStock?.currentPrice])

  const estimatedBrokerage = useMemo(() => {
    return calculateBrokerage(estimatedTotal)
  }, [estimatedTotal])

  // ── Fetch Stocks ──────────────────────────────────────────────────────
  const fetchStocks = useCallback(async () => {
    if (!token) return
    setLoadingStocks(true)
    try {
      const res = await fetch('/api/trade/stocks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setStocks(data.data)
        // Default to first stock if none selected
        if (data.data.length > 0 && !selectedStock) {
          setSelectedStock(data.data[0])
        }
      } else {
        toast.error('Failed to load stocks')
      }
    } catch {
      toast.error('Network error loading stocks')
    } finally {
      setLoadingStocks(false)
    }
  }, [token])

  // ── Fetch Positions ───────────────────────────────────────────────────
  const fetchPositions = useCallback(async () => {
    if (!token) return
    setLoadingPositions(true)
    try {
      const res = await fetch('/api/trade/positions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setPositions(data.data)
      } else {
        toast.error('Failed to load positions')
      }
    } catch {
      toast.error('Network error loading positions')
    } finally {
      setLoadingPositions(false)
    }
  }, [token])

  // ── Fetch Portfolio ───────────────────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/trade/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        setPortfolio(data.data)
      }
    } catch {
      // Silent fail for portfolio - non-critical
    }
  }, [token])

  // ── Refresh All After Trade ───────────────────────────────────────────
  const refreshAfterTrade = useCallback(async () => {
    await Promise.all([fetchPositions(), fetchPortfolio()])
  }, [fetchPositions, fetchPortfolio])

  // ── Place Order ───────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!token || !selectedStock) return

    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      toast.error('Please enter a valid price for LIMIT orders')
      return
    }

    if (quantity <= 0) {
      toast.error('Quantity must be at least 1')
      return
    }

    setPlacingOrder(true)
    try {
      const body: Record<string, unknown> = {
        symbol: selectedStock.symbol,
        direction: orderSide === 'buy' ? 'BUY' : 'SELL',
        orderType: orderType,
        segment: 'EQUITY',
        productType: productType,
        quantity: quantity,
      }

      if (orderType === 'LIMIT' && price) {
        body.price = parseFloat(price)
      }

      const res = await fetch('/api/trade/place', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const direction = orderSide === 'buy' ? 'BUY' : 'SELL'
        toast.success(
          `${direction} ${quantity} ${selectedStock.symbol} @ ₹${orderType === 'MARKET' ? selectedStock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : parseFloat(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          {
            description: `Order filled successfully • Brokerage: ₹${estimatedBrokerage.toLocaleString('en-IN')}`,
          }
        )
        // Refresh data
        await refreshAfterTrade()
      } else {
        toast.error(data.error || 'Failed to place order', {
          description: 'Please check your balance and try again.',
        })
      }
    } catch {
      toast.error('Network error placing order')
    } finally {
      setPlacingOrder(false)
    }
  }

  // ── Square Off ────────────────────────────────────────────────────────
  const handleSquareOff = async (positionId: string, symbol: string) => {
    if (!token) return

    setSquaringOff(positionId)
    try {
      const res = await fetch('/api/trade/square-off', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positionId }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const closedPos = data.closedPosition
        const pnlStr = closedPos
          ? `P&L: ${closedPos.realizedPnl >= 0 ? '+' : ''}₹${Math.abs(closedPos.realizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          : ''
        toast.success(`Squared off ${symbol}`, {
          description: pnlStr,
        })
        await refreshAfterTrade()
      } else {
        toast.error(data.error || 'Failed to square off position')
      }
    } catch {
      toast.error('Network error squaring off position')
    } finally {
      setSquaringOff(null)
    }
  }

  // ── Select Stock Handler ──────────────────────────────────────────────
  const handleSelectStock = (stock: TradeableStock) => {
    setSelectedStock(stock)
    // Reset price when changing stock
    setPrice(stock.currentPrice.toFixed(2))
  }

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  // Set initial price when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      setPrice(selectedStock.currentPrice.toFixed(2))
    }
  }, [selectedStock])

  // ── Filtered Watchlist ────────────────────────────────────────────────
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks
    const q = searchQuery.toLowerCase()
    return stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    )
  }, [stocks, searchQuery])

  // ── Available Balance ─────────────────────────────────────────────────
  const availableBalance = portfolio?.virtualBalance ?? user?.virtualBalance ?? 0
  const buyingPower = portfolio?.availableMargin ?? ((user?.virtualBalance ?? 0) - (user?.marginUsed ?? 0))

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            Trading Terminal
          </h1>
          <p className="text-tp-on-surface-variant mt-1 text-sm">
            Execute trades and monitor instruments in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-outline" />
            <Input
              placeholder="Search instruments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-48 sm:w-64 bg-tp-surface-container-lowest border-tp-outline-variant/40 text-sm"
            />
          </div>
          <div className="flex items-center rounded-lg border border-tp-outline-variant/40 bg-tp-surface-container-lowest p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Watchlist Bar ───────────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
        {loadingStocks ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glass-card rounded-xl shadow-sm shrink-0 w-[180px] animate-pulse">
              <CardContent className="p-3 sm:p-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-6 bg-muted rounded w-28 mb-2" />
                <div className="h-6 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))
        ) : filteredStocks.length === 0 ? (
          <div className="flex items-center justify-center w-full py-8 text-tp-on-surface-variant text-sm">
            {searchQuery ? 'No stocks match your search.' : 'No tradeable stocks found.'}
          </div>
        ) : (
          filteredStocks.map((stock) => {
            const isPositive = stock.changePercent >= 0
            const isSelected = selectedStock?.symbol === stock.symbol
            const sparkline = generateSparkline(stock.currentPrice, stock.changePercent)
            return (
              <Card
                key={stock.symbol}
                className={`glass-card rounded-xl shadow-sm shrink-0 w-[180px] hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                  isSelected ? 'ring-2 ring-tp-primary/50' : ''
                }`}
                style={{
                  borderLeftColor: isPositive ? '#006c49' : '#b61722',
                }}
                onClick={() => handleSelectStock(stock)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-tp-on-surface">{stock.symbol}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold border-0 gap-0.5 px-1.5 py-0 ${
                        isPositive
                          ? 'bg-tp-secondary/10 text-tp-secondary'
                          : 'bg-tp-tertiary/10 text-tp-tertiary'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="size-2.5" />
                      ) : (
                        <ArrowDownRight className="size-2.5" />
                      )}
                      {isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </Badge>
                  </div>
                  <p className="font-mono-data text-lg font-semibold text-tp-on-surface">
                    ₹{stock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2">
                    <MiniSparkline data={sparkline} positive={isPositive} />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* ── Main Trading Panel ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Chart Area - Left 3/5 */}
        <Card className="glass-card rounded-xl shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {selectedStock ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold text-tp-on-surface">
                        {selectedStock.symbol}
                      </CardTitle>
                      <span className="text-sm text-tp-on-surface-variant">{selectedStock.name}</span>
                      <Badge
                        variant="secondary"
                        className={`gap-0.5 border-0 text-[10px] font-semibold ${
                          selectedStock.changePercent >= 0
                            ? 'bg-tp-secondary/10 text-tp-secondary'
                            : 'bg-tp-tertiary/10 text-tp-tertiary'
                        }`}
                      >
                        {selectedStock.changePercent >= 0 ? (
                          <ArrowUpRight className="size-2.5" />
                        ) : (
                          <ArrowDownRight className="size-2.5" />
                        )}
                        {selectedStock.changePercent >= 0 ? '+' : ''}
                        {selectedStock.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                        ₹{selectedStock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-sm font-medium ${
                        selectedStock.changePercent >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                      }`}>
                        {selectedStock.changePercent >= 0 ? '+' : ''}
                        ₹{selectedStock.change.toLocaleString('en-IN', { minimumFractionDigits: 2 })} today
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-lg font-semibold text-tp-on-surface">
                      Select a Stock
                    </CardTitle>
                    <p className="text-sm text-tp-on-surface-variant mt-1">
                      Click on a stock from the watchlist to view its chart.
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                {timeRanges.map((range) => (
                  <Button
                    key={range}
                    variant={activeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2.5 text-xs font-medium"
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {/* Price Chart */}
            <ChartContainer config={chartConfig} className="h-[260px] sm:h-[300px] w-full">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058be" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0058be" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={10}
                  interval={7}
                />
                <YAxis
                  yAxisId="price"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={10}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value: number) => `₹${value.toFixed(0)}`}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={false}
                  domain={[0, 'dataMax']}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <span className="font-mono-data font-semibold">
                          {name === 'price' ? `₹${Number(value).toFixed(2)}` : Number(value).toLocaleString('en-IN')}
                        </span>
                      )}
                    />
                  }
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke="#0058be"
                  strokeWidth={2}
                  fill="url(#fillPrice)"
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#c2c6d6"
                  opacity={0.3}
                  barSize={4}
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Panel - Right 2/5 */}
        <Card className="glass-card rounded-xl shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-tp-on-surface">
              Place Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Stock Indicator */}
            {selectedStock && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-tp-surface-container-low/80 border border-tp-outline-variant/20">
                <span className="font-bold text-sm text-tp-primary">{selectedStock.symbol}</span>
                <span className="text-xs text-tp-on-surface-variant">•</span>
                <span className="text-xs text-tp-on-surface-variant truncate">{selectedStock.name}</span>
                <span className="ml-auto font-mono-data text-sm font-semibold text-tp-on-surface">
                  ₹{selectedStock.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Buy/Sell Toggle */}
            <div className="flex rounded-lg bg-muted/50 p-1">
              <Button
                variant={orderSide === 'buy' ? 'default' : 'ghost'}
                className={`flex-1 h-9 text-sm font-semibold ${
                  orderSide === 'buy'
                    ? 'bg-tp-secondary text-white hover:bg-tp-secondary/90'
                    : 'text-tp-on-surface-variant'
                }`}
                onClick={() => setOrderSide('buy')}
              >
                Buy
              </Button>
              <Button
                variant={orderSide === 'sell' ? 'default' : 'ghost'}
                className={`flex-1 h-9 text-sm font-semibold ${
                  orderSide === 'sell'
                    ? 'bg-tp-tertiary text-white hover:bg-tp-tertiary/90'
                    : 'text-tp-on-surface-variant'
                }`}
                onClick={() => setOrderSide('sell')}
              >
                Sell
              </Button>
            </div>

            {/* Order Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                Order Type
              </label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="w-full h-9 bg-tp-surface-container-lowest border-tp-outline-variant/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKET">Market</SelectItem>
                  <SelectItem value="LIMIT">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                Product Type
              </label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="w-full h-9 bg-tp-surface-container-lowest border-tp-outline-variant/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTRADAY">Intraday</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 border-tp-outline-variant/40"
                  onClick={() => setQuantity(Math.max(1, quantity - 10))}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 text-center font-mono-data bg-tp-surface-container-lowest border-tp-outline-variant/40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 border-tp-outline-variant/40"
                  onClick={() => setQuantity(quantity + 10)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Price (for limit orders) */}
            {orderType === 'LIMIT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                  Limit Price
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-9 font-mono-data bg-tp-surface-container-lowest border-tp-outline-variant/40"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Total & Brokerage */}
            <div className="rounded-lg bg-tp-surface-container-low/80 p-3 border border-tp-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-tp-on-surface-variant">Estimated Total</span>
                <span className="font-mono-data text-lg font-bold text-tp-on-surface">
                  ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Est. Brokerage (0.05%)</span>
                <span className="font-mono-data text-xs font-medium text-tp-on-surface-variant">
                  ₹{estimatedBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Total (incl. brokerage)</span>
                <span className="font-mono-data text-xs font-semibold text-tp-on-surface">
                  ₹{(estimatedTotal + estimatedBrokerage).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className={`w-full h-11 text-sm font-semibold spring-interaction ${
                orderSide === 'buy'
                  ? 'bg-tp-secondary hover:bg-tp-secondary/90 text-white'
                  : 'bg-tp-tertiary hover:bg-tp-tertiary/90 text-white'
              }`}
              onClick={handlePlaceOrder}
              disabled={placingOrder || !selectedStock}
            >
              {placingOrder ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                orderSide === 'buy' ? 'Place Buy Order' : 'Place Sell Order'
              )}
            </Button>

            {!selectedStock && (
              <p className="text-xs text-tp-tertiary text-center">
                Select a stock from the watchlist to trade
              </p>
            )}

            {/* Account Stats */}
            <div className="space-y-2 pt-2 border-t border-tp-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Available Balance</span>
                <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                  ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Buying Power</span>
                <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                  ₹{Math.max(0, buyingPower).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Open Positions ──────────────────────────────────────────────── */}
      <Card className="glass-card rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-tp-on-surface">
              Open Positions
            </CardTitle>
            <Badge variant="secondary" className="bg-tp-primary/10 text-tp-primary border-0 text-xs font-semibold">
              {positions.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPositions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-tp-on-surface-variant" />
              <span className="ml-2 text-sm text-tp-on-surface-variant">Loading positions...</span>
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-tp-on-surface-variant">
              <Newspaper className="size-8 mb-2 opacity-40" />
              <p className="text-sm">No open positions. Place a trade to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Symbol
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Side
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                      Segment
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      Qty
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      Avg Price
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      CMP
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      P&amp;L
                    </TableHead>
                    <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => {
                    const isLong = pos.tradeDirection === 'BUY'
                    return (
                      <TableRow
                        key={pos.id}
                        className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50"
                      >
                        <TableCell className="font-bold text-tp-primary text-sm">
                          {pos.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold border-0 gap-0.5 ${
                              isLong
                                ? 'bg-tp-secondary/10 text-tp-secondary'
                                : 'bg-tp-tertiary/10 text-tp-tertiary'
                            }`}
                          >
                            {isLong ? (
                              <ArrowUpRight className="size-2.5" />
                            ) : (
                              <ArrowDownRight className="size-2.5" />
                            )}
                            {isLong ? 'Long' : 'Short'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-tp-on-surface-variant">
                          {pos.segment}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          {pos.quantity}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">
                          ₹{pos.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          ₹{pos.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell
                          className={`font-mono-data text-sm font-semibold text-right ${
                            pos.unrealizedPnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                          }`}
                        >
                          {pos.unrealizedPnl >= 0 ? '+' : ''}₹{Math.abs(pos.unrealizedPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold border-tp-tertiary/40 text-tp-tertiary hover:bg-tp-tertiary/10 hover:text-tp-tertiary gap-1"
                            onClick={() => handleSquareOff(pos.id, pos.symbol)}
                            disabled={squaringOff === pos.id}
                          >
                            {squaringOff === pos.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            Square Off
                          </Button>
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

      {/* ── Market News ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
        {marketNews.map((news, idx) => {
          const Icon = news.icon
          return (
            <Card
              key={idx}
              className="glass-card rounded-xl shadow-sm group hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-lg bg-tp-primary/10 flex items-center justify-center shrink-0 group-hover:bg-tp-primary/20 transition-colors">
                    <Icon className="size-4 text-tp-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-tp-on-surface leading-snug line-clamp-2">
                      {news.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-medium text-tp-primary">{news.source}</span>
                      <span className="text-tp-outline-variant">·</span>
                      <span className="text-[11px] text-tp-on-surface-variant flex items-center gap-0.5">
                        <Clock className="size-2.5" />
                        {news.time}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

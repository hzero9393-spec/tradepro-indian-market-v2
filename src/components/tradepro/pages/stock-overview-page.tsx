'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Loader2,
  BarChart3,
  ShoppingCart,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { useTradeSuccess } from '@/components/tradepro/trade-success-popup'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────

interface StockDetail {
  symbol: string
  name: string
  sector: string
  industry: string
  exchange: string
  currentPrice: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  previousClose: number
  volume: number
  week52High: number
  week52Low: number
  marketCap: number
  peRatio: number | null
  eps: number
  dividendYield: number
  pbRatio: number
  roe: number
  bookValue: number
  debtToEquity: number
  faceValue: number
  industryPE: number
  lotSize: number
  isFuturesAvailable: boolean
  isOptionsAvailable: boolean
  isFnoBan: boolean
  isRealData?: boolean
}

interface SimilarStock {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  sector: string
}

interface CandleData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type RangeOption = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'
type OverviewTab = 'overview' | 'technicals' | 'news'

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatLargeNumber(value: number): string {
  if (!value) return '--'
  if (value >= 10000000) return '₹' + (value / 10000000).toFixed(2) + ' Cr'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(2) + ' L'
  return formatINRWhole(value)
}

function formatVolume(vol: number): string {
  if (vol >= 10000000) return (vol / 10000000).toFixed(2) + ' Cr'
  if (vol >= 100000) return (vol / 100000).toFixed(2) + ' L'
  if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K'
  return vol.toLocaleString('en-IN')
}

function formatDate(dateStr: string, range: RangeOption): string {
  const d = new Date(dateStr)
  if (range === '1D') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (range === '1W') return d.toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
  if (range === '1M' || range === '3M') return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function calculateBrokerage(totalValue: number): number {
  const calculated = totalValue * 0.0005
  return Math.max(20, Math.min(500, Math.round(calculated * 100) / 100))
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, range }: { active?: boolean; payload?: Array<{ payload: CandleData }>; range: RangeOption }) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const isUp = d.close >= d.open

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 shadow-xl text-xs">
      <div className="font-semibold text-[#1a1a1a] mb-1.5">{formatDate(d.date, range)}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-[#6b7280]">Open</span>
        <span className="font-mono text-right">{d.open.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-[#6b7280]">High</span>
        <span className="font-mono text-right">{d.high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-[#6b7280]">Low</span>
        <span className="font-mono text-right">{d.low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-[#6b7280]">Close</span>
        <span className={`font-mono text-right font-semibold ${isUp ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
          {d.close.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        {d.volume > 0 && (
          <>
            <span className="text-[#6b7280]">Volume</span>
            <span className="font-mono text-right">{formatVolume(d.volume)}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Range Bar Component (Groww-style) ────────────────────────────────────

function RangeBar({ label, low, high, current, lowLabel, highLabel }: {
  label: string
  low: number
  high: number
  current: number
  lowLabel?: string
  highLabel?: string
}) {
  const range = high - low
  const position = range > 0 ? Math.min(100, Math.max(0, ((current - low) / range) * 100)) : 50

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6b7280]">{lowLabel || label + ' Low'}</span>
        <span className="text-xs text-[#6b7280]">{highLabel || label + ' High'}</span>
      </div>
      <div className="flex items-center justify-between text-sm font-mono font-semibold">
        <span className="text-[#eb5b3c]">{low.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        <span className="text-[#00d09c]">{high.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
      </div>
      <div className="h-2 rounded-full bg-[#f0f2f5] relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: '100%',
            background: 'linear-gradient(to right, #eb5b3c, #00d09c)',
            opacity: 0.25,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 size-3 bg-[#00d09c] border-2 border-white rounded-full shadow-sm z-10"
          style={{ left: `calc(${position}% - 6px)` }}
        />
      </div>
    </div>
  )
}

// ─── Metric Row Component ─────────────────────────────────────────────────

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#f0f2f5] last:border-b-0">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <span className={`text-sm font-semibold font-mono ${
        highlight === 'green' ? 'text-[#00d09c]' : highlight === 'red' ? 'text-[#eb5b3c]' : 'text-[#1a1a1a]'
      }`}>{value}</span>
    </div>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fb] transition-colors"
      >
        <span className="text-sm font-semibold text-[#1a1a1a]">{title}</span>
        {open ? (
          <ChevronUp className="size-4 text-[#6b7280]" />
        ) : (
          <ChevronDown className="size-4 text-[#6b7280]" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export function StockOverviewPage() {
  const { token, user } = useAuthStore()
  const { selectedStockSymbol, setCurrentPage, navigateToStock } = useAppStore()
  const { showTradeSuccess } = useTradeSuccess()

  // State
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null)
  const [similarStocks, setSimilarStocks] = useState<SimilarStock[]>([])
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [range, setRange] = useState<RangeOption>('1M')
  const [overviewTab, setOverviewTab] = useState<OverviewTab>('overview')
  const [detailLoading, setDetailLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  // Trade modal state
  const [showTradePanel, setShowTradePanel] = useState(false)
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('MARKET')
  const [productType, setProductType] = useState('INTRADAY')
  const [quantity, setQuantity] = useState(10)
  const [price, setPrice] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)

  // Fetch stock detail
  const fetchDetail = useCallback(async () => {
    if (!selectedStockSymbol) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/stocks/detail/${selectedStockSymbol}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setStockDetail(json.data)
          setSimilarStocks(json.similarStocks || [])
        }
      }
    } catch {
      // Keep previous data
    } finally {
      setDetailLoading(false)
    }
  }, [selectedStockSymbol])

  // Fetch chart data
  const fetchChart = useCallback(async () => {
    if (!selectedStockSymbol) return
    setChartLoading(true)
    try {
      const basePrice = stockDetail?.currentPrice || 1500
      const res = await fetch(`/api/stocks/chart/${selectedStockSymbol}?range=${range}&basePrice=${basePrice}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) setChartData(json.data || [])
      }
    } catch {
      // Keep previous data
    } finally {
      setChartLoading(false)
    }
  }, [selectedStockSymbol, range, stockDetail?.currentPrice])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  // Auto-refresh detail every 30s
  useEffect(() => {
    const interval = setInterval(fetchDetail, 30000)
    return () => clearInterval(interval)
  }, [fetchDetail])

  // Set price when stock changes
  useEffect(() => {
    if (stockDetail) {
      setPrice(stockDetail.currentPrice.toFixed(2))
    }
  }, [stockDetail?.currentPrice])

  // Derived
  const isPositive = stockDetail ? stockDetail.change >= 0 : true
  const gradientId = `stock-gradient-${selectedStockSymbol}`

  const chartDataFormatted = useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      dateLabel: formatDate(d.date, range),
    }))
  }, [chartData, range])

  const chartMinMax = useMemo(() => {
    if (chartDataFormatted.length === 0) return { min: 0, max: 0 }
    const prices = chartDataFormatted.flatMap((d) => [d.high, d.low])
    return {
      min: Math.min(...prices) * 0.999,
      max: Math.max(...prices) * 1.001,
    }
  }, [chartDataFormatted])

  // Order calculations
  const estimatedTotal = useMemo(() => {
    const p = orderType === 'MARKET'
      ? (stockDetail?.currentPrice ?? 0)
      : (parseFloat(price) || 0)
    return quantity * p
  }, [quantity, price, orderType, stockDetail?.currentPrice])

  const estimatedBrokerage = useMemo(() => {
    return calculateBrokerage(estimatedTotal)
  }, [estimatedTotal])

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!token || !stockDetail) return

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
        symbol: stockDetail.symbol,
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
        const fillPrice = orderType === 'MARKET' ? stockDetail.currentPrice : parseFloat(price)
        toast.success(
          `${direction} ${quantity} ${stockDetail.symbol} @ ${formatINR(fillPrice)}`,
          {
            description: `Order filled successfully • Brokerage: ${formatINR(estimatedBrokerage)}`,
          }
        )
        showTradeSuccess({
          symbol: stockDetail.symbol,
          type: direction,
          qty: quantity,
          price: fillPrice,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
          orderId: data.order?.id?.slice(-8).toUpperCase() || 'N/A',
          segment: 'EQUITY',
          totalValue: data.order?.totalValue,
          brokerage: data.order?.brokerage,
        })
        setShowTradePanel(false)
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

  // ─── Loading state ──────────────────────────────────────────────
  if (detailLoading && !stockDetail) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32 bg-[#f0f0f5]" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-[#f0f0f5]" />
            <Skeleton className="h-6 w-36 bg-[#f0f0f5]" />
          </div>
          <Skeleton className="h-[300px] w-full bg-[#f0f0f5] rounded-xl" />
          <Skeleton className="h-40 w-full bg-[#f0f0f5] rounded-xl" />
          <Skeleton className="h-60 w-full bg-[#f0f0f5] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!stockDetail) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
          <p className="text-[#1a1a1a] font-semibold">Stock not found</p>
          <Button
            className="mt-4 bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-lg"
            onClick={() => setCurrentPage('trading')}
          >
            Back to Stocks
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* ═══ Sticky Header ═════════════════════════════════════════════ */}
      <div className="sticky top-14 z-30 bg-white border-b border-[#e5e7eb]">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage('trading')}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-[#f5f7fa] text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-[#1a1a1a]">{stockDetail.name}</h1>
                  <span className="text-[10px] font-bold bg-[#f5f7fa] text-[#6b7280] px-2 py-0.5 rounded-md">
                    {stockDetail.exchange}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-[#1a1a1a]">
                    {stockDetail.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`flex items-center gap-0.5 text-sm font-semibold ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {isPositive ? '+' : ''}{stockDetail.change.toFixed(2)} ({isPositive ? '+' : ''}{stockDetail.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stockDetail.isFuturesAvailable && (
                <Badge variant="outline" className="text-[10px] font-bold border-[#00D09C]/30 text-[#00D09C]">
                  F&O
                </Badge>
              )}
              {stockDetail.isFnoBan && (
                <Badge variant="outline" className="text-[10px] font-bold border-[#eb5b3c]/30 text-[#eb5b3c]">
                  F&O BAN
                </Badge>
              )}
              <Button
                className="bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-lg gap-1.5"
                size="sm"
                onClick={() => { setOrderSide('buy'); setShowTradePanel(true) }}
              >
                <ShoppingCart className="size-4" />
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center gap-1">
            {(['overview', 'technicals', 'news'] as OverviewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setOverviewTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all ${
                  overviewTab === tab
                    ? 'text-[#00D09C] border-[#00D09C]'
                    : 'text-[#6b7280] border-transparent hover:text-[#1a1a1a]'
                }`}
              >
                {tab}
              </button>
            ))}
            {stockDetail.isFuturesAvailable && (
              <button
                onClick={() => navigateToStock(stockDetail.symbol)}
                className="px-4 py-2.5 text-sm font-semibold text-[#6b7280] border-b-2 border-transparent hover:text-[#1a1a1a] ml-auto"
              >
                F&O
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Main Content ═════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ─── Chart Section ────────────────────────────────────────── */}
          {overviewTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Chart Card */}
              <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-5">
                  {/* Range Selector */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mr-2">NSE</span>
                      {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as RangeOption[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRange(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            range === r
                              ? 'bg-[#00D09C] text-white shadow-sm'
                              : 'text-[#6b7280] hover:bg-[#f5f7fa] hover:text-[#1a1a1a]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="rounded-xl overflow-hidden">
                    {chartLoading ? (
                      <div className="h-[280px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="size-2 rounded-full bg-[#00D09C] animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="size-2 rounded-full bg-[#00D09C] animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="size-2 rounded-full bg-[#00D09C] animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-[#6b7280]">Loading chart...</span>
                        </div>
                      </div>
                    ) : chartDataFormatted.length > 0 ? (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartDataFormatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? '#00d09c' : '#eb5b3c'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isPositive ? '#00d09c' : '#eb5b3c'} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                            <XAxis
                              dataKey="dateLabel"
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              axisLine={{ stroke: 'rgba(128,128,128,0.2)' }}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              domain={[chartMinMax.min, chartMinMax.max]}
                              tick={{ fontSize: 10, fill: '#6b7280' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              width={60}
                            />
                            <Tooltip content={<CustomTooltip range={range} />} />
                            <Area
                              type="monotone"
                              dataKey="close"
                              stroke={isPositive ? '#00d09c' : '#eb5b3c'}
                              strokeWidth={2}
                              fill={`url(#${gradientId})`}
                              dot={false}
                              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-[#6b7280] text-sm">
                        No chart data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ─── Performance Section ────────────────────────────────── */}
              <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#1a1a1a]">Performance</h3>
                    <Info className="size-3.5 text-[#6b7280]" />
                  </div>

                  {/* Today's Range */}
                  {stockDetail.low > 0 && stockDetail.high > 0 && (
                    <RangeBar
                      label="Today's"
                      low={stockDetail.low}
                      high={stockDetail.high}
                      current={stockDetail.currentPrice}
                      lowLabel="Today's Low"
                      highLabel="Today's High"
                    />
                  )}

                  {/* 52 Week Range */}
                  {stockDetail.week52Low > 0 && stockDetail.week52High > 0 && (
                    <RangeBar
                      label="52 Week"
                      low={stockDetail.week52Low}
                      high={stockDetail.week52High}
                      current={stockDetail.currentPrice}
                      lowLabel="52 Week Low"
                      highLabel="52 Week High"
                    />
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Open Price</p>
                      <p className="text-sm font-bold font-mono text-[#1a1a1a] mt-1">
                        {stockDetail.open > 0 ? stockDetail.open.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Prev. Close</p>
                      <p className="text-sm font-bold font-mono text-[#1a1a1a] mt-1">
                        {stockDetail.previousClose > 0 ? stockDetail.previousClose.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Volume</p>
                      <p className="text-sm font-bold font-mono text-[#1a1a1a] mt-1">
                        {stockDetail.volume > 0 ? formatVolume(stockDetail.volume) : '--'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ─── Fundamentals Section ─────────────────────────────── */}
              <CollapsibleSection title="Fundamentals" defaultOpen={true}>
                <div className="grid grid-cols-2 gap-x-6">
                  <MetricRow label="Mkt Cap" value={formatLargeNumber(stockDetail.marketCap)} />
                  <MetricRow label="ROE" value={stockDetail.roe ? `${stockDetail.roe.toFixed(2)}%` : '--'} highlight={stockDetail.roe > 15 ? 'green' : stockDetail.roe < 10 ? 'red' : undefined} />
                  <MetricRow label="P/E Ratio (TTM)" value={stockDetail.peRatio ? stockDetail.peRatio.toFixed(2) : '--'} />
                  <MetricRow label="EPS (TTM)" value={stockDetail.eps ? `₹${stockDetail.eps.toFixed(2)}` : '--'} />
                  <MetricRow label="P/B Ratio" value={stockDetail.pbRatio ? stockDetail.pbRatio.toFixed(2) : '--'} />
                  <MetricRow label="Div Yield" value={stockDetail.dividendYield ? `${(stockDetail.dividendYield * 100).toFixed(2)}%` : '--'} highlight={stockDetail.dividendYield > 0 ? 'green' : undefined} />
                  <MetricRow label="Industry P/E" value={stockDetail.industryPE ? stockDetail.industryPE.toFixed(2) : '--'} />
                  <MetricRow label="Book Value" value={stockDetail.bookValue ? `₹${stockDetail.bookValue.toFixed(2)}` : '--'} />
                  <MetricRow label="Debt to Equity" value={stockDetail.debtToEquity ? stockDetail.debtToEquity.toFixed(2) : '--'} highlight={stockDetail.debtToEquity > 1 ? 'red' : stockDetail.debtToEquity > 0 ? 'green' : undefined} />
                  <MetricRow label="Face Value" value={stockDetail.faceValue ? `₹${stockDetail.faceValue.toFixed(0)}` : '--'} />
                </div>
                <p className="text-xs text-[#6b7280] mt-3 flex items-center gap-1">
                  <Info className="size-3" />
                  Understand Fundamentals
                </p>
              </CollapsibleSection>

              {/* ─── About Section ─────────────────────────────────────── */}
              <CollapsibleSection title={`About ${stockDetail.name}`}>
                <div className="space-y-2 text-sm text-[#6b7280] leading-relaxed">
                  <p><span className="font-medium text-[#1a1a1a]">Sector:</span> {stockDetail.sector}</p>
                  {stockDetail.industry && <p><span className="font-medium text-[#1a1a1a]">Industry:</span> {stockDetail.industry}</p>}
                  <p><span className="font-medium text-[#1a1a1a]">Exchange:</span> {stockDetail.exchange}</p>
                  <p><span className="font-medium text-[#1a1a1a]">Lot Size:</span> {stockDetail.lotSize}</p>
                  <p><span className="font-medium text-[#1a1a1a]">F&O Available:</span> {stockDetail.isFuturesAvailable || stockDetail.isOptionsAvailable ? 'Yes' : 'No'}</p>
                </div>
              </CollapsibleSection>

              {/* ─── Similar Stocks ─────────────────────────────────────── */}
              {similarStocks.length > 0 && (
                <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-[#1a1a1a]">Similar Stocks</h3>
                      <span className="text-xs text-[#6b7280] flex items-center gap-1">
                        <BarChart3 className="size-3" />
                        Market Price
                      </span>
                    </div>
                    <div className="space-y-0">
                      {similarStocks.map((stock) => {
                        const stockPositive = stock.changePercent >= 0
                        return (
                          <button
                            key={stock.symbol}
                            onClick={() => navigateToStock(stock.symbol)}
                            className="w-full flex items-center justify-between py-3 border-b border-[#f0f2f5] last:border-b-0 hover:bg-[#f8f9fb] transition-colors px-1 rounded-lg"
                          >
                            <div className="text-left">
                              <p className="text-sm font-semibold text-[#1a1a1a]">{stock.name}</p>
                              <p className="text-xs text-[#6b7280]">{stock.symbol}</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-sm font-bold font-mono text-[#1a1a1a]">
                                {stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                                stockPositive ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'
                              }`}>
                                {stockPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ─── Bottom Buy Button (Mobile) ──────────────────────────── */}
              <div className="lg:hidden sticky bottom-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white border-t border-[#e5e7eb]">
                <Button
                  className="w-full h-12 bg-[#00D09C] hover:bg-[#00b88a] text-white font-bold rounded-xl text-base gap-2"
                  onClick={() => { setOrderSide('buy'); setShowTradePanel(true) }}
                >
                  <ShoppingCart className="size-5" />
                  Buy {stockDetail.symbol}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Technicals Tab ──────────────────────────────────────── */}
          {overviewTab === 'technicals' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                    <Activity className="size-4 text-[#00D09C]" />
                    Technical Indicators
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6">
                    <MetricRow label="RSI (14)" value="--" />
                    <MetricRow label="MACD" value="--" />
                    <MetricRow label="SMA 20" value="--" />
                    <MetricRow label="SMA 50" value="--" />
                    <MetricRow label="EMA 20" value="--" />
                    <MetricRow label="EMA 50" value="--" />
                    <MetricRow label="Bollinger Upper" value="--" />
                    <MetricRow label="Bollinger Lower" value="--" />
                  </div>
                  <p className="text-xs text-[#6b7280] mt-4 flex items-center gap-1">
                    <Info className="size-3" />
                    Technical indicators will be available with real market data integration
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── News Tab ────────────────────────────────────────────── */}
          {overviewTab === 'news' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="size-14 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                    <TrendingUp className="size-7 text-[#6b7280]/40" />
                  </div>
                  <p className="text-[#1a1a1a] font-semibold text-sm">No news available</p>
                  <p className="text-[#6b7280] text-xs mt-1">
                    News feed for {stockDetail.name} will appear here
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* ═══ Trade Panel Overlay ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showTradePanel && stockDetail && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowTradePanel(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-lg mx-auto">
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-[#e5e7eb]" />
                </div>

                <div className="px-6 pb-8 space-y-5">
                  {/* Stock Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-[#00D09C]">{stockDetail.symbol}</span>
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isPositive ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'
                        }`}>
                          {isPositive ? '+' : ''}{stockDetail.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-0.5 truncate max-w-[200px]">{stockDetail.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-[#1a1a1a]">
                        {formatINR(stockDetail.currentPrice)}
                      </span>
                      <p className={`text-xs font-medium ${isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                        {isPositive ? '+' : ''}{formatINR(stockDetail.change)} today
                      </p>
                    </div>
                  </div>

                  {/* Buy/Sell Toggle */}
                  <div className="flex rounded-xl bg-[#f5f7fa] p-1">
                    <button
                      className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${
                        orderSide === 'buy' ? 'bg-[#00d09c] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                      }`}
                      onClick={() => setOrderSide('buy')}
                    >
                      Buy
                    </button>
                    <button
                      className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${
                        orderSide === 'sell' ? 'bg-[#eb5b3c] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                      }`}
                      onClick={() => setOrderSide('sell')}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Order Type & Product Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Order Type</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full h-9 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#1a1a1a] px-3 focus:outline-none focus:ring-2 focus:ring-[#00D09C]/20 focus:border-[#00D09C]"
                      >
                        <option value="MARKET">Market</option>
                        <option value="LIMIT">Limit</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Product</label>
                      <select
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                        className="w-full h-9 rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#1a1a1a] px-3 focus:outline-none focus:ring-2 focus:ring-[#00D09C]/20 focus:border-[#00D09C]"
                      >
                        <option value="INTRADAY">Intraday</option>
                        <option value="DELIVERY">Delivery</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f7fa] hover:text-[#1a1a1a] transition-colors"
                        onClick={() => setQuantity(Math.max(1, quantity - 10))}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-9 text-center font-mono border-[#e5e7eb] bg-white text-[#1a1a1a] focus:ring-[#00D09C]/20 focus:border-[#00D09C]"
                      />
                      <button
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f7fa] hover:text-[#1a1a1a] transition-colors"
                        onClick={() => setQuantity(quantity + 10)}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Limit Price */}
                  {orderType === 'LIMIT' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">Limit Price</label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-9 font-mono border-[#e5e7eb] bg-white text-[#1a1a1a] focus:ring-[#00D09C]/20 focus:border-[#00D09C]"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="rounded-xl bg-[#f5f7fa] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b7280]">Estimated Total</span>
                      <span className="font-mono text-lg font-bold text-[#1a1a1a]">{formatINR(estimatedTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6b7280]">Est. Brokerage (0.05%)</span>
                      <span className="font-mono text-[10px] font-medium text-[#6b7280]">{formatINR(estimatedBrokerage)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#e5e7eb]">
                      <span className="text-[10px] text-[#6b7280]">Total (incl. brokerage)</span>
                      <span className="font-mono text-xs font-bold text-[#1a1a1a]">{formatINR(estimatedTotal + estimatedBrokerage)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className={`w-full h-12 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      orderSide === 'buy'
                        ? 'bg-[#00d09c] hover:bg-[#00b888] active:scale-[0.98]'
                        : 'bg-[#eb5b3c] hover:bg-[#d14e31] active:scale-[0.98]'
                    }`}
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                  >
                    {placingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Placing Order...
                      </span>
                    ) : (
                      orderSide === 'buy' ? `Buy ${stockDetail.symbol}` : `Sell ${stockDetail.symbol}`
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

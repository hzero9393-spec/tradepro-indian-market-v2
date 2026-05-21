'use client'

import { useState, useMemo } from 'react'
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
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const watchlist = [
  { symbol: 'AAPL', price: 191.04, change: 0.8, trend: [188, 189, 190, 189.5, 190.5, 191] },
  { symbol: 'TSLA', price: 238.45, change: 2.1, trend: [232, 234, 236, 235, 237, 238] },
  { symbol: 'NVDA', price: 874.12, change: -0.5, trend: [880, 878, 876, 877, 875, 874] },
  { symbol: 'BTC', price: 68410, change: 3.2, trend: [66200, 66800, 67100, 67500, 68000, 68410] },
  { symbol: 'ETH', price: 3452, change: -1.1, trend: [3500, 3490, 3480, 3470, 3460, 3452] },
  { symbol: 'MSFT', price: 425.22, change: 0.4, trend: [422, 423, 423.5, 424, 424.5, 425.22] },
]

const chartData = Array.from({ length: 48 }, (_, i) => {
  const base = 186
  const trend = (i / 48) * 5
  const noise = Math.sin(i * 0.5) * 2 + Math.cos(i * 0.8) * 1.5
  const open = base + trend + noise
  const close = open + (Math.random() - 0.45) * 2.5
  const high = Math.max(open, close) + Math.random() * 1.2
  const low = Math.min(open, close) - Math.random() * 1.2
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

const openPositions = [
  { symbol: 'AAPL', side: 'Long' as const, qty: 150, avgPrice: 185.20, cmp: 191.04, pnl: +876.00 },
  { symbol: 'TSLA', side: 'Long' as const, qty: 80, avgPrice: 230.50, cmp: 238.45, pnl: +636.00 },
  { symbol: 'NVDA', side: 'Short' as const, qty: 30, avgPrice: 882.00, cmp: 874.12, pnl: +236.40 },
  { symbol: 'ETH/USD', side: 'Long' as const, qty: 5, avgPrice: 3520.00, cmp: 3452.00, pnl: -340.00 },
]

const marketNews = [
  { title: 'Fed Signals Rate Pause Through Q2', source: 'Reuters', time: '12m ago', icon: Radio },
  { title: 'Tech Earnings Beat Expectations', source: 'Bloomberg', time: '34m ago', icon: TrendingUp },
  { title: 'Crypto Rally Continues as BTC Hits $68K', source: 'CoinDesk', time: '1h ago', icon: CandlestickChart },
]

const chartConfig = {
  price: { label: 'Price', color: '#0058be' },
  volume: { label: 'Volume', color: '#c2c6d6' },
} satisfies ChartConfig

const timeRanges = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as const

// ─── Mini Sparkline Component ─────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function TradingPage() {
  const [activeRange, setActiveRange] = useState<string>('15m')
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState('market')
  const [quantity, setQuantity] = useState(100)
  const [price, setPrice] = useState('191.04')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const total = useMemo(() => {
    const qty = quantity
    const p = orderType === 'market' ? 191.04 : parseFloat(price) || 0
    return qty * p
  }, [quantity, price, orderType])

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
        {watchlist.map((item) => {
          const isPositive = item.change >= 0
          return (
            <Card
              key={item.symbol}
              className="glass-card rounded-xl shadow-sm shrink-0 w-[180px] hover:shadow-md transition-shadow cursor-pointer border-l-4"
              style={{
                borderLeftColor: isPositive ? '#006c49' : '#b61722',
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-tp-on-surface">{item.symbol}</span>
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
                    {item.change}%
                  </Badge>
                </div>
                <p className="font-mono-data text-lg font-semibold text-tp-on-surface">
                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2">
                  <MiniSparkline data={item.trend} positive={isPositive} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Main Trading Panel ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Chart Area - Left 3/5 */}
        <Card className="glass-card rounded-xl shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-tp-on-surface">
                    AAPL
                  </CardTitle>
                  <span className="text-sm text-tp-on-surface-variant">Apple Inc.</span>
                  <Badge
                    variant="secondary"
                    className="gap-0.5 bg-tp-secondary/10 text-tp-secondary border-0 text-[10px] font-semibold"
                  >
                    <ArrowUpRight className="size-2.5" />
                    +0.80%
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                    $191.04
                  </span>
                  <span className="text-sm text-tp-secondary font-medium">+$1.52 today</span>
                </div>
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
                  tickFormatter={(value: number) => `$${value.toFixed(0)}`}
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
                          {name === 'price' ? `$${Number(value).toFixed(2)}` : Number(value).toLocaleString()}
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
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop-loss">Stop Loss</SelectItem>
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

            {/* Price (for limit/stop orders) */}
            {orderType !== 'market' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-tp-on-surface-variant uppercase tracking-wider">
                  Price
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

            {/* Total */}
            <div className="rounded-lg bg-tp-surface-container-low/80 p-3 border border-tp-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-tp-on-surface-variant">Estimated Total</span>
                <span className="font-mono-data text-lg font-bold text-tp-on-surface">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            >
              {orderSide === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
            </Button>

            {/* Account Stats */}
            <div className="space-y-2 pt-2 border-t border-tp-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Available Balance</span>
                <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                  $268,502.40
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tp-on-surface-variant">Buying Power</span>
                <span className="font-mono-data text-sm font-semibold text-tp-on-surface">
                  $500,000.00
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
              {openPositions.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {openPositions.map((pos) => (
                  <TableRow
                    key={pos.symbol}
                    className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50"
                  >
                    <TableCell className="font-bold text-tp-primary text-sm">
                      {pos.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold border-0 gap-0.5 ${
                          pos.side === 'Long'
                            ? 'bg-tp-secondary/10 text-tp-secondary'
                            : 'bg-tp-tertiary/10 text-tp-tertiary'
                        }`}
                      >
                        {pos.side === 'Long' ? (
                          <ArrowUpRight className="size-2.5" />
                        ) : (
                          <ArrowDownRight className="size-2.5" />
                        )}
                        {pos.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                      {pos.qty}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">
                      ${pos.avgPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                      ${pos.cmp.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`font-mono-data text-sm font-semibold text-right ${
                        pos.pnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                      }`}
                    >
                      {pos.pnl >= 0 ? '+' : ''}${Math.abs(pos.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

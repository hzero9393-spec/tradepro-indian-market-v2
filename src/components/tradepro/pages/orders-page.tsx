'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ClipboardList,
  IndianRupee,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { formatINR, formatPnL } from '@/lib/format'
import { DateFilter, DatePreset, filterByDateRange, getDateRange } from '@/components/tradepro/ui/date-filter'

// ─── Initialize date range (default to 'all' so no orders are hidden) ──
const allRange = getDateRange('all')

// ─── Types ───────────────────────────────────────────────────────

interface OrderData {
  id: string
  symbol: string
  orderType: string
  tradeDirection: string
  segment: string
  productType: string
  quantity: number
  price: number
  fillPrice: number | null
  totalValue: number
  brokerage: number
  status: string
  optionType?: string | null
  strikePrice?: number | null
  rejectReason: string | null
  placedAt: string
  filledAt: string | null
  cancelledAt: string | null
  createdAt: string
}

interface TradeData {
  id: string
  symbol: string
  tradeDirection: string
  segment: string
  productType: string
  quantity: number
  fillPrice: number
  totalValue: number
  brokerage: number
  pnl: number | null
  pnlPercent: number | null
  optionType?: string | null
  strikePrice?: number | null
  executedAt: string
  order?: {
    status: string
  }
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatShortDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ', ' + formatTime(isoDate)
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    PARTIALLY_FILLED: 'bg-[#00D09C]/10 text-[#00D09C] border-[#00D09C]/20',
    FILLED: 'bg-[#00B386]/10 text-[#00B386] border-[#00B386]/20',
    CANCELLED: 'bg-[#EB5B3C]/10 text-[#EB5B3C] border-[#eb5b3c]/20',
    REJECTED: 'bg-[#EB5B3C]/10 text-[#EB5B3C] border-[#eb5b3c]/20',
    EXPIRED: 'bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/20',
  }
  return (
    <Badge variant="outline" className={`text-[10px] font-bold ${variants[status] || 'bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/20'}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

// ─── Component ───────────────────────────────────────────────────

export function OrdersPage() {
  const { token } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [trades, setTrades] = useState<TradeData[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingTrades, setLoadingTrades] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('open')

  // ─── Date Filter State ──────────────────────────────────────
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [dateFrom, setDateFrom] = useState<string | null>(allRange.from)
  const [dateTo, setDateTo] = useState<string | null>(allRange.to)
  const [customFromInput, setCustomFromInput] = useState<string | null>(null)
  const [customToInput, setCustomToInput] = useState<string | null>(null)

  // ─── Build query string with date params ────────────────────
  const buildQueryString = useCallback((basePath: string) => {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    return `${basePath}?${params.toString()}`
  }, [dateFrom, dateTo])

  // ─── Fetch Orders ────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!token) { setLoadingOrders(false); return }
    try {
      setFetchError(null)
      const res = await fetch(buildQueryString('/api/trade/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setOrders(json.data || [])
      } else {
        const json = await res.json().catch(() => ({}))
        const errMsg = json.error || `Failed to fetch orders (${res.status})`
        setFetchError(errMsg)
        toast.error(errMsg)
      }
    } catch {
      const errMsg = 'Network error fetching orders. Please check your connection.'
      setFetchError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoadingOrders(false)
    }
  }, [token, buildQueryString])

  // ─── Fetch Trades ────────────────────────────────────────
  const fetchTrades = useCallback(async () => {
    if (!token) { setLoadingTrades(false); return }
    try {
      const res = await fetch(buildQueryString('/api/trade/trades'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrades(json.data || [])
      } else {
        const json = await res.json().catch(() => ({}))
        console.error('[OrdersPage] Trades fetch failed:', res.status, json.error)
      }
    } catch {
      console.error('[OrdersPage] Trades fetch network error')
    } finally {
      setLoadingTrades(false)
    }
  }, [token, buildQueryString])

  useEffect(() => {
    fetchOrders()
    fetchTrades()
    // Auto-refresh every 30 seconds to show new orders after trades
    const interval = setInterval(() => {
      fetchOrders()
      fetchTrades()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders, fetchTrades])

  // ─── Client-side date filtering (for data already fetched) ──
  const filteredOrders = useMemo(() =>
    filterByDateRange(orders, 'placedAt', dateFrom, dateTo),
    [orders, dateFrom, dateTo]
  )

  const filteredTrades = useMemo(() =>
    filterByDateRange(trades, 'executedAt', dateFrom, dateTo),
    [trades, dateFrom, dateTo]
  )

  // ─── Split orders: All Orders and Trade History ──
  const allOrders = filteredOrders // Show ALL orders (not just pending)

  // Stats (based on filtered data)
  const filledCount = filteredOrders.filter(o => o.status === 'FILLED').length
  const totalVolume = filteredTrades.reduce((s, t) => s + t.totalValue, 0)

  // ─── Date Filter Handler ────────────────────────────────────
  const handleDateChange = useCallback((preset: DatePreset, from: string | null, to: string | null) => {
    setDatePreset(preset)
    setDateFrom(from)
    setDateTo(to)

    // Store raw date inputs for custom mode
    if (preset === 'custom') {
      // customFromInput/customToInput are managed by the component directly
    } else {
      setCustomFromInput(null)
      setCustomToInput(null)
    }
  }, [])

  // ─── All Orders Table ───────────────────────────────────
  const AllOrdersTable = () => {
    if (allOrders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
            <FileText className="size-7 text-[#6b7280]/40" />
          </div>
          {fetchError ? (
            <>
              <p className="text-[#EB5B3C] font-semibold text-sm">Failed to load orders</p>
              <p className="text-[#6b7280] text-xs mt-1.5">{fetchError}</p>
              <Button
                size="sm"
                className="mt-5 gap-1.5 bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-lg"
                onClick={() => { fetchOrders(); fetchTrades(); }}
              >
                Retry
              </Button>
            </>
          ) : (
            <>
              <p className="text-[#1a1a1a] font-semibold text-sm">No orders yet</p>
              <p className="text-[#6b7280] text-xs mt-1.5">
                Your orders will appear here after you place a trade
              </p>
            </>
          )}
          {!fetchError && (
          <Button
            size="sm"
            className="mt-5 gap-1.5 bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-lg"
            onClick={() => setCurrentPage('trading')}
          >
            <TrendingUp className="size-3.5" />
            Place Order
          </Button>
          )}
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#e5e7eb]">
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Symbol</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Type</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Segment</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">Fill Price</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">Qty</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">Value</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Status</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e5e7eb]">
            {allOrders.map((order) => {
              const isBuy = order.tradeDirection === 'BUY'
              return (
                <TableRow
                  key={order.id}
                  className="hover:bg-[#f8f9fb] transition-colors"
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#1a1a1a]">{order.symbol}</span>
                      {order.optionType && order.strikePrice && (
                        <span className="text-[10px] text-[#6b7280]">
                          {order.strikePrice} {order.optionType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        isBuy
                          ? 'bg-[#00B386]/10 text-[#00B386]'
                          : 'bg-[#EB5B3C]/10 text-[#EB5B3C]'
                      }`}
                    >
                      {isBuy ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                      {order.tradeDirection}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-[#6b7280] py-4">{order.segment}</TableCell>
                  <TableCell className="font-mono-data font-tabular text-sm text-right text-[#1a1a1a] py-4">
                    {formatINR(order.fillPrice || order.price)}
                  </TableCell>
                  <TableCell className="font-mono-data font-tabular text-sm text-right text-[#1a1a1a] py-4">
                    {order.quantity}
                  </TableCell>
                  <TableCell className="font-mono-data font-tabular text-sm text-right text-[#1a1a1a] py-4">
                    {formatINR(order.totalValue)}
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1 text-xs text-[#6b7280]">
                      <Clock className="size-3" />
                      {formatShortDateTime(order.placedAt)}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ─── Trade History Table ─────────────────────────────────
  const TradeHistoryTable = () => {
    if (filteredTrades.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
            <FileText className="size-7 text-[#6b7280]/40" />
          </div>
          <p className="text-[#1a1a1a] font-semibold text-sm">No trade history</p>
          <p className="text-[#6b7280] text-xs mt-1.5">
            Your executed trades will appear here
          </p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-[#e5e7eb]">
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Symbol</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Type</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">Fill Price</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">Qty</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb] text-right">P&amp;L</TableHead>
              <TableHead className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase py-3 bg-[#f8f9fb]">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e5e7eb]">
            {filteredTrades.map((trade) => {
              const isPositive = (trade.pnl ?? 0) >= 0
              return (
                <TableRow key={trade.id} className="hover:bg-[#f8f9fb] transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#1a1a1a]">{trade.symbol}</span>
                      {trade.optionType && trade.strikePrice && (
                        <span className="text-[10px] text-[#6b7280]">
                          {trade.strikePrice} {trade.optionType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        trade.tradeDirection === 'BUY'
                          ? 'bg-[#00B386]/10 text-[#00B386]'
                          : 'bg-[#EB5B3C]/10 text-[#EB5B3C]'
                      }`}
                    >
                      {trade.tradeDirection === 'BUY' ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                      {trade.tradeDirection}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono-data font-tabular text-sm text-right text-[#1a1a1a] py-4">
                    {formatINR(trade.fillPrice)}
                  </TableCell>
                  <TableCell className="font-mono-data font-tabular text-sm text-right text-[#1a1a1a] py-4">
                    {trade.quantity}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {trade.pnl !== null ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold font-tabular ${
                        isPositive
                          ? 'bg-[#00B386]/10 text-[#00B386]'
                          : 'bg-[#EB5B3C]/10 text-[#EB5B3C]'
                      }`}>
                        {formatPnL(trade.pnl!)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#6b7280]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1 text-xs text-[#6b7280]">
                      <Clock className="size-3" />
                      {formatShortDateTime(trade.executedAt)}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
          Orders
        </h1>
        <p className="text-[#6b7280] mt-1 text-sm">
          View your open orders and complete trade execution history.
        </p>
      </motion.div>

      {/* ── Date Filter ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <CardContent className="p-4">
            <DateFilter
              value={datePreset}
              customFrom={customFromInput}
              customTo={customToInput}
              onChange={handleDateChange}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Grid ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Orders', value: String(filteredOrders.length), icon: ClipboardList, borderColor: 'border-l-[#00D09C]', iconBg: 'bg-[#00D09C]/10', iconColor: 'text-[#00D09C]' },
          { label: 'Filled', value: String(filledCount), icon: CheckCircle2, borderColor: 'border-l-[#00B386]', iconBg: 'bg-[#00B386]/10', iconColor: 'text-[#00B386]' },
          { label: 'Cancelled', value: String(filteredOrders.filter(o => o.status === 'CANCELLED' || o.status === 'REJECTED').length), icon: XCircle, borderColor: 'border-l-[#eb5b3c]', iconBg: 'bg-[#EB5B3C]/10', iconColor: 'text-[#EB5B3C]' },
          { label: 'Total Volume', value: totalVolume >= 100000 ? `₹${(totalVolume / 100000).toFixed(1)}L` : `₹${totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: IndianRupee, borderColor: 'border-l-[#00D09C]', iconBg: 'bg-[#00D09C]/10', iconColor: 'text-[#00D09C]' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`bg-white border border-[#e5e7eb] border-l-4 ${stat.borderColor} rounded-xl shadow-sm`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    {stat.label}
                  </p>
                  <div className={`size-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-lg font-bold font-tabular text-[#1a1a1a]">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* ── Orders Table with Tabs ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-5">
                <TabsList className="bg-[#f5f7fa] border border-[#e5e7eb] p-1 rounded-lg">
                  <TabsTrigger
                    value="open"
                    className="text-xs font-semibold px-4 py-1.5 rounded-md data-[state=active]:bg-[#00D09C] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#6b7280] transition-all"
                  >
                    All Orders
                    <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{allOrders.length}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="text-xs font-semibold px-4 py-1.5 rounded-md data-[state=active]:bg-[#00D09C] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#6b7280] transition-all"
                  >
                    Trade History
                    <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{filteredTrades.length}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {loadingOrders || loadingTrades ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20 bg-[#f0f0f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f0f0f5]" />
                      <Skeleton className="h-4 w-16 bg-[#f0f0f5]" />
                      <Skeleton className="h-4 w-20 bg-[#f0f0f5]" />
                      <Skeleton className="h-4 w-20 bg-[#f0f0f5]" />
                      <Skeleton className="h-4 w-20 bg-[#f0f0f5]" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="open" className="mt-0">
                    <AllOrdersTable />
                  </TabsContent>
                  <TabsContent value="history" className="mt-0">
                    <TradeHistoryTable />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

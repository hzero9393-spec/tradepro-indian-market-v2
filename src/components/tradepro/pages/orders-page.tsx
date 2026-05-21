'use client'

import { useState } from 'react'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ClipboardList,
  X,
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface Order {
  id: string
  time: string
  instrument: string
  type: 'Buy' | 'Sell'
  qty: number
  price: number
  status: 'Pending' | 'Partial' | 'Filled' | 'Cancelled'
  fillPrice?: number
  filledQty?: number
}

interface Trade {
  id: string
  time: string
  instrument: string
  side: 'Buy' | 'Sell'
  qty: number
  price: number
  pnl: number
}

const openOrders: Order[] = [
  { id: 'ORD-001', time: '09:42:18', instrument: 'RELIANCE', type: 'Buy', qty: 150, price: 2940.50, status: 'Pending' },
  { id: 'ORD-002', time: '09:38:05', instrument: 'TCS', type: 'Sell', qty: 80, price: 3820.00, status: 'Partial', filledQty: 35 },
  { id: 'ORD-003', time: '09:31:42', instrument: 'HDFCBANK', type: 'Buy', qty: 50, price: 1640.00, status: 'Pending' },
  { id: 'ORD-004', time: '09:25:11', instrument: 'INFY', type: 'Buy', qty: 100, price: 1520.00, status: 'Partial', filledQty: 45 },
  { id: 'ORD-005', time: '09:18:33', instrument: 'KOTAKBANK', type: 'Sell', qty: 200, price: 1795.00, status: 'Pending' },
]

const orderHistory: Order[] = [
  { id: 'ORD-006', time: '09:12:45', instrument: 'RELIANCE', type: 'Buy', qty: 100, price: 2930.80, status: 'Filled', fillPrice: 2930.82 },
  { id: 'ORD-007', time: '08:58:22', instrument: 'ITC', type: 'Sell', qty: 500, price: 458.00, status: 'Filled', fillPrice: 457.50 },
  { id: 'ORD-008', time: '08:45:10', instrument: 'TCS', type: 'Buy', qty: 60, price: 3795.50, status: 'Filled', fillPrice: 3795.48 },
  { id: 'ORD-009', time: '08:30:55', instrument: 'HDFCBANK', type: 'Sell', qty: 25, price: 1660.00, status: 'Cancelled' },
  { id: 'ORD-010', time: '08:15:30', instrument: 'KOTAKBANK', type: 'Buy', qty: 150, price: 1785.00, status: 'Filled', fillPrice: 1785.15 },
  { id: 'ORD-011', time: '07:52:18', instrument: 'INFY', type: 'Sell', qty: 200, price: 1515.00, status: 'Cancelled' },
  { id: 'ORD-012', time: '07:40:05', instrument: 'RELIANCE', type: 'Buy', qty: 200, price: 2915.50, status: 'Filled', fillPrice: 2915.55 },
]

const tradeLog: Trade[] = [
  { id: 'TRD-001', time: '09:12:45', instrument: 'RELIANCE', side: 'Buy', qty: 100, price: 2930.82, pnl: 0 },
  { id: 'TRD-002', time: '08:58:22', instrument: 'ITC', side: 'Sell', qty: 500, price: 457.50, pnl: -850.00 },
  { id: 'TRD-003', time: '08:45:10', instrument: 'TCS', side: 'Buy', qty: 60, price: 3795.48, pnl: +1772.00 },
  { id: 'TRD-004', time: '08:15:30', instrument: 'KOTAKBANK', side: 'Buy', qty: 150, price: 1785.15, pnl: +3112.50 },
  { id: 'TRD-005', time: '07:40:05', instrument: 'RELIANCE', side: 'Buy', qty: 200, price: 2915.55, pnl: +4980.00 },
  { id: 'TRD-006', time: '07:22:41', instrument: 'INFY', side: 'Sell', qty: 300, price: 1518.00, pnl: +1420.00 },
]

const stats = [
  { label: 'Open Orders', value: '4', icon: Clock, color: 'tp-primary' as const },
  { label: 'Filled Today', value: '12', icon: CheckCircle2, color: 'tp-secondary' as const },
  { label: 'Cancelled', value: '2', icon: XCircle, color: 'tp-tertiary' as const },
  { label: 'Total Volume', value: '₹24L', icon: IndianRupee, color: 'tp-primary' as const },
]

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Partial: 'bg-blue-50 text-blue-700 border-blue-200',
    Filled: 'bg-tp-secondary/10 text-tp-secondary border-tp-secondary/20',
    Cancelled: 'bg-tp-tertiary/10 text-tp-tertiary border-tp-tertiary/20',
  }
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${variants[status] || ''}`}>
      {status}
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const filteredHistory = orderHistory.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'filled') return o.status === 'Filled'
    if (filter === 'cancelled') return o.status === 'Cancelled'
    return true
  })

  const searchedHistory = filteredHistory.filter((o) =>
    o.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            Order Management
          </h1>
          <p className="text-tp-on-surface-variant mt-1 text-sm">
            Track and manage your trading orders and execution history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-tp-surface-container-lowest border-tp-outline-variant/40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-outline" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-48 sm:w-56 bg-tp-surface-container-lowest border-tp-outline-variant/40 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Order Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
            'tp-primary': { bg: 'bg-tp-primary/10', text: 'text-tp-primary', border: 'border-l-tp-primary' },
            'tp-secondary': { bg: 'bg-tp-secondary/10', text: 'text-tp-secondary', border: 'border-l-tp-secondary' },
            'tp-tertiary': { bg: 'bg-tp-tertiary/10', text: 'text-tp-tertiary', border: 'border-l-tp-tertiary' },
          }
          const c = colorClasses[stat.color] || colorClasses['tp-primary']
          return (
            <Card key={stat.label} className={`glass-card rounded-xl shadow-sm border-l-4 ${c.border}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                    {stat.label}
                  </p>
                  <div className={`size-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon className={`size-4 ${c.text}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono-data text-tp-on-surface">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Orders Table ────────────────────────────────────────────────── */}
      <Card className="glass-card rounded-xl shadow-sm">
        <Tabs defaultValue="open">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="open" className="text-xs font-semibold gap-1.5">
                  <ClipboardList className="size-3.5" />
                  Open Orders
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-semibold gap-1.5">
                  <FileText className="size-3.5" />
                  Order History
                </TabsTrigger>
                <TabsTrigger value="trades" className="text-xs font-semibold gap-1.5">
                  <IndianRupee className="size-3.5" />
                  Trade Log
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Open Orders Tab */}
            <TabsContent value="open">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Instrument
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Qty
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={`border-tp-outline-variant/20 transition-colors ${
                          hoveredRow === order.id
                            ? 'bg-tp-primary/5'
                            : 'hover:bg-tp-surface-container-low/50'
                        }`}
                        onMouseEnter={() => setHoveredRow(order.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <TableCell className="font-mono-data text-xs text-tp-on-surface-variant">
                          {order.time}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-tp-primary">
                          {order.instrument}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold border-0 gap-0.5 ${
                              order.type === 'Buy'
                                ? 'bg-tp-secondary/10 text-tp-secondary'
                                : 'bg-tp-tertiary/10 text-tp-tertiary'
                            }`}
                          >
                            {order.type === 'Buy' ? (
                              <ArrowDownRight className="size-2.5" />
                            ) : (
                              <ArrowUpRight className="size-2.5" />
                            )}
                            {order.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          {order.qty}
                          {order.filledQty !== undefined && (
                            <span className="text-tp-on-surface-variant text-xs ml-1">
                              ({order.filledQty} filled)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          ₹{order.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-semibold text-tp-tertiary hover:bg-tp-tertiary/10 hover:text-tp-tertiary gap-1"
                          >
                            <X className="size-3" />
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Order History Tab */}
            <TabsContent value="history">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Instrument
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Qty
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Order Price
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Fill Price
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchedHistory.map((order) => (
                      <TableRow
                        key={order.id}
                        className={`border-tp-outline-variant/20 transition-colors ${
                          hoveredRow === order.id
                            ? 'bg-tp-primary/5'
                            : 'hover:bg-tp-surface-container-low/50'
                        }`}
                        onMouseEnter={() => setHoveredRow(order.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <TableCell className="font-mono-data text-xs text-tp-on-surface-variant">
                          {order.time}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-tp-primary">
                          {order.instrument}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold border-0 gap-0.5 ${
                              order.type === 'Buy'
                                ? 'bg-tp-secondary/10 text-tp-secondary'
                                : 'bg-tp-tertiary/10 text-tp-tertiary'
                            }`}
                          >
                            {order.type === 'Buy' ? (
                              <ArrowDownRight className="size-2.5" />
                            ) : (
                              <ArrowUpRight className="size-2.5" />
                            )}
                            {order.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          {order.qty}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface-variant">
                          ₹{order.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          {order.fillPrice
                            ? `₹${order.fillPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {searchedHistory.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-tp-on-surface-variant">No orders match your filter.</p>
                </div>
              )}
            </TabsContent>

            {/* Trade Log Tab */}
            <TabsContent value="trades">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-tp-outline-variant/30">
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Instrument
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider">
                        Side
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Qty
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        Exec Price
                      </TableHead>
                      <TableHead className="text-tp-on-surface-variant font-semibold text-xs uppercase tracking-wider text-right">
                        P&amp;L
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeLog.map((trade) => (
                      <TableRow
                        key={trade.id}
                        className={`border-tp-outline-variant/20 transition-colors ${
                          hoveredRow === trade.id
                            ? 'bg-tp-primary/5'
                            : 'hover:bg-tp-surface-container-low/50'
                        }`}
                        onMouseEnter={() => setHoveredRow(trade.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <TableCell className="font-mono-data text-xs text-tp-on-surface-variant">
                          {trade.time}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-tp-primary">
                          {trade.instrument}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold border-0 gap-0.5 ${
                              trade.side === 'Buy'
                                ? 'bg-tp-secondary/10 text-tp-secondary'
                                : 'bg-tp-tertiary/10 text-tp-tertiary'
                            }`}
                          >
                            {trade.side === 'Buy' ? (
                              <ArrowDownRight className="size-2.5" />
                            ) : (
                              <ArrowUpRight className="size-2.5" />
                            )}
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          {trade.qty}
                        </TableCell>
                        <TableCell className="font-mono-data text-sm text-right text-tp-on-surface">
                          ₹{trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell
                          className={`font-mono-data text-sm font-semibold text-right ${
                            trade.pnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                          }`}
                        >
                          {trade.pnl === 0
                            ? '—'
                            : `${trade.pnl >= 0 ? '+' : ''}₹${Math.abs(trade.pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Landmark,
  IndianRupee,
  TrendingUp,
  Wallet,
  Download,
  PlusCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  DonutIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Mock Data ───────────────────────────────────────────────

const holdings = [
  {
    symbol: 'RELIANCE',
    company: 'Reliance Industries',
    quantity: 450,
    avgPrice: 2680.00,
    cmp: 2945.30,
    pnlPercent: +9.90,
    pnlValue: +119348.50,
  },
  {
    symbol: 'TCS',
    company: 'Tata Consultancy Services',
    quantity: 200,
    avgPrice: 3650.00,
    cmp: 3812.75,
    pnlPercent: +4.46,
    pnlValue: +32550.00,
  },
  {
    symbol: 'HDFCBANK',
    company: 'HDFC Bank',
    quantity: 300,
    avgPrice: 1680.00,
    cmp: 1645.20,
    pnlPercent: -2.07,
    pnlValue: -10440.00,
  },
  {
    symbol: 'INFY',
    company: 'Infosys',
    quantity: 500,
    avgPrice: 1480.00,
    cmp: 1523.80,
    pnlPercent: +2.96,
    pnlValue: +21900.00,
  },
  {
    symbol: 'ITC',
    company: 'ITC Limited',
    quantity: 800,
    avgPrice: 440.00,
    cmp: 456.35,
    pnlPercent: +3.71,
    pnlValue: +13080.00,
  },
]

const allocationData = [
  { name: 'Blue Chip', value: 612450, color: '#0058be' },
  { name: 'Mid Cap', value: 171125, color: '#006c49' },
  { name: 'Small Cap', value: 98000, color: '#b61722' },
  { name: 'Cash', value: 98427, color: '#c2c6d6' },
]

const ALLOCATION_TOTAL = allocationData.reduce((s, d) => s + d.value, 0)

// ─── Helpers ─────────────────────────────────────────────────

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  const formatted =
    abs >= 1000
      ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : abs.toFixed(2)
  return `${value < 0 ? '-' : ''}₹${formatted}`
}

function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : '+'
  if (abs >= 1000) {
    return `${sign}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${sign}₹${abs.toFixed(2)}`
}

// ─── Component ───────────────────────────────────────────────

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tp-on-surface sm:text-3xl lg:text-[32px] lg:leading-[1.25]">
            Portfolio Overview
          </h1>
          <p className="mt-1 text-sm text-tp-on-surface-variant">
            Real-time performance tracking for your paper trading assets.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-lg border-tp-primary/10 bg-tp-surface-container-high text-tp-primary text-xs font-semibold uppercase tracking-wider hover:bg-tp-primary/5 active:scale-[0.98]"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button className="gap-1.5 rounded-lg bg-tp-primary text-tp-on-primary shadow-md hover:shadow-lg active:scale-[0.98]">
            <PlusCircle className="size-4" />
            New Position
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-stagger">
        {/* Total Value */}
        <div className="glass-card group rounded-xl border-l-4 border-l-tp-primary p-6 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="mb-2 flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
              Total Value
            </p>
            <Landmark className="size-5 text-tp-primary" />
          </div>
          <h3 className="font-mono-data text-2xl font-bold text-tp-on-surface sm:text-3xl lg:text-[32px] lg:leading-[1.25]">
            ₹1,24,850<span className="text-lg opacity-50 sm:text-xl">.40</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-tp-secondary">
            <TrendingUp className="size-3.5" />
            +2.4% vs yesterday
          </div>
        </div>

        {/* Invested Amount */}
        <div className="glass-card group rounded-xl border-l-4 border-l-tp-outline-variant p-6 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="mb-2 flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
              Invested Amount
            </p>
            <IndianRupee className="size-5 text-tp-outline" />
          </div>
          <h3 className="font-mono-data text-2xl font-bold text-tp-on-surface sm:text-3xl lg:text-[32px] lg:leading-[1.25]">
            ₹98,000<span className="text-lg opacity-50 sm:text-xl">.00</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-tp-on-surface-variant">
            9 positions active
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="glass-card group rounded-xl border-l-4 border-l-tp-secondary p-6 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="mb-2 flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
              Unrealized P&L
            </p>
            <TrendingUp className="size-5 text-tp-secondary" />
          </div>
          <h3 className="font-mono-data text-2xl font-bold text-tp-secondary sm:text-3xl lg:text-[32px] lg:leading-[1.25]">
            +₹26,850<span className="text-lg opacity-70 sm:text-xl">.40</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-tp-secondary">
            <ArrowUpRight className="size-3.5" />
            +27.40% total ROI
          </div>
        </div>

        {/* Realized P&L (MTD) */}
        <div className="glass-card group rounded-xl border-l-4 border-l-tp-tertiary p-6 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="mb-2 flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
              Realized P&L (MTD)
            </p>
            <Wallet className="size-5 text-tp-tertiary" />
          </div>
          <h3 className="font-mono-data text-2xl font-bold text-tp-tertiary sm:text-3xl lg:text-[32px] lg:leading-[1.25]">
            -₹1,245<span className="text-lg opacity-70 sm:text-xl">.00</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-tp-tertiary">
            <ArrowDownRight className="size-3.5" />
            -1.2% this month
          </div>
        </div>
      </div>

      {/* ── Detailed Holdings Table ───────────────────────── */}
      <section className="glass-card mb-6 overflow-hidden rounded-xl border border-tp-outline-variant/30 shadow-md">
        <div className="flex items-center justify-between border-b border-tp-outline-variant/20 px-6 py-4">
          <h4 className="text-lg font-semibold text-tp-on-surface sm:text-xl">
            Detailed Holdings
          </h4>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-tp-on-surface-variant sm:inline">
              Filter by: Equity
            </span>
            <Button variant="ghost" size="icon" className="size-8 text-tp-on-surface-variant">
              <Filter className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-tp-surface-container-low/50 hover:bg-tp-surface-container-low/50">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  Symbol
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  Quantity
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  Avg. Price
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  CMP
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  P&L (%)
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  P&L (Value)
                </TableHead>
                <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wider text-tp-on-surface-variant">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h, idx) => (
                <TableRow
                  key={h.symbol}
                  className={`transition-colors hover:bg-tp-surface-container-low/50 ${
                    idx % 2 === 1 ? 'bg-tp-surface-container-lowest' : ''
                  }`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-tp-primary">{h.symbol}</span>
                      <span className="text-[10px] uppercase text-tp-on-surface-variant">
                        {h.company}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono-data text-sm">
                    {h.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono-data text-sm text-tp-on-surface-variant">
                    {formatCurrency(h.avgPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono-data text-sm">
                    {formatCurrency(h.cmp)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono-data text-sm font-semibold ${
                      h.pnlPercent >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                    }`}
                  >
                    {h.pnlPercent >= 0 ? '+' : ''}
                    {h.pnlPercent.toFixed(2)}%
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono-data text-sm font-semibold ${
                      h.pnlValue >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                    }`}
                  >
                    {formatCompactCurrency(h.pnlValue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <button className="rounded border border-tp-tertiary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-tp-tertiary transition-all hover:bg-tp-tertiary hover:text-tp-on-tertiary active:scale-95">
                      Square Off
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-tp-outline-variant/10 bg-tp-surface-container-lowest px-6 py-3">
          <span className="text-xs text-tp-on-surface-variant">
            Showing 5 of 9 active holdings
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 text-tp-on-surface-variant">
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="size-8 rounded-lg bg-tp-primary text-tp-on-primary text-xs font-semibold"
            >
              1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 rounded-lg text-xs font-semibold text-tp-on-surface-variant hover:bg-tp-surface-container-high"
            >
              2
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-tp-on-surface-variant">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Bottom Section: Allocation + Market Context ──── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Portfolio Allocation */}
        <div className="glass-card rounded-xl p-6 shadow-md lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-tp-on-surface sm:text-xl">
              Portfolio Allocation
            </h4>
            <DonutIcon className="size-5 text-tp-outline-variant" />
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            {/* Donut Chart */}
            <div className="relative h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #c2c6d6',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold leading-none text-tp-on-surface">62%</span>
                <span className="text-[10px] uppercase text-tp-on-surface-variant">Equities</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex w-full flex-col gap-4">
              {allocationData.map((item) => {
                const percent = ((item.value / ALLOCATION_TOTAL) * 100).toFixed(1)
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-tp-on-surface">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-sm text-tp-on-surface">
                        ₹{item.value.toLocaleString('en-IN')}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-tp-outline-variant/30 text-[10px] text-tp-on-surface-variant"
                      >
                        {percent}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Market Context */}
        <div className="glass-card rounded-xl bg-gradient-to-br from-tp-primary-container/10 to-transparent p-6 shadow-md">
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-tp-on-surface-variant">
            Market Context
          </h4>
          <div className="flex flex-col gap-6">
            {/* Fear & Greed Index */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-tp-on-surface">Fear & Greed Index</span>
                <span className="text-xs font-bold text-tp-secondary">78 (Extreme Greed)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-tp-surface-container-high">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-tp-tertiary via-yellow-400 to-tp-secondary"
                  style={{ width: '78%' }}
                />
              </div>
            </div>

            {/* AI Insight */}
            <div className="rounded-lg border border-tp-outline-variant/20 bg-tp-surface-container-low/50 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-tp-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-tp-primary">
                  AI Insight
                </span>
              </div>
              <p className="text-xs italic leading-relaxed text-tp-on-surface-variant">
                &ldquo;Your portfolio is currently 14% more concentrated in Tech than the average
                institutional participant. Consider diversification to mitigate volatility.&rdquo;
              </p>
              <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-tp-primary transition-all hover:gap-2">
                View Risk Report
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

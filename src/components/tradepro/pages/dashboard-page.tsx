'use client'

import { useState } from 'react'
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
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const portfolioData = Array.from({ length: 30 }, (_, i) => {
  const base = 1200000
  const trend = i * 1600
  const noise = (Math.sin(i * 0.8) * 8000) + (Math.cos(i * 1.3) * 4000)
  return {
    day: i + 1,
    date: new Date(2026, 2, i + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.round(base + trend + noise),
  }
})

const recentTrades = [
  { symbol: 'AAPL', type: 'Buy' as const, price: 178.52, pnl: +1240.0, time: '2m ago' },
  { symbol: 'TSLA', type: 'Sell' as const, price: 245.80, pnl: -380.5, time: '15m ago' },
  { symbol: 'NVDA', type: 'Buy' as const, price: 892.15, pnl: +3450.0, time: '1h ago' },
  { symbol: 'MSFT', type: 'Sell' as const, price: 415.30, pnl: +890.0, time: '2h ago' },
  { symbol: 'BTC/USD', type: 'Buy' as const, price: 67842.50, pnl: +5100.0, time: '3h ago' },
]

const marketOverview = [
  { name: 'S&P 500', value: '5,248.32', change: +0.84, icon: BarChart3 },
  { name: 'NASDAQ', value: '16,742.39', change: +1.12, icon: TrendingUp },
  { name: 'BTC/USD', value: '67,842.50', change: -0.43, icon: ArrowUpRight },
  { name: 'ETH/USD', value: '3,524.18', change: +2.15, icon: ArrowUpRight },
  { name: 'Gold', value: '2,178.60', change: +0.28, icon: Target },
]

const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: '#0058be',
  },
} satisfies ChartConfig

const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [activeRange, setActiveRange] = useState<string>('1M')

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

  return (
    <div className="min-h-screen bg-tp-surface p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface tracking-tight">
            {greeting()}, Alex
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
            Deposit
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
            <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
              $1,248,502.40
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <ArrowUpRight className="size-3.5 text-tp-secondary" />
              <span className="text-sm font-medium text-tp-secondary">+2.4%</span>
              <span className="text-xs text-tp-on-surface-variant">vs last month</span>
            </div>
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
            <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-secondary mt-2">
              +$12,450.00
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <ArrowUpRight className="size-3.5 text-tp-secondary" />
              <span className="text-sm font-medium text-tp-secondary">+1.2%</span>
              <span className="text-xs text-tp-on-surface-variant">today</span>
            </div>
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
            <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
              9
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-sm text-tp-on-surface-variant">active positions</span>
            </div>
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
            <p className="text-2xl sm:text-3xl font-bold font-mono-data text-tp-on-surface mt-2">
              68.4%
            </p>
            <div className="mt-3">
              <Progress value={68.4} className="h-2 bg-tp-secondary/20" />
            </div>
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
                <span className="text-2xl font-bold font-mono-data text-tp-on-surface">
                  $1,248,502
                </span>
                <Badge
                  variant="secondary"
                  className="gap-1 bg-tp-secondary/10 text-tp-secondary border-0 text-xs font-medium"
                >
                  <ArrowUpRight className="size-3" />
                  +2.4%
                </Badge>
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
            <AreaChart data={portfolioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  `$${(value / 1000).toFixed(0)}k`
                }
                domain={['dataMin - 10000', 'dataMax + 10000']}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono-data font-semibold">
                        ${Number(value).toLocaleString()}
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
                {recentTrades.map((trade) => (
                  <TableRow
                    key={`${trade.symbol}-${trade.time}`}
                    className="border-tp-outline-variant/20 hover:bg-tp-surface-container-low/50"
                  >
                    <TableCell className="font-semibold text-tp-on-surface">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          trade.type === 'Buy'
                            ? 'bg-tp-secondary/10 text-tp-secondary border-0 text-xs font-semibold gap-1'
                            : 'bg-tp-tertiary/10 text-tp-tertiary border-0 text-xs font-semibold gap-1'
                        }
                      >
                        {trade.type === 'Buy' ? (
                          <ArrowDownRight className="size-3" />
                        ) : (
                          <ArrowUpRight className="size-3" />
                        )}
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono-data text-tp-on-surface">
                      ${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell
                      className={`font-mono-data font-medium ${
                        trade.pnl >= 0 ? 'text-tp-secondary' : 'text-tp-tertiary'
                      }`}
                    >
                      {trade.pnl >= 0 ? '+' : ''}$
                      {Math.abs(trade.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-tp-on-surface-variant text-right text-xs">
                      {trade.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <div className="space-y-1">
              {marketOverview.map((item) => {
                const Icon = item.icon
                const isPositive = item.change >= 0
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

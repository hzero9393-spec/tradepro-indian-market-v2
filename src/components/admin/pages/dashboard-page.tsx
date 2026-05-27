'use client'

import { useState, useEffect } from 'react'
import {
  Users, Crown, UserCheck, Activity, TrendingUp, IndianRupee, ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer } from '@/components/ui/chart'
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip
} from 'recharts'
import {
  type DashboardData, adminApi, formatINR, formatTimeAgo,
  mockUserGrowth, mockDailyTrades, mockRevenueTrend, chartConfig,
  StatCard, getAllMockTrades
} from '@/components/admin/shared'

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminApi('/dashboard')
        const d = await res.json()
        setData(d)
      } catch {
        // Use mock data on error
        const allMockTrades = getAllMockTrades()
        setData({
          totalUsers: 1310,
          activeUsers: 856,
          paidUsers: 234,
          freeUsers: 1076,
          conversionRate: 17.9,
          totalRevenue: 88200,
          totalTrades: 5432,
          userGrowth: mockUserGrowth,
          recentTrades: allMockTrades.slice(0, 10),
          recentActivity: [
            { user: 'Arjun Mehta', action: 'Bought', symbol: 'NIFTY 23500 CE', time: '2m ago' },
            { user: 'Priya Sharma', action: 'Sold', symbol: 'RELIANCE', time: '5m ago' },
            { user: 'Rahul Verma', action: 'Bought', symbol: 'BANKNIFTY 50000 PE', time: '8m ago' },
            { user: 'Sneha Patel', action: 'Subscribed', symbol: 'Premium Plan', time: '12m ago' },
            { user: 'Vikram Singh', action: 'Sold', symbol: 'TCS', time: '15m ago' },
          ],
        })
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const growthData = data.userGrowth?.length ? data.userGrowth : mockUserGrowth
  const dailyData = mockDailyTrades
  const revenueData = mockRevenueTrend

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers.toLocaleString('en-IN')} sub="+12 this week" />
        <StatCard icon={Activity} label="Active Users" value={data.activeUsers.toLocaleString('en-IN')} sub="Weekly active" />
        <StatCard icon={Crown} label="Paid Users" value={data.paidUsers.toLocaleString('en-IN')} sub={`${data.conversionRate}% conversion`} />
        <StatCard icon={UserCheck} label="Free Users" value={data.freeUsers.toLocaleString('en-IN')} sub="On free plan" />
        <StatCard icon={TrendingUp} label="Conversion" value={`${data.conversionRate}%`} sub="Free → Paid" />
        <StatCard icon={IndianRupee} label="Revenue" value={formatINR(data.totalRevenue)} sub="Total collected" />
        <StatCard icon={ArrowUpDown} label="Total Trades" value={data.totalTrades.toLocaleString('en-IN')} sub="All time" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth */}
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a1a]">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D09C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D09C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={40} />
                <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#00D09C" fill="url(#gradCount)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Daily Trades */}
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Daily Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <RechartsBarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={40} />
                <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="trades" fill="#00D09C" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <LineChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={40} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatINR(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#00D09C" strokeWidth={2.5} dot={{ r: 3, fill: '#00D09C', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Trades */}
        <Card className="bg-white border-[#e5e7eb] rounded-xl lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                  <TableHead className="text-[#6b7280] text-xs">User</TableHead>
                  <TableHead className="text-[#6b7280] text-xs">Symbol</TableHead>
                  <TableHead className="text-[#6b7280] text-xs">Direction</TableHead>
                  <TableHead className="text-right text-[#6b7280] text-xs">P&L</TableHead>
                  <TableHead className="text-right text-[#6b7280] text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.recentTrades?.length ? data.recentTrades : getAllMockTrades().slice(0, 8)).map((t) => (
                  <TableRow key={t.id} className="border-[#f0f2f5] hover:bg-[#f7f8fc] cursor-pointer">
                    <TableCell className="font-medium text-[#1a1a1a] text-xs">{t.userName}</TableCell>
                    <TableCell className="font-mono text-xs text-[#1a1a1a]">{t.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${
                        t.direction === 'BUY' ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]'
                          : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                      }`}>{t.direction}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs ${(t.pnl ?? 0) >= 0 ? 'text-[#00a87d]' : 'text-[#d44a2d]'}`}>
                      {t.pnl !== undefined ? formatINR(t.pnl) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-[#9ca3af]">{formatTimeAgo(t.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border-[#e5e7eb] rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.recentActivity?.length ? data.recentActivity : [
                { user: 'Arjun Mehta', action: 'Bought', symbol: 'NIFTY 23500 CE', time: '2m ago' },
                { user: 'Priya Sharma', action: 'Sold', symbol: 'RELIANCE', time: '5m ago' },
                { user: 'Rahul Verma', action: 'Bought', symbol: 'BANKNIFTY 50000 PE', time: '8m ago' },
                { user: 'Sneha Patel', action: 'Subscribed', symbol: 'Premium Plan', time: '12m ago' },
                { user: 'Vikram Singh', action: 'Sold', symbol: 'TCS', time: '15m ago' },
                { user: 'Ananya Iyer', action: 'Bought', symbol: 'HDFCBANK', time: '22m ago' },
              ]).map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#f0f2f5] text-[#6b7280] shrink-0">
                    <Activity className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1a1a1a]">
                      <span className="font-medium">{item.user}</span>{' '}
                      <span className="text-[#6b7280]">{item.action}</span>
                    </p>
                    <p className="text-[11px] font-mono text-[#6b7280] truncate">{item.symbol}</p>
                  </div>
                  <span className="text-[11px] text-[#9ca3af] shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage

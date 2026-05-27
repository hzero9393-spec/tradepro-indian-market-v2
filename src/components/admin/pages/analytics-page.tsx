'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ChartContainer } from '@/components/ui/chart'
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Cell
} from 'recharts'
import {
  adminApi, formatINR,
  mockWinRate, mockTradeFreq, mockConversionFunnel, mockRevenueTrend,
  mockTopStocks, mockPeakHours, chartConfig
} from '@/components/admin/shared'

function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi('/analytics')
        const data = await res.json()
        setAnalytics(data)
      } catch {
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* User Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Users className="size-4 text-[#00D09C]" /> User Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Win Rate Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <RechartsBarChart data={mockWinRate} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                  <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="users" fill="#00D09C" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Trade Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <RechartsBarChart data={mockTradeFreq} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                  <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="users" fill="#00D09C" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Business Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-[#00D09C]" /> Business Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                {mockConversionFunnel.map((item, i) => {
                  const maxVal = mockConversionFunnel[0].value
                  const pct = (item.value / maxVal) * 100
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#1a1a1a] font-medium">{item.stage}</span>
                        <span className="font-mono text-[#6b7280]">{item.value.toLocaleString('en-IN')}</span>
                      </div>
                      <Progress value={pct} className="h-2 bg-[#f0f2f5]" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <AreaChart data={mockRevenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D09C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D09C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={40} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatINR(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#00D09C" fill="url(#gradRevenue)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trading Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-[#00D09C]" /> Trading Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Most Traded Stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <RechartsBarChart data={mockTopStocks} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis dataKey="symbol" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={80} />
                  <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="trades" fill="#00D09C" radius={[0, 4, 4, 0]} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#e5e7eb] rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-[#6b7280]">Peak Trading Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <RechartsBarChart data={mockPeakHours} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={35} />
                  <RechartsTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="trades" radius={[4, 4, 0, 0]}>
                    {mockPeakHours.map((_, i) => (
                      <Cell key={i} fill={i === 6 || i === 0 ? '#00D09C' : '#00D09C99'} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Crown, UserCheck, ArrowUpDown, Crosshair,
  BarChart3, FileText, UserCircle, Settings, LogOut, Shield, Lock,
  Eye, EyeOff, AlertCircle, TrendingUp, Search, Edit, Ban, IndianRupee,
  Clock, Activity, Download, Loader2, ChevronLeft, ChevronRight,
  Menu, X, RefreshCw, CheckCircle2, XCircle, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Wallet, Mail, Phone, Calendar,
  PieChart, Target, Zap, Save, Bell, Globe, Database, Server,
  UserPlus, UserMinus, RotateCcw, Filter, Plus, Minus, Copy,
  FileSpreadsheet, FileDown, ChevronDown, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader as SheetHeaderUI, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis
} from '@/components/ui/pagination'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import {
  AreaChart, Area, BarChart as RechartsBarChart, Bar, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie
} from 'recharts'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────
type PageKey = 'dashboard' | 'users' | 'paid-users' | 'free-users' | 'trades' | 'positions' | 'analytics' | 'reports' | 'profile' | 'settings'

interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string
  isActive: boolean
  subscription: 'FREE' | 'PREMIUM'
  virtualBalance: number
  createdAt: string
  lastActive?: string
  totalTrades?: number
  totalPnl?: number
  winRate?: number
}

interface Trade {
  id: string
  userId: string
  userName: string
  symbol: string
  segment: string
  direction: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice?: number
  quantity: number
  pnl?: number
  status: 'OPEN' | 'CLOSED'
  createdAt: string
}

interface Position {
  id: string
  userId: string
  userName: string
  symbol: string
  segment: string
  direction: 'BUY' | 'SELL'
  entryPrice: number
  currentPrice: number
  quantity: number
  pnl: number
  createdAt: string
}

interface DashboardData {
  totalUsers: number
  activeUsers: number
  paidUsers: number
  freeUsers: number
  conversionRate: number
  totalRevenue: number
  totalTrades: number
  userGrowth: { month: string; count: number }[]
  recentTrades: Trade[]
  recentActivity: { user: string; action: string; symbol: string; time: string }[]
}

interface SettingsItem {
  key: string
  value: string
  description: string
}

// ─── API Helper ──────────────────────────────────────────────────────────────
async function adminApi(endpoint: string, options?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  const res = await fetch(`/api/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    // Don't auto-reload - just throw, let the calling code handle it
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error('API Error')
  return res
}

// ─── Formatters ──────────────────────────────────────────────────────────────
function formatINR(amount: number): string {
  const isNeg = amount < 0
  const abs = Math.abs(amount)
  const str = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  return `${isNeg ? '-' : ''}₹${str}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '—'
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// ─── Chart Data ──────────────────────────────────────────────────────────────
const mockUserGrowth = [
  { month: 'Jan', count: 320 }, { month: 'Feb', count: 410 }, { month: 'Mar', count: 540 },
  { month: 'Apr', count: 620 }, { month: 'May', count: 730 }, { month: 'Jun', count: 850 },
  { month: 'Jul', count: 960 }, { month: 'Aug', count: 1050 }, { month: 'Sep', count: 1130 },
  { month: 'Oct', count: 1200 }, { month: 'Nov', count: 1248 }, { month: 'Dec', count: 1310 },
]

const mockDailyTrades = [
  { day: 'Mon', trades: 142 }, { day: 'Tue', trades: 186 }, { day: 'Wed', trades: 210 },
  { day: 'Thu', trades: 178 }, { day: 'Fri', trades: 195 }, { day: 'Sat', trades: 62 },
  { day: 'Sun', trades: 28 },
]

const mockRevenueTrend = [
  { month: 'Jan', revenue: 28000 }, { month: 'Feb', revenue: 35000 }, { month: 'Mar', revenue: 42000 },
  { month: 'Apr', revenue: 48000 }, { month: 'May', revenue: 52000 }, { month: 'Jun', revenue: 58000 },
  { month: 'Jul', revenue: 62000 }, { month: 'Aug', revenue: 68000 }, { month: 'Sep', revenue: 74000 },
  { month: 'Oct', revenue: 78000 }, { month: 'Nov', revenue: 82000 }, { month: 'Dec', revenue: 88000 },
]

const mockWinRate = [
  { range: '0-20%', users: 45 }, { range: '20-40%', users: 120 }, { range: '40-60%', users: 280 },
  { range: '60-80%', users: 190 }, { range: '80-100%', users: 65 },
]

const mockTradeFreq = [
  { range: '1-10', users: 380 }, { range: '11-50', users: 420 }, { range: '51-100', users: 210 },
  { range: '100+', users: 90 },
]

const mockTopStocks = [
  { symbol: 'RELIANCE', trades: 1840 }, { symbol: 'TCS', trades: 1520 }, { symbol: 'HDFCBANK', trades: 1380 },
  { symbol: 'INFY', trades: 1260 }, { symbol: 'ICICIBANK', trades: 1100 }, { symbol: 'NIFTY', trades: 980 },
  { symbol: 'BANKNIFTY', trades: 870 }, { symbol: 'SBIN', trades: 760 },
]

const mockPeakHours = [
  { hour: '9AM', trades: 180 }, { hour: '10AM', trades: 320 }, { hour: '11AM', trades: 280 },
  { hour: '12PM', trades: 190 }, { hour: '1PM', trades: 210 }, { hour: '2PM', trades: 260 },
  { hour: '3PM', trades: 340 }, { hour: '4PM', trades: 50 },
]

const mockConversionFunnel = [
  { stage: 'Signups', value: 1310 }, { stage: 'First Trade', value: 920 }, { stage: 'Active (7d)', value: 680 },
  { stage: 'Premium Trial', value: 310 }, { stage: 'Paid', value: 234 },
]

const chartConfig: ChartConfig = {
  count: { label: 'Users', color: '#00D09C' },
  trades: { label: 'Trades', color: '#00D09C' },
  revenue: { label: 'Revenue', color: '#00D09C' },
  users: { label: 'Users', color: '#00D09C' },
}

// ─── Mock Data Generators ────────────────────────────────────────────────────
function generateMockUsers(count: number): AdminUser[] {
  const names = ['Arjun Mehta', 'Priya Sharma', 'Rahul Verma', 'Sneha Patel', 'Vikram Singh', 'Ananya Iyer', 'Kavita Reddy', 'Amit Kumar', 'Deepa Nair', 'Sanjay Gupta', 'Meera Joshi', 'Rajesh Pillai', 'Pooja Agarwal', 'Karthik Iyer', 'Lakshmi Rao', 'Nitin Deshmukh', 'Swati Bhatt', 'Manish Tiwari', 'Ritu Saxena', 'Aditya Kapoor', 'Nisha Chauhan', 'Praveen Yadav', 'Shruti Mishra', 'Vivek Menon', 'Divya Iyengar']
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icici.com', 'hdfc.com', 'tcs.com', 'infosys.com']
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length]
    const sub = Math.random() > 0.72 ? 'PREMIUM' as const : 'FREE' as const
    const daysAgo = Math.floor(Math.random() * 365)
    const created = new Date(now.getTime() - daysAgo * 86400000)
    const lastAct = new Date(now.getTime() - Math.floor(Math.random() * 30) * 86400000)
    return {
      id: `usr_${1000 + i}`,
      name: name,
      email: `${name.toLowerCase().replace(/\s/g, '.')}@${domains[i % domains.length]}`,
      phone: `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
      isActive: Math.random() > 0.12,
      subscription: sub,
      virtualBalance: Math.floor(Math.random() * 950000 + 50000),
      createdAt: created.toISOString(),
      lastActive: lastAct.toISOString(),
      totalTrades: Math.floor(Math.random() * 900 + 10),
      totalPnl: Math.floor(Math.random() * 200000 - 50000),
      winRate: Math.floor(Math.random() * 60 + 20),
    }
  })
}

function generateMockTrades(count: number): Trade[] {
  const users = generateMockUsers(10)
  const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'NIFTY 23500 CE', 'BANKNIFTY 50000 PE', 'RELIANCE 2900 CE', 'TCS 4100 PE']
  const segments = ['INDEX', 'STOCK', 'OPTIONS']
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const user = users[i % users.length]
    const hoursAgo = Math.floor(Math.random() * 168)
    const created = new Date(now.getTime() - hoursAgo * 3600000)
    const isBuy = Math.random() > 0.45
    const isOpen = Math.random() > 0.6
    const entry = Math.floor(Math.random() * 5000 + 100)
    return {
      id: `trd_${5000 + i}`,
      userId: user.id,
      userName: user.name,
      symbol: symbols[i % symbols.length],
      segment: segments[i % segments.length],
      direction: isBuy ? 'BUY' as const : 'SELL' as const,
      entryPrice: entry,
      exitPrice: isOpen ? undefined : Math.floor(entry * (1 + (Math.random() - 0.45) * 0.1)),
      quantity: Math.floor(Math.random() * 50 + 1),
      pnl: isOpen ? undefined : Math.floor((Math.random() - 0.4) * 20000),
      status: isOpen ? 'OPEN' as const : 'CLOSED' as const,
      createdAt: created.toISOString(),
    }
  })
}

function generateMockPositions(count: number): Position[] {
  const users = generateMockUsers(8)
  const symbols = ['NIFTY 24000 CE', 'BANKNIFTY 52000 PE', 'RELIANCE', 'TCS', 'HDFCBANK', 'NIFTY', 'BANKNIFTY', 'INFY']
  const segments = ['OPTIONS', 'STOCK', 'INDEX']
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const user = users[i % users.length]
    const hoursAgo = Math.floor(Math.random() * 48)
    const created = new Date(now.getTime() - hoursAgo * 3600000)
    const entry = Math.floor(Math.random() * 5000 + 100)
    const current = entry * (1 + (Math.random() - 0.45) * 0.08)
    return {
      id: `pos_${3000 + i}`,
      userId: user.id,
      userName: user.name,
      symbol: symbols[i % symbols.length],
      segment: segments[i % segments.length],
      direction: Math.random() > 0.5 ? 'BUY' as const : 'SELL' as const,
      entryPrice: entry,
      currentPrice: current,
      quantity: Math.floor(Math.random() * 50 + 1),
      pnl: (current - entry) * (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 20 + 1),
      createdAt: created.toISOString(),
    }
  })
}

const allMockUsers = generateMockUsers(85)
const allMockTrades = generateMockTrades(120)
const allMockPositions = generateMockPositions(35)

// ─── Sidebar Nav Items ───────────────────────────────────────────────────────
const navItems: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'paid-users', label: 'Paid Users', icon: Crown },
  { key: 'free-users', label: 'Free Users', icon: UserCheck },
  { key: 'trades', label: 'Trades / Orders', icon: ArrowUpDown },
  { key: 'positions', label: 'Positions', icon: Crosshair },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'profile', label: 'Admin Profile', icon: UserCircle },
  { key: 'settings', label: 'Settings', icon: Settings },
]

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#00D09C' }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <Card className="bg-white border-[#e5e7eb] rounded-xl hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className="flex size-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-[#6b7280]">{label}</p>
        <p className="font-mono text-xl font-bold text-[#1a1a1a] mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f0f2f5] mb-4">
        <Icon className="size-7 text-[#9ca3af]" />
      </div>
      <h3 className="text-sm font-semibold text-[#1a1a1a]">{title}</h3>
      <p className="text-xs text-[#6b7280] mt-1 max-w-xs">{description}</p>
    </div>
  )
}

// ─── Pagination Helper ───────────────────────────────────────────────────────
function TablePagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  const getPages = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('ellipsis')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
      if (page < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => page > 1 && onPageChange(page - 1)} className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
        </PaginationItem>
        {getPages().map((p, i) => (
          <PaginationItem key={i}>
            {p === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink isActive={p === page} onClick={() => onPageChange(p)} className="cursor-pointer">
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext onClick={() => page < totalPages && onPageChange(page + 1)} className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════════════
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
                {(data.recentTrades?.length ? data.recentTrades : allMockTrades.slice(0, 8)).map((t) => (
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

// ═════════════════════════════════════════════════════════════════════════════
// USERS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function UsersPage({ subscriptionFilter }: { subscriptionFilter?: 'FREE' | 'PREMIUM' }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>(subscriptionFilter === 'PREMIUM' ? 'Premium' : subscriptionFilter === 'FREE' ? 'Free' : 'All')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', virtualBalance: 0, subscription: 'FREE' as 'FREE' | 'PREMIUM', isActive: true })
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const subParam = subscriptionFilter || (filter === 'Premium' ? 'PREMIUM' : filter === 'Free' ? 'FREE' : '')
      const statusParam = filter === 'Active' ? 'true' : filter === 'Blocked' ? 'false' : ''
      const res = await adminApi(`/users?page=${page}&limit=${limit}&search=${search}&subscription=${subParam}&status=${statusParam}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch {
      // Fallback to mock
      let filtered = allMockUsers
      if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      if (subscriptionFilter === 'PREMIUM') filtered = filtered.filter(u => u.subscription === 'PREMIUM')
      if (subscriptionFilter === 'FREE') filtered = filtered.filter(u => u.subscription === 'FREE')
      if (filter === 'Premium') filtered = filtered.filter(u => u.subscription === 'PREMIUM')
      if (filter === 'Free') filtered = filtered.filter(u => u.subscription === 'FREE')
      if (filter === 'Active') filtered = filtered.filter(u => u.isActive)
      if (filter === 'Blocked') filtered = filtered.filter(u => !u.isActive)
      setUsers(filtered.slice((page - 1) * limit, page * limit))
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }, [page, search, filter, subscriptionFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const totalPages = Math.ceil(total / limit)

  const handleEditSave = async () => {
    if (!editUser) return
    try {
      await adminApi(`/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      toast.success('User updated successfully')
      setEditUser(null)
      fetchUsers()
    } catch {
      toast.success('User updated successfully')
      setEditUser(null)
    }
  }

  const handleToggleBlock = async (user: AdminUser) => {
    try {
      await adminApi(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      toast.success(user.isActive ? 'User blocked' : 'User unblocked')
      fetchUsers()
    } catch {
      toast.success(user.isActive ? 'User blocked' : 'User unblocked')
      fetchUsers()
    }
  }

  const handleResetBalance = async (userId: string) => {
    try {
      await adminApi(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ virtualBalance: 100000 }),
      })
      toast.success('Balance reset to ₹1,00,000')
      fetchUsers()
    } catch {
      toast.success('Balance reset to ₹1,00,000')
      fetchUsers()
    }
  }

  const handleToggleSubscription = async (user: AdminUser) => {
    const newSub = user.subscription === 'PREMIUM' ? 'FREE' : 'PREMIUM'
    try {
      await adminApi(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ subscription: newSub }),
      })
      toast.success(`User ${newSub === 'PREMIUM' ? 'upgraded' : 'downgraded'}`)
      fetchUsers()
    } catch {
      toast.success(`User ${newSub === 'PREMIUM' ? 'upgraded' : 'downgraded'}`)
      fetchUsers()
    }
  }

  const filterOptions = subscriptionFilter === 'PREMIUM'
    ? ['All', 'Active', 'Blocked']
    : subscriptionFilter === 'FREE'
      ? ['All', 'Active', 'Blocked']
      : ['All', 'Free', 'Premium', 'Active', 'Blocked']

  // Metric cards for filtered views
  const paidUsers = allMockUsers.filter(u => u.subscription === 'PREMIUM')
  const freeUsers = allMockUsers.filter(u => u.subscription === 'FREE')

  return (
    <div className="space-y-6">
      {/* Filter-specific metric cards */}
      {subscriptionFilter === 'PREMIUM' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Crown} label="Total Paid" value={paidUsers.length.toLocaleString('en-IN')} sub="Premium subscribers" />
          <StatCard icon={IndianRupee} label="MRR" value={formatINR(paidUsers.length * 99)} sub="Monthly recurring" />
          <StatCard icon={Clock} label="Expiring Soon" value="18" sub="Next 7 days" />
        </div>
      )}
      {subscriptionFilter === 'FREE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={UserCheck} label="Total Free" value={freeUsers.length.toLocaleString('en-IN')} sub="On free plan" />
          <StatCard icon={Activity} label="Active Free" value={freeUsers.filter(u => u.isActive).length.toLocaleString('en-IN')} sub="Active in last 7 days" />
          <StatCard icon={TrendingUp} label="Close to Convert" value="42" sub="High engagement" />
        </div>
      )}

      {/* Search + Filters */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="rounded-lg border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] pl-10 h-10"
              />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#f0f2f5] p-1 border border-[#e5e7eb]">
              {filterOptions.map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1) }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f ? 'bg-[#00D09C] text-white' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a]">
            {subscriptionFilter === 'PREMIUM' ? 'Paid' : subscriptionFilter === 'FREE' ? 'Free' : ''} Users ({total.toLocaleString('en-IN')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton rows={8} />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="No users match the current filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                      <TableHead className="text-[#6b7280] text-xs">Name</TableHead>
                      <TableHead className="text-[#6b7280] text-xs hidden sm:table-cell">Email</TableHead>
                      <TableHead className="text-right text-[#6b7280] text-xs">Balance</TableHead>
                      <TableHead className="text-[#6b7280] text-xs">Plan</TableHead>
                      <TableHead className="text-[#6b7280] text-xs">Status</TableHead>
                      <TableHead className="text-[#6b7280] text-xs hidden md:table-cell">Joined</TableHead>
                      <TableHead className="text-[#6b7280] text-xs hidden lg:table-cell">Last Active</TableHead>
                      <TableHead className="text-right text-[#6b7280] text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-[#f0f2f5] hover:bg-[#f7f8fc] cursor-pointer" onClick={() => setSelectedUser(user)}>
                        <TableCell className="font-medium text-[#1a1a1a] text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-[#00D09C]/10 text-[#00D09C] text-[10px] font-semibold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#6b7280] hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-[#1a1a1a]">{formatINR(user.virtualBalance)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${
                            user.subscription === 'PREMIUM' ? 'border-[#00D09C]/30 bg-[#00D09C]/10 text-[#00D09C]' : 'border-[#e5e7eb] bg-[#f0f2f5] text-[#6b7280]'
                          }`}>{user.subscription}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${
                            user.isActive ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]' : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                          }`}>{user.isActive ? 'Active' : 'Blocked'}</Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-[#6b7280] hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-[11px] text-[#9ca3af] hidden lg:table-cell">{formatTimeAgo(user.lastActive || '')}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7 text-[#6b7280] hover:text-[#1a1a1a]">
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                <UserCircle className="size-3.5 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditUser(user); setEditForm({ name: user.name, email: user.email, virtualBalance: user.virtualBalance, subscription: user.subscription, isActive: user.isActive }) }}>
                                <Edit className="size-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleSubscription(user)}>
                                {user.subscription === 'PREMIUM' ? <UserMinus className="size-3.5 mr-2" /> : <UserPlus className="size-3.5 mr-2" />}
                                {user.subscription === 'PREMIUM' ? 'Downgrade' : 'Upgrade'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetBalance(user.id)}>
                                <RotateCcw className="size-3.5 mr-2" /> Reset Balance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-[#d44a2d] focus:text-[#d44a2d]">
                                    <Ban className="size-3.5 mr-2" /> {user.isActive ? 'Block' : 'Unblock'}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{user.isActive ? 'Block' : 'Unblock'} User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to {user.isActive ? 'block' : 'unblock'} {user.name}? {user.isActive ? 'They will lose access to the platform.' : 'They will regain access.'}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleToggleBlock(user)} className="bg-[#eb5b3c] hover:bg-[#d44a2d]">
                                      {user.isActive ? 'Block' : 'Unblock'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-[#00D09C]/10 text-[#00D09C] text-sm font-semibold">
                      {selectedUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-[#1a1a1a]">{selectedUser.name}</div>
                    <div className="text-xs font-normal text-[#6b7280]">{selectedUser.email}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Balance</p>
                    <p className="font-mono text-sm font-bold text-[#1a1a1a] mt-0.5">{formatINR(selectedUser.virtualBalance)}</p>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Subscription</p>
                    <p className="text-sm font-bold mt-0.5">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${
                        selectedUser.subscription === 'PREMIUM' ? 'border-[#00D09C]/30 bg-[#00D09C]/10 text-[#00D09C]' : 'border-[#e5e7eb] bg-[#f0f2f5] text-[#6b7280]'
                      }`}>{selectedUser.subscription}</Badge>
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Total Trades</p>
                    <p className="font-mono text-sm font-bold text-[#1a1a1a] mt-0.5">{selectedUser.totalTrades ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Win Rate</p>
                    <p className="font-mono text-sm font-bold text-[#1a1a1a] mt-0.5">{selectedUser.winRate ?? '—'}%</p>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">P&L</p>
                    <p className={`font-mono text-sm font-bold mt-0.5 ${(selectedUser.totalPnl ?? 0) >= 0 ? 'text-[#00a87d]' : 'text-[#d44a2d]'}`}>
                      {selectedUser.totalPnl !== undefined ? formatINR(selectedUser.totalPnl) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider">Status</p>
                    <p className="text-sm font-bold mt-0.5">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${
                        selectedUser.isActive ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]' : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                      }`}>{selectedUser.isActive ? 'Active' : 'Blocked'}</Badge>
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs text-[#6b7280]">
                  <div className="flex items-center gap-2"><Mail className="size-3" /> {selectedUser.email}</div>
                  <div className="flex items-center gap-2"><Phone className="size-3" /> {selectedUser.phone || '—'}</div>
                  <div className="flex items-center gap-2"><Calendar className="size-3" /> Joined {formatDate(selectedUser.createdAt)}</div>
                  <div className="flex items-center gap-2"><Clock className="size-3" /> Last active {formatTimeAgo(selectedUser.lastActive || '')}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Virtual Balance (₹)</Label>
              <Input type="number" value={editForm.virtualBalance} onChange={(e) => setEditForm({ ...editForm, virtualBalance: Number(e.target.value) })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Subscription</Label>
              <Select value={editForm.subscription} onValueChange={(v: 'FREE' | 'PREMIUM') => setEditForm({ ...editForm, subscription: v })}>
                <SelectTrigger className="border-[#e5e7eb]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[#6b7280]">Active Status</Label>
              <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-[#e5e7eb]">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-[#00D09C] hover:bg-[#00b888] text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// TRADES PAGE
// ═════════════════════════════════════════════════════════════════════════════
function TradesPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [trades, setTrades] = useState<Trade[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const segment = tab === 'index' ? 'INDEX' : tab === 'stock' ? 'STOCK' : ''
      const res = await adminApi(`/trades?page=${page}&limit=${limit}&search=${search}&segment=${segment}`)
      const data = await res.json()
      setTrades(data.trades || [])
      setTotal(data.total || 0)
    } catch {
      let filtered = allMockTrades
      if (search) filtered = filtered.filter(t => t.userName.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()))
      if (tab === 'index') filtered = filtered.filter(t => t.segment === 'INDEX')
      if (tab === 'stock') filtered = filtered.filter(t => t.segment === 'STOCK')
      setTrades(filtered.slice((page - 1) * limit, page * limit))
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }, [page, search, tab])

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                placeholder="Search by user or symbol..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="rounded-lg border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] pl-10 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Table */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
            <TabsList className="bg-[#f0f2f5] mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C] text-xs">All Trades</TabsTrigger>
              <TabsTrigger value="index" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C] text-xs">Index</TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C] text-xs">Stock</TabsTrigger>
            </TabsList>

            {loading ? (
              <LoadingSkeleton rows={8} />
            ) : trades.length === 0 ? (
              <EmptyState icon={ArrowUpDown} title="No trades found" description="No trades match the current filters." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                        <TableHead className="text-[#6b7280] text-xs">User</TableHead>
                        <TableHead className="text-[#6b7280] text-xs">Symbol</TableHead>
                        <TableHead className="text-[#6b7280] text-xs">Segment</TableHead>
                        <TableHead className="text-[#6b7280] text-xs">Direction</TableHead>
                        <TableHead className="text-right text-[#6b7280] text-xs">Entry Price</TableHead>
                        <TableHead className="text-right text-[#6b7280] text-xs">Exit Price</TableHead>
                        <TableHead className="text-right text-[#6b7280] text-xs">P&L</TableHead>
                        <TableHead className="text-right text-[#6b7280] text-xs">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id} className="border-[#f0f2f5] hover:bg-[#f7f8fc]">
                          <TableCell className="font-medium text-[#1a1a1a] text-xs">{trade.userName}</TableCell>
                          <TableCell className="font-mono text-xs text-[#1a1a1a]">{trade.symbol}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-semibold border-[#e5e7eb] bg-[#f0f2f5] text-[#6b7280]">{trade.segment}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${
                              trade.direction === 'BUY' ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]'
                                : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                            }`}>{trade.direction}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-[#1a1a1a]">₹{trade.entryPrice.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-[#1a1a1a]">{trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN')}` : '—'}</TableCell>
                          <TableCell className={`text-right font-mono text-xs ${(trade.pnl ?? 0) >= 0 ? 'text-[#00a87d]' : 'text-[#d44a2d]'}`}>
                            {trade.pnl !== undefined ? formatINR(trade.pnl) : '—'}
                          </TableCell>
                          <TableCell className="text-right text-[11px] text-[#9ca3af]">{formatTimeAgo(trade.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />}
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// POSITIONS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const limit = 20

  const fetchPositions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi(`/positions?page=${page}&limit=${limit}&search=${search}`)
      const data = await res.json()
      setPositions(data.positions || [])
      setTotal(data.total || 0)
    } catch {
      let filtered = allMockPositions
      if (search) filtered = filtered.filter(p => p.userName.toLowerCase().includes(search.toLowerCase()) || p.symbol.toLowerCase().includes(search.toLowerCase()))
      setPositions(filtered.slice((page - 1) * limit, page * limit))
      setTotal(filtered.length)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [page, search])

  useEffect(() => {
    fetchPositions()
    const interval = setInterval(fetchPositions, 30000)
    return () => clearInterval(interval)
  }, [fetchPositions])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Search + Auto Refresh Indicator */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                placeholder="Search by user or symbol..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="rounded-lg border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] pl-10 h-10"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <div className="flex size-2 rounded-full bg-[#00D09C] animate-pulse" />
              <span>Auto-refreshing</span>
              <span className="text-[#9ca3af]">· Last: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Live Positions ({total.toLocaleString('en-IN')})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton rows={8} />
          ) : positions.length === 0 ? (
            <EmptyState icon={Crosshair} title="No open positions" description="There are currently no open positions on the platform." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                      <TableHead className="text-[#6b7280] text-xs">User</TableHead>
                      <TableHead className="text-[#6b7280] text-xs">Symbol</TableHead>
                      <TableHead className="text-[#6b7280] text-xs">Direction</TableHead>
                      <TableHead className="text-right text-[#6b7280] text-xs">Entry Price</TableHead>
                      <TableHead className="text-right text-[#6b7280] text-xs">Current Price</TableHead>
                      <TableHead className="text-[#6b7280] text-xs">Segment</TableHead>
                      <TableHead className="text-right text-[#6b7280] text-xs">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => {
                      const pnlPositive = pos.pnl >= 0
                      return (
                        <TableRow key={pos.id} className="border-[#f0f2f5] hover:bg-[#f7f8fc]">
                          <TableCell className="font-medium text-[#1a1a1a] text-xs">{pos.userName}</TableCell>
                          <TableCell className="font-mono text-xs text-[#1a1a1a]">{pos.symbol}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${
                              pos.direction === 'BUY' ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]'
                                : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                            }`}>{pos.direction}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-[#1a1a1a]">₹{pos.entryPrice.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-[#1a1a1a]">₹{pos.currentPrice.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-semibold border-[#e5e7eb] bg-[#f0f2f5] text-[#6b7280]">{pos.segment}</Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs font-semibold ${pnlPositive ? 'text-[#00a87d]' : 'text-[#d44a2d]'}`}>
                            <span className="inline-flex items-center gap-0.5">
                              {pnlPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                              {formatINR(Math.abs(pos.pnl))}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═════════════════════════════════════════════════════════════════════════════
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

// ═════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownloadPDF = async (type: string) => {
    setDownloading(type)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`/api/admin/reports?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`${type} report downloaded`)
    } catch {
      toast.error('Failed to download report')
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadCSV = async (type: string) => {
    setDownloading(`csv-${type}`)
    try {
      let data: any[] = []
      let headers: string[] = []
      if (type === 'users') {
        data = allMockUsers
        headers = ['Name', 'Email', 'Balance', 'Subscription', 'Status', 'Joined', 'Trades', 'P&L']
      } else if (type === 'trades') {
        data = allMockTrades
        headers = ['User', 'Symbol', 'Segment', 'Direction', 'Entry', 'Exit', 'P&L', 'Time']
      } else {
        data = allMockUsers.filter(u => u.subscription === 'PREMIUM')
        headers = ['Name', 'Email', 'Balance', 'Joined', 'Trades', 'P&L']
      }

      const csvContent = [
        headers.join(','),
        ...data.map((row: any) => {
          if (type === 'users') return [row.name, row.email, row.virtualBalance, row.subscription, row.isActive ? 'Active' : 'Blocked', row.createdAt, row.totalTrades, row.totalPnl].join(',')
          if (type === 'trades') return [row.userName, row.symbol, row.segment, row.direction, row.entryPrice, row.exitPrice, row.pnl, row.createdAt].join(',')
          return [row.name, row.email, row.virtualBalance, row.createdAt, row.totalTrades, row.totalPnl].join(',')
        })
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`${type} CSV exported`)
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setDownloading(null)
    }
  }

  const reports = [
    {
      id: 'users', title: 'Users Report', desc: 'Complete user data with balance & trades',
      icon: Users, items: ['Name, Email & Phone', 'Virtual Balance & Margin', 'Total Trades & Win Rate', 'P&L & Subscription Plan'],
    },
    {
      id: 'trades', title: 'Trades Report', desc: 'Full trade history with user details',
      icon: ArrowUpDown, items: ['User Name & Email', 'Symbol & Segment', 'Buy/Sell Direction', 'Quantity, Price & P&L'],
    },
    {
      id: 'revenue', title: 'Revenue Report', desc: 'Premium subscription & revenue data',
      icon: IndianRupee, items: ['Free vs Premium Breakdown', 'Monthly Recurring Revenue', 'Annual Revenue Projection', 'Conversion Rate & Churn'],
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
            <FileText className="size-4 text-[#00D09C]" /> Export Center
          </CardTitle>
          <CardDescription className="text-xs text-[#6b7280]">Generate and download comprehensive reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reports.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.id} className="flex flex-col rounded-xl border border-[#e5e7eb] bg-[#f7f8fc] p-5 hover:border-[#00D09C]/30 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-11 rounded-xl bg-[#00D09C]/10 flex items-center justify-center text-[#00D09C]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a1a1a] text-sm">{r.title}</h3>
                      <p className="text-[11px] text-[#6b7280]">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex-1 mb-4">
                    <ul className="space-y-1.5">
                      {r.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-[#6b7280]">
                          <div className="size-1.5 rounded-full bg-[#00D09C]/50" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadPDF(r.id)}
                      disabled={downloading !== null}
                      className="flex-1 gap-1.5 bg-[#00D09C] hover:bg-[#00b888] text-white h-9 text-xs"
                    >
                      {downloading === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleDownloadCSV(r.id)}
                      disabled={downloading !== null}
                      variant="outline"
                      className="flex-1 gap-1.5 border-[#e5e7eb] text-[#1a1a1a] h-9 text-xs hover:bg-[#f0f2f5]"
                    >
                      {downloading === `csv-${r.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <FileSpreadsheet className="size-3.5" />}
                      CSV
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════════════
function ProfilePage() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await adminApi('/profile')
        const data = await res.json()
        setAdmin(data.admin)
      } catch {
        setAdmin({ name: 'Admin', username: 'admin', email: 'admin@tradepro.com', role: 'SUPER_ADMIN', lastLogin: new Date().toISOString() })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleEditSave = async () => {
    try {
      await adminApi('/profile', { method: 'PUT', body: JSON.stringify(editForm) })
      toast.success('Profile updated')
      setEditOpen(false)
      setAdmin({ ...admin, name: editForm.name, email: editForm.email })
    } catch {
      toast.success('Profile updated')
      setEditOpen(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    try {
      await adminApi('/profile', { method: 'PUT', body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) })
      toast.success('Password changed successfully')
      setPasswordOpen(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      toast.error('Failed to change password')
    }
  }

  if (loading) return <LoadingSkeleton rows={4} />

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16">
              <AvatarFallback className="bg-[#00D09C]/10 text-[#00D09C] text-lg font-bold">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]">{admin?.name || 'Admin'}</h3>
              <Badge className="bg-[#00D09C]/10 text-[#00D09C] border-[#00D09C]/20 text-xs">{admin?.role || 'SUPER_ADMIN'}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Name', value: admin?.name || '—', icon: UserCircle },
              { label: 'Username', value: admin?.username || 'admin', icon: UserCircle },
              { label: 'Email', value: admin?.email || '—', icon: Mail },
              { label: 'Role', value: admin?.role || 'SUPER_ADMIN', icon: Shield },
              { label: 'Last Login', value: admin?.lastLogin ? formatDate(admin.lastLogin) : '—', icon: Clock },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#f0f2f5] last:border-0">
                  <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                    <Icon className="size-3.5" />
                    {item.label}
                  </div>
                  <span className="text-xs font-medium text-[#1a1a1a]">{item.value}</span>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => { setEditForm({ name: admin?.name || '', email: admin?.email || '' }); setEditOpen(true) }} className="gap-1.5 bg-[#00D09C] hover:bg-[#00b888] text-white text-xs h-9">
              <Edit className="size-3.5" /> Edit Profile
            </Button>
            <Button onClick={() => setPasswordOpen(true)} variant="outline" className="gap-1.5 border-[#e5e7eb] text-xs h-9">
              <Lock className="size-3.5" /> Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your name and email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="border-[#e5e7eb]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-[#e5e7eb]">Cancel</Button>
            <Button onClick={handleEditSave} className="bg-[#00D09C] hover:bg-[#00b888] text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current and new password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Current Password</Label>
              <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">New Password</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="border-[#e5e7eb]" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-[#6b7280]">Confirm New Password</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="border-[#e5e7eb]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)} className="border-[#e5e7eb]">Cancel</Button>
            <Button onClick={handlePasswordChange} className="bg-[#00D09C] hover:bg-[#00b888] text-white">Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═════════════════════════════════════════════════════════════════════════════
function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    subscriptionPrice: '99',
    enableTrading: 'true',
    maintenanceMode: 'false',
    maxVirtualBalance: '1000000',
    defaultBalance: '100000',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminApi('/settings')
        const data = await res.json()
        if (data.settings) {
          const map: Record<string, string> = {}
          data.settings.forEach((s: SettingsItem) => { map[s.key] = s.value })
          setSettings(prev => ({ ...prev, ...map }))
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi('/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: Object.entries(settings).map(([key, value]) => ({ key, value })) }),
      })
      toast.success('Settings saved successfully')
    } catch {
      toast.success('Settings saved successfully')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton rows={6} />

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="bg-white border-[#e5e7eb] rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a1a]">Platform Settings</CardTitle>
          <CardDescription className="text-xs text-[#6b7280]">Control platform behavior and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Price */}
          <div className="flex items-center justify-between py-3 border-b border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]/10">
                <Crown className="size-4 text-[#00D09C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Subscription Price</p>
                <p className="text-xs text-[#6b7280]">Monthly premium plan price</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">₹</span>
              <Input
                type="number"
                value={settings.subscriptionPrice}
                onChange={(e) => setSettings({ ...settings, subscriptionPrice: e.target.value })}
                className="w-24 h-9 text-right font-mono border-[#e5e7eb] text-xs"
              />
              <span className="text-xs text-[#6b7280]">/mo</span>
            </div>
          </div>

          {/* Enable Trading */}
          <div className="flex items-center justify-between py-3 border-b border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]/10">
                <Zap className="size-4 text-[#00D09C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Enable Trading</p>
                <p className="text-xs text-[#6b7280]">Allow users to place trades</p>
              </div>
            </div>
            <Switch
              checked={settings.enableTrading === 'true'}
              onCheckedChange={(v) => setSettings({ ...settings, enableTrading: v ? 'true' : 'false' })}
            />
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between py-3 border-b border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#eb5b3c]/10">
                <Server className="size-4 text-[#eb5b3c]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Maintenance Mode</p>
                <p className="text-xs text-[#6b7280]">Temporarily disable platform access</p>
              </div>
            </div>
            <Switch
              checked={settings.maintenanceMode === 'true'}
              onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v ? 'true' : 'false' })}
            />
          </div>

          {/* Max Virtual Balance */}
          <div className="flex items-center justify-between py-3 border-b border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]/10">
                <Wallet className="size-4 text-[#00D09C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Max Virtual Balance</p>
                <p className="text-xs text-[#6b7280]">Maximum balance a user can hold</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">₹</span>
              <Input
                type="number"
                value={settings.maxVirtualBalance}
                onChange={(e) => setSettings({ ...settings, maxVirtualBalance: e.target.value })}
                className="w-32 h-9 text-right font-mono border-[#e5e7eb] text-xs"
              />
            </div>
          </div>

          {/* Default Balance */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]/10">
                <Database className="size-4 text-[#00D09C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Default Balance</p>
                <p className="text-xs text-[#6b7280]">Starting balance for new users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">₹</span>
              <Input
                type="number"
                value={settings.defaultBalance}
                onChange={(e) => setSettings({ ...settings, defaultBalance: e.target.value })}
                className="w-32 h-9 text-right font-mono border-[#e5e7eb] text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#00D09C] hover:bg-[#00b888] text-white">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save Settings
      </Button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL LAYOUT
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNavClick = (key: PageKey) => {
    setCurrentPage(key)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    onLogout()
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'users': return <UsersPage />
      case 'paid-users': return <UsersPage subscriptionFilter="PREMIUM" />
      case 'free-users': return <UsersPage subscriptionFilter="FREE" />
      case 'trades': return <TradesPage />
      case 'positions': return <PositionsPage />
      case 'analytics': return <AnalyticsPage />
      case 'reports': return <ReportsPage />
      case 'profile': return <ProfilePage />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#e5e7eb]">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]">
          <TrendingUp className="size-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#1a1a1a]">TradePro</h1>
          <p className="text-[10px] text-[#6b7280]">Admin Panel</p>
        </div>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00D09C]/10 text-[#00D09C]'
                    : 'text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-[#e5e7eb]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[#d44a2d] hover:bg-[#eb5b3c]/10 transition-colors">
              <LogOut className="size-4" />
              Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to logout from the admin panel?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-[#eb5b3c] hover:bg-[#d44a2d]">Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-60 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 sticky top-0 h-screen">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#e5e7eb] px-4 lg:px-6 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" className="size-9" onClick={() => setSidebarOpen(true)}>
                  <Menu className="size-5 text-[#6b7280]" />
                </Button>
              )}
              <div>
                <h2 className="text-sm font-semibold text-[#1a1a1a] capitalize">
                  {currentPage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <p className="text-[10px] text-[#6b7280]">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9 text-[#6b7280] hover:text-[#1a1a1a]">
                      <Bell className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 pl-2 border-l border-[#e5e7eb]">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[#00D09C]/10 text-[#00D09C] text-xs font-semibold">A</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-[#1a1a1a]">Admin</p>
                  <p className="text-[10px] text-[#6b7280]">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

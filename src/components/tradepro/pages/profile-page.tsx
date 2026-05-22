'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Shield,
  Crown,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  BarChart3,
  Landmark,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────

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
  totalTrades: number
  initialCapital: number
  openPositionsCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────

export function ProfilePage() {
  const { user, token, logout } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [themeDark, setThemeDark] = useState(false)

  // ─── Fetch Portfolio ──────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/trade/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPortfolio(json.data)
      }
    } catch {
      // silent
    }
  }, [token])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchPortfolio()
      setLoading(false)
    }
    load()
  }, [fetchPortfolio])

  // ─── Reset Account ────────────────────────────────────────
  const handleResetAccount = () => {
    toast.info('Feature coming soon', {
      description: 'Account reset will be available in a future update.',
    })
  }

  // ─── Theme Toggle ─────────────────────────────────────────
  const handleThemeToggle = () => {
    setThemeDark(!themeDark)
    toast.success(themeDark ? 'Light mode selected (visual only)' : 'Dark mode selected (visual only)')
  }

  // ─── Logout ───────────────────────────────────────────────
  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  // ─── Derived values ───────────────────────────────────────
  const initialCapital = 100000
  const currentPortfolioValue = portfolio?.totalPortfolioValue ?? (user?.virtualBalance ?? initialCapital)
  const totalPnl = portfolio?.totalPnl ?? user?.totalPnl ?? 0
  const totalReturn = portfolio?.totalReturn ?? 0
  const isProfit = totalPnl >= 0
  const winRate = user?.winRate ?? 0
  const totalTrades = portfolio?.totalTrades ?? user?.totalTrades ?? 0

  // ─── Loading State ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-6 lg:p-8 space-y-5">
        <div>
          <Skeleton className="h-8 w-36 mb-2 bg-[#f0f0f5]" />
          <Skeleton className="h-4 w-64 bg-[#f0f0f5]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl bg-[#f0f0f5]" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-xl bg-[#f0f0f5]" />
            <Skeleton className="h-60 rounded-xl bg-[#f0f0f5]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-6 lg:p-8 space-y-5">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
          My Account
        </h1>
        <p className="text-[#6b7280] mt-1 text-sm">
          Manage your account, view stats, and track your trading journey.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Profile Card ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="lg:row-span-2"
        >
          <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm h-full">
            <CardContent className="p-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="size-20 rounded-full bg-[#00D09C]/10 flex items-center justify-center mb-3 ring-2 ring-[#00D09C]/20">
                  <span className="text-2xl font-bold text-[#00D09C]">
                    {user?.name
                      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : '??'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a]">{user?.name ?? 'User'}</h2>
                <p className="text-sm text-[#6b7280] mt-0.5">{user?.email ?? '—'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`border-0 text-[10px] font-semibold ${
                    user?.subscription === 'PREMIUM'
                      ? 'bg-[#00D09C]/10 text-[#00D09C]'
                      : 'bg-[#6b7280]/10 text-[#6b7280]'
                  }`}>
                    <Crown className="size-3 mr-0.5" />
                    {user?.subscription ?? 'FREE'}
                  </Badge>
                  <Badge className="border-0 text-[10px] font-semibold bg-[#00D09C]/10 text-[#00D09C]">
                    {user?.role ?? 'USER'}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-[#e5e7eb] mb-4" />

              {/* User Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#f5f7fa] flex items-center justify-center shrink-0">
                    <Mail className="size-4 text-[#6b7280]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">Email</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{user?.email ?? '—'}</p>
                      {user?.isEmailVerified && <CheckCircle2 className="size-3.5 text-[#00d09c] shrink-0" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#f5f7fa] flex items-center justify-center shrink-0">
                    <Phone className="size-4 text-[#6b7280]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">Phone</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{user?.phone ?? 'Not set'}</p>
                      {user?.isPhoneVerified ? (
                        <CheckCircle2 className="size-3.5 text-[#00d09c] shrink-0" />
                      ) : user?.phone ? (
                        <AlertCircle className="size-3.5 text-[#6b7280]/40 shrink-0" />
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-[#f5f7fa] flex items-center justify-center shrink-0">
                    <CreditCard className="size-4 text-[#6b7280]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">PAN Number</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">{user?.panNumber ?? 'Not set'}</p>
                      {user?.panNumber && <CheckCircle2 className="size-3.5 text-[#00d09c] shrink-0" />}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#e5e7eb] my-4" />

              {/* Last Login */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">Last Login</span>
                <span className="text-xs font-medium text-[#1a1a1a]">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>

              <Separator className="bg-[#e5e7eb] my-4" />

              {/* Settings: Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {themeDark ? <Moon className="size-4 text-[#00D09C]" /> : <Sun className="size-4 text-[#00D09C]" />}
                  <span className="text-sm text-[#1a1a1a]">Dark Mode</span>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    themeDark ? 'bg-[#00D09C]' : 'bg-[#e5e7eb]'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-4 transform rounded-full bg-white transition-transform',
                      themeDark ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <Separator className="bg-[#e5e7eb] my-4" />

              {/* Logout Button */}
              <Button
                variant="outline"
                className="w-full gap-2 border-[#eb5b3c]/30 text-[#eb5b3c] hover:bg-[#eb5b3c]/10 hover:text-[#eb5b3c]"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right: Top Section - Virtual Balance ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm border-l-4 border-l-[#00D09C]">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">
                    Virtual Balance
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mt-1">
                    {formatINRWhole(currentPortfolioValue)}
                    <span className="text-lg opacity-50">.{Math.abs(currentPortfolioValue % 1).toFixed(2).substring(2)}</span>
                  </h3>
                  <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isProfit ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {isProfit ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                    {isProfit ? '+' : ''}{totalReturn.toFixed(2)}% overall return
                  </div>
                </div>
                <Button
                  className="gap-1.5 bg-[#00D09C] text-white font-semibold shadow-md hover:bg-[#00b88a] active:scale-[0.98]"
                  onClick={() => setCurrentPage('trading')}
                >
                  <TrendingUp className="size-4" />
                  New Trade
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-[#f5f7fa] p-3 border border-[#e5e7eb]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    Initial Capital
                  </p>
                  <p className="text-base font-bold text-[#6b7280] mt-1">
                    ₹1,00,000
                  </p>
                </div>
                <div className="rounded-xl bg-[#f5f7fa] p-3 border border-[#e5e7eb]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    Current Value
                  </p>
                  <p className="text-base font-bold text-[#1a1a1a] mt-1">
                    {formatINRWhole(currentPortfolioValue)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 border ${
                  isProfit
                    ? 'bg-[#00d09c]/5 border-[#00d09c]/20'
                    : 'bg-[#eb5b3c]/5 border-[#eb5b3c]/20'
                }`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    Total P&L
                  </p>
                  <p className={`text-base font-bold mt-1 ${isProfit ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right: Bottom Section - Trading Stats ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1a1a1a]">
                  Trading Stats
                </CardTitle>
                <Badge variant="secondary" className="bg-[#00D09C]/10 text-[#00D09C] border-0 text-xs font-semibold">
                  {portfolio?.openPositionsCount ?? 0} Open Position{(portfolio?.openPositionsCount ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Total Trades */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-[#e5e7eb] bg-[#f5f7fa] p-3 border-l-4 border-l-[#00D09C]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Total Trades</p>
                    <div className="size-6 rounded-md bg-[#00D09C]/10 flex items-center justify-center">
                      <BarChart3 className="size-3 text-[#00D09C]" />
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#00D09C]">{totalTrades}</p>
                </motion.div>

                {/* Win Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className={`rounded-xl border p-3 border-l-4 ${winRate >= 50 ? 'border-l-[#00d09c] bg-[#00d09c]/5 border-[#e5e7eb]' : 'border-l-[#eb5b3c] bg-[#eb5b3c]/5 border-[#e5e7eb]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Win Rate</p>
                    <div className={`size-6 rounded-md flex items-center justify-center ${winRate >= 50 ? 'bg-[#00d09c]/10' : 'bg-[#eb5b3c]/10'}`}>
                      <Target className={`size-3 ${winRate >= 50 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`} />
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-bold ${winRate >= 50 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {winRate.toFixed(1)}%
                  </p>
                </motion.div>

                {/* Total P&L */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`rounded-xl border p-3 border-l-4 ${isProfit ? 'border-l-[#00d09c] bg-[#00d09c]/5 border-[#e5e7eb]' : 'border-l-[#eb5b3c] bg-[#eb5b3c]/5 border-[#e5e7eb]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Total P&L</p>
                    <div className={`size-6 rounded-md flex items-center justify-center ${isProfit ? 'bg-[#00d09c]/10' : 'bg-[#eb5b3c]/10'}`}>
                      {isProfit ? <TrendingUp className="size-3 text-[#00d09c]" /> : <TrendingDown className="size-3 text-[#eb5b3c]" />}
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-bold ${isProfit ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </p>
                </motion.div>

                {/* Margin Used */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl border border-[#e5e7eb] bg-[#f5f7fa] p-3 border-l-4 border-l-[#6b7280]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Margin Used</p>
                    <div className="size-6 rounded-md bg-[#6b7280]/10 flex items-center justify-center">
                      <Landmark className="size-3 text-[#6b7280]" />
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#1a1a1a]">
                    {formatINR(portfolio?.marginUsed ?? user?.marginUsed ?? 0)}
                  </p>
                </motion.div>

                {/* Available Margin */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl border border-[#e5e7eb] bg-[#f5f7fa] p-3 border-l-4 border-l-[#00D09C]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Available</p>
                    <div className="size-6 rounded-md bg-[#00D09C]/10 flex items-center justify-center">
                      <Wallet className="size-3 text-[#00D09C]" />
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#00D09C]">
                    {formatINR(portfolio?.availableMargin ?? (user?.virtualBalance ?? initialCapital))}
                  </p>
                </motion.div>

                {/* Realized P&L */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className={`rounded-xl border p-3 border-l-4 ${(portfolio?.totalRealizedPnl ?? 0) >= 0 ? 'border-l-[#00d09c] bg-[#00d09c]/5 border-[#e5e7eb]' : 'border-l-[#eb5b3c] bg-[#eb5b3c]/5 border-[#e5e7eb]'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">Realized P&L</p>
                    <div className={`size-6 rounded-md flex items-center justify-center ${(portfolio?.totalRealizedPnl ?? 0) >= 0 ? 'bg-[#00d09c]/10' : 'bg-[#eb5b3c]/10'}`}>
                      <IndianRupee className={`size-3 ${(portfolio?.totalRealizedPnl ?? 0) >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`} />
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-bold ${(portfolio?.totalRealizedPnl ?? 0) >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {(portfolio?.totalRealizedPnl ?? 0) >= 0 ? '+' : '-'}{formatINR(Math.abs(portfolio?.totalRealizedPnl ?? 0))}
                  </p>
                </motion.div>
              </div>

              <Separator className="bg-[#e5e7eb] my-5" />

              {/* Account Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="gap-2 border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f7fa] hover:text-[#1a1a1a]"
                  onClick={() => setCurrentPage('reports')}
                >
                  <BarChart3 className="size-4" />
                  View Reports
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-[#e5e7eb] text-[#6b7280] hover:bg-[#f5f7fa] hover:text-[#1a1a1a]"
                  onClick={() => setCurrentPage('portfolio')}
                >
                  <Wallet className="size-4" />
                  Portfolio
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-[#eb5b3c]/30 text-[#eb5b3c] hover:bg-[#eb5b3c]/10 hover:text-[#eb5b3c]"
                  onClick={handleResetAccount}
                >
                  <RotateCcw className="size-4" />
                  Reset Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

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
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Shield,
  Crown,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Download,
  LogOut,
  Lock,
  MonitorSmartphone,
  KeyRound,
  HelpCircle,
  MessageSquare,
  Ticket,
  Plus,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  FileText,
  RotateCcw,
  Zap,
  Bell,
  Settings,
  Trophy,
  IndianRupee,
} from 'lucide-react'

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
  bestTradePnl?: number
}

interface AppSettings {
  confirmBeforeTrade: boolean
  defaultOrderType: 'MARKET' | 'LIMIT'
  notifications: boolean
}

// ─── Color Constants ─────────────────────────────────────────────

const C = {
  bg: '#0f0f1a',
  card: '#1e1e2e',
  border: '#2a2a3e',
  green: '#00D09C',
  red: '#eb5b3c',
  white: '#ffffff',
  muted: '#9ca3af',
  mutedDark: '#6b7280',
  cardHover: '#252538',
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatINR(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatINRWhole(value: number): string {
  return '₹' + Math.abs(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Animation Variants ──────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// ─── Component ───────────────────────────────────────────────────

export function ProfilePage() {
  const { user, token, logout } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)

  // ─── Settings State ──────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>({
    confirmBeforeTrade: true,
    defaultOrderType: 'MARKET',
    notifications: true,
  })

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tradepro_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // silent
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings)
    try {
      localStorage.setItem('tradepro_settings', JSON.stringify(newSettings))
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }, [])

  // ─── Fetch Portfolio ─────────────────────────────────────
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

  // ─── Derived values ──────────────────────────────────────
  const availableBalance = portfolio?.virtualBalance ?? user?.virtualBalance ?? 100000
  const usedCapital = portfolio?.marginUsed ?? user?.marginUsed ?? 0
  const totalPnl = portfolio?.totalPnl ?? user?.totalPnl ?? 0
  const isProfit = totalPnl >= 0
  const winRate = user?.winRate ?? 0
  const totalTrades = portfolio?.totalTrades ?? user?.totalTrades ?? 0
  const bestTradePnl = portfolio?.bestTradePnl ?? 0
  const showLowBalanceWarning = availableBalance < 10000

  // ─── PDF Report Download ─────────────────────────────────
  const handleDownloadReport = async (type: 'last' | 'monthly' | 'full') => {
    if (!token) {
      toast.error('Please login to download reports')
      return
    }
    setDownloadingReport(type)
    try {
      const res = await fetch(`/api/profile/report?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Failed to download report')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filenameMap: Record<string, string> = {
        last: 'last-trade-report.pdf',
        monthly: 'monthly-report.pdf',
        full: 'full-trading-report.pdf',
      }
      a.download = filenameMap[type]
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch {
      toast.error('Failed to download report. Please try again.')
    } finally {
      setDownloadingReport(null)
    }
  }

  // ─── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  // ─── Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-5" style={{ background: C.bg }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-72 rounded-xl" style={{ background: C.card }} />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-36 rounded-xl" style={{ background: C.card }} />
            <Skeleton className="h-32 rounded-xl" style={{ background: C.card }} />
            <Skeleton className="h-48 rounded-xl" style={{ background: C.card }} />
            <Skeleton className="h-40 rounded-xl" style={{ background: C.card }} />
          </div>
        </div>
      </div>
    )
  }

  // ─── Section Index Counter ───────────────────────────────
  let sectionIndex = 0

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-5" style={{ background: C.bg }}>
      {/* ── Low Balance Warning Banner ──────────────────────────── */}
      {showLowBalanceWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            background: 'rgba(235, 91, 60, 0.08)',
            borderColor: 'rgba(235, 91, 60, 0.25)',
          }}
        >
          <AlertTriangle className="size-5 shrink-0" style={{ color: C.red }} />
          <p className="text-sm font-medium" style={{ color: C.red }}>
            ⚠️ Low Balance Warning: Your virtual balance is below ₹10,000
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: Profile Header (Sticky)
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* ── 1. PROFILE HEADER CARD ─────────────────────────── */}
            <motion.div
              custom={sectionIndex++}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Card
                className="rounded-xl border overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${C.card} 0%, #1a1a30 50%, ${C.card} 100%)`,
                  borderColor: C.border,
                }}
              >
                <CardContent className="p-6">
                  {/* Top Section: Avatar + Info */}
                  <div className="flex flex-col items-center text-center mb-5">
                    {/* Avatar with green glow ring */}
                    <div
                      className="size-20 rounded-full flex items-center justify-center mb-4 relative"
                      style={{
                        background: `linear-gradient(135deg, rgba(0,208,156,0.15), rgba(0,208,156,0.05))`,
                        boxShadow: '0 0 24px rgba(0,208,156,0.2), inset 0 0 12px rgba(0,208,156,0.1)',
                        border: '2px solid rgba(0,208,156,0.3)',
                      }}
                    >
                      <span className="text-2xl font-bold" style={{ color: C.green }}>
                        {getInitials(user?.name)}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold" style={{ color: C.white }}>
                      {user?.name ?? 'User'}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: C.muted }}>
                      {user?.email ?? '—'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgba(156,163,175,0.1)',
                          color: C.muted,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        ID: {user?.id?.slice(0, 8) ?? '--------'}
                      </span>
                    </div>
                  </div>

                  {/* Wallet Balance & Plan */}
                  <div
                    className="rounded-lg p-4 mb-5"
                    style={{
                      background: 'rgba(0,208,156,0.06)',
                      border: '1px solid rgba(0,208,156,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: C.muted }}
                        >
                          Wallet Balance
                        </p>
                        <p className="text-2xl font-bold mt-1" style={{ color: C.green }}>
                          {formatINRWhole(availableBalance)}
                        </p>
                      </div>
                      <Badge
                        className="border-0 text-[10px] font-bold px-2.5 py-1"
                        style={{
                          background:
                            user?.subscription === 'PREMIUM'
                              ? 'rgba(0,208,156,0.15)'
                              : 'rgba(156,163,175,0.12)',
                          color: user?.subscription === 'PREMIUM' ? C.green : C.muted,
                        }}
                      >
                        <Crown className="size-3 mr-1" />
                        {user?.subscription ?? 'FREE'}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 text-sm font-semibold border-0 h-10"
                      style={{
                        background: 'rgba(0,208,156,0.12)',
                        color: C.green,
                      }}
                      onClick={() => toast.info('Coming soon', { description: 'Profile editing will be available soon.' })}
                    >
                      <User className="size-4" />
                      Edit Profile
                    </Button>
                    <Button
                      className="flex-1 gap-2 text-sm font-semibold border-0 h-10"
                      style={{
                        background: 'rgba(156,163,175,0.08)',
                        color: C.muted,
                        border: `1px solid ${C.border}`,
                      }}
                      onClick={() => toast.info('Coming soon', { description: 'Password change will be available soon.' })}
                    >
                      <KeyRound className="size-4" />
                      Change Password
                    </Button>
                  </div>

                  {/* Contact Details */}
                  <Separator className="my-5" style={{ background: C.border }} />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(156,163,175,0.08)' }}
                      >
                        <Mail className="size-4" style={{ color: C.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.mutedDark }}>
                          Email
                        </p>
                        <p className="text-sm font-medium truncate" style={{ color: C.white }}>
                          {user?.email ?? '—'}
                        </p>
                      </div>
                      {user?.isEmailVerified && (
                        <div className="size-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,208,156,0.15)' }}>
                          <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke={C.green} strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(156,163,175,0.08)' }}
                      >
                        <Shield className="size-4" style={{ color: C.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.mutedDark }}>
                          Role
                        </p>
                        <p className="text-sm font-medium" style={{ color: C.white }}>
                          {user?.role ?? 'USER'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" style={{ background: C.border }} />

                  {/* Last Login */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.muted }}>
                      Last Login
                    </span>
                    <span className="text-xs font-medium" style={{ color: C.white }}>
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: C.muted }}>
                      Member Since
                    </span>
                    <span className="text-xs font-medium" style={{ color: C.white }}>
                      {formatDate(user?.createdAt ?? null)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: All Other Sections
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">
          {/* ── 2. WALLET SECTION ────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Available Balance */}
              <Card
                className="rounded-xl border"
                style={{ background: C.card, borderColor: C.border }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,208,156,0.12)' }}
                    >
                      <Wallet className="size-4" style={{ color: C.green }} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                      Available Balance
                    </span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: C.green }}>
                    {formatINRWhole(availableBalance)}
                  </p>
                </CardContent>
              </Card>

              {/* Used Capital */}
              <Card
                className="rounded-xl border"
                style={{ background: C.card, borderColor: C.border }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(156,163,175,0.08)' }}
                    >
                      <IndianRupee className="size-4" style={{ color: C.muted }} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                      Used Capital
                    </span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: C.muted }}>
                    {formatINRWhole(usedCapital)}
                  </p>
                </CardContent>
              </Card>

              {/* Total P&L */}
              <Card
                className="rounded-xl border"
                style={{
                  background: C.card,
                  borderColor: isProfit ? 'rgba(0,208,156,0.25)' : 'rgba(235,91,60,0.25)',
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: isProfit ? 'rgba(0,208,156,0.12)' : 'rgba(235,91,60,0.12)',
                      }}
                    >
                      {isProfit ? (
                        <TrendingUp className="size-4" style={{ color: C.green }} />
                      ) : (
                        <TrendingDown className="size-4" style={{ color: C.red }} />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                      Total P&L
                    </span>
                  </div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: isProfit ? C.green : C.red }}
                  >
                    {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Actions */}
            <div className="flex gap-3 mt-4">
              <Button
                className="gap-2 text-sm font-semibold border-0 h-10"
                style={{ background: 'rgba(0,208,156,0.12)', color: C.green }}
                onClick={() => toast.info('Coming soon', { description: 'Adding virtual money will be available soon.' })}
              >
                <Plus className="size-4" />
                Add Money
              </Button>
              <Button
                className="gap-2 text-sm font-semibold h-10"
                style={{
                  background: 'transparent',
                  color: C.muted,
                  border: `1px solid ${C.border}`,
                }}
                onClick={() => toast.info('Coming soon', { description: 'Withdrawal will be available soon.' })}
              >
                <ArrowUpRight className="size-4" />
                Withdraw
              </Button>
            </div>
          </motion.div>

          {/* ── 3. SUBSCRIPTION SECTION ──────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                    Subscription
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: C.muted }}>Current Plan:</span>
                      <Badge
                        className="border-0 text-xs font-bold px-3 py-1"
                        style={{
                          background:
                            user?.subscription === 'PREMIUM'
                              ? 'rgba(0,208,156,0.15)'
                              : 'rgba(156,163,175,0.1)',
                          color: user?.subscription === 'PREMIUM' ? C.green : C.muted,
                        }}
                      >
                        <Crown className="size-3 mr-1" />
                        {user?.subscription ?? 'FREE'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: C.muted }}>Plan Expiry:</span>
                      <span className="text-sm font-medium" style={{ color: C.white }}>
                        {user?.subscription === 'PREMIUM' ? '—' : 'No expiry (Free tier)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="gap-2 text-sm font-semibold border-0 h-10 px-5"
                      style={{ background: C.green, color: '#000' }}
                      onClick={() => toast.info('Coming soon', { description: 'Plan upgrade will be available soon.' })}
                    >
                      <Zap className="size-4" />
                      Upgrade Plan
                    </Button>
                    <Button
                      className="gap-2 text-sm font-semibold h-10 px-5 opacity-50 cursor-not-allowed"
                      style={{
                        background: 'transparent',
                        color: C.muted,
                        border: `1px solid ${C.border}`,
                      }}
                      disabled
                    >
                      <RotateCcw className="size-4" />
                      Renew Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 4. SETTINGS SECTION ──────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                    Settings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Confirm before trade */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,208,156,0.1)' }}
                    >
                      <Shield className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.white }}>
                        Confirm before trade
                      </p>
                      <p className="text-xs" style={{ color: C.muted }}>
                        Show confirmation dialog before placing orders
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.confirmBeforeTrade}
                    onCheckedChange={(checked) =>
                      saveSettings({ ...settings, confirmBeforeTrade: checked })
                    }
                    className="data-[state=checked]:bg-[#00D09C]"
                  />
                </div>

                <Separator style={{ background: C.border }} />

                {/* Default order type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,208,156,0.1)' }}
                    >
                      <BarChart3 className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.white }}>
                        Default order type
                      </p>
                      <p className="text-xs" style={{ color: C.muted }}>
                        Choose your preferred order type
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                      style={{
                        background:
                          settings.defaultOrderType === 'MARKET'
                            ? 'rgba(0,208,156,0.15)'
                            : 'rgba(156,163,175,0.06)',
                        color: settings.defaultOrderType === 'MARKET' ? C.green : C.muted,
                        border:
                          settings.defaultOrderType === 'MARKET'
                            ? '1px solid rgba(0,208,156,0.3)'
                            : `1px solid ${C.border}`,
                      }}
                      onClick={() =>
                        saveSettings({ ...settings, defaultOrderType: 'MARKET' })
                      }
                    >
                      Market
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                      style={{
                        background:
                          settings.defaultOrderType === 'LIMIT'
                            ? 'rgba(0,208,156,0.15)'
                            : 'rgba(156,163,175,0.06)',
                        color: settings.defaultOrderType === 'LIMIT' ? C.green : C.muted,
                        border:
                          settings.defaultOrderType === 'LIMIT'
                            ? '1px solid rgba(0,208,156,0.3)'
                            : `1px solid ${C.border}`,
                      }}
                      onClick={() =>
                        saveSettings({ ...settings, defaultOrderType: 'LIMIT' })
                      }
                    >
                      Limit
                    </button>
                  </div>
                </div>

                <Separator style={{ background: C.border }} />

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,208,156,0.1)' }}
                    >
                      <Bell className="size-4" style={{ color: C.green }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.white }}>
                        Notifications
                      </p>
                      <p className="text-xs" style={{ color: C.muted }}>
                        Receive trade alerts and updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      saveSettings({ ...settings, notifications: checked })
                    }
                    className="data-[state=checked]:bg-[#00D09C]"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 5. PERFORMANCE SUMMARY ───────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5" style={{ color: C.green }} />
                    <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                      Performance Summary
                    </CardTitle>
                  </div>
                  <Badge
                    className="border-0 text-[10px] font-bold"
                    style={{
                      background: 'rgba(0,208,156,0.1)',
                      color: C.green,
                    }}
                  >
                    {totalTrades} Trade{totalTrades !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 gap-3"
                >
                  {/* Total Trades */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(0,208,156,0.04)',
                      border: '1px solid rgba(0,208,156,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="size-4" style={{ color: C.green }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Total Trades
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: C.green }}>
                      {totalTrades}
                    </p>
                  </motion.div>

                  {/* Win Rate */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: winRate >= 50 ? 'rgba(0,208,156,0.04)' : 'rgba(235,91,60,0.04)',
                      border: winRate >= 50 ? '1px solid rgba(0,208,156,0.12)' : '1px solid rgba(235,91,60,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="size-4" style={{ color: winRate >= 50 ? C.green : C.red }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Win Rate
                      </span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: winRate >= 50 ? C.green : C.red }}>
                      {winRate.toFixed(1)}%
                    </p>
                  </motion.div>

                  {/* Total P&L */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: isProfit ? 'rgba(0,208,156,0.04)' : 'rgba(235,91,60,0.04)',
                      border: isProfit ? '1px solid rgba(0,208,156,0.12)' : '1px solid rgba(235,91,60,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isProfit ? (
                        <TrendingUp className="size-4" style={{ color: C.green }} />
                      ) : (
                        <TrendingDown className="size-4" style={{ color: C.red }} />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Total P&L
                      </span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: isProfit ? C.green : C.red }}>
                      {isProfit ? '+' : '-'}{formatINR(Math.abs(totalPnl))}
                    </p>
                  </motion.div>

                  {/* Best Trade */}
                  <motion.div
                    variants={staggerChild}
                    className="rounded-xl p-4"
                    style={{
                      background: bestTradePnl >= 0 ? 'rgba(0,208,156,0.04)' : 'rgba(235,91,60,0.04)',
                      border: bestTradePnl >= 0 ? '1px solid rgba(0,208,156,0.12)' : '1px solid rgba(235,91,60,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="size-4" style={{ color: bestTradePnl >= 0 ? C.green : C.red }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                        Best Trade
                      </span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: bestTradePnl >= 0 ? C.green : C.red }}>
                      {bestTradePnl >= 0 ? '+' : '-'}{formatINR(Math.abs(bestTradePnl))}
                    </p>
                  </motion.div>
                </motion.div>

                <div className="mt-4">
                  <Button
                    className="w-full gap-2 text-sm font-semibold h-10 border-0"
                    style={{ background: 'rgba(0,208,156,0.1)', color: C.green }}
                    onClick={() => setCurrentPage('reports')}
                  >
                    <BarChart3 className="size-4" />
                    View Full Report
                    <ChevronRight className="size-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 6. PDF REPORT DOWNLOAD ───────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{
                background: C.card,
                borderColor: C.border,
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                    Download Reports
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Last Trade Report */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all group"
                  style={{
                    background: 'rgba(0,208,156,0.04)',
                    border: '1px solid rgba(0,208,156,0.1)',
                  }}
                  onClick={() => handleDownloadReport('last')}
                  disabled={downloadingReport !== null}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,208,156,0.1)' }}
                  >
                    {downloadingReport === 'last' ? (
                      <div className="size-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.green, borderTopColor: 'transparent' }} />
                    ) : (
                      <Download className="size-4" style={{ color: C.green }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Download Last Trade Report
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Your most recent trade details
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    style={{ color: C.muted }}
                  />
                </button>

                {/* Monthly Report */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all group"
                  style={{
                    background: 'rgba(0,208,156,0.04)',
                    border: '1px solid rgba(0,208,156,0.1)',
                  }}
                  onClick={() => handleDownloadReport('monthly')}
                  disabled={downloadingReport !== null}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,208,156,0.1)' }}
                  >
                    {downloadingReport === 'monthly' ? (
                      <div className="size-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.green, borderTopColor: 'transparent' }} />
                    ) : (
                      <Download className="size-4" style={{ color: C.green }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Download Monthly Report
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Summary of this month&apos;s trading activity
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    style={{ color: C.muted }}
                  />
                </button>

                {/* Full Trading Report */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all group"
                  style={{
                    background: 'rgba(0,208,156,0.04)',
                    border: '1px solid rgba(0,208,156,0.1)',
                  }}
                  onClick={() => handleDownloadReport('full')}
                  disabled={downloadingReport !== null}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,208,156,0.1)' }}
                  >
                    {downloadingReport === 'full' ? (
                      <div className="size-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.green, borderTopColor: 'transparent' }} />
                    ) : (
                      <Download className="size-4" style={{ color: C.green }} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Download Full Trading Report
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Complete history of all your trades
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    style={{ color: C.muted }}
                  />
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 7. SECURITY SECTION ──────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                    Security
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#252538]"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => toast.info('Coming soon', { description: 'Password change will be available soon.' })}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(156,163,175,0.08)' }}
                  >
                    <KeyRound className="size-4" style={{ color: C.muted }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Change Password
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Update your account password
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#252538]"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => toast.info('Coming soon', { description: 'Remote logout will be available soon.' })}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(156,163,175,0.08)' }}
                  >
                    <MonitorSmartphone className="size-4" style={{ color: C.muted }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Logout from all devices
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      End all active sessions
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg opacity-50 cursor-not-allowed"
                  style={{ border: `1px solid ${C.border}` }}
                  disabled
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(156,163,175,0.08)' }}
                  >
                    <Shield className="size-4" style={{ color: C.muted }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>
                      Enable 2FA{' '}
                      <span
                        className="text-xs font-normal ml-1"
                        style={{ color: C.muted }}
                      >
                        (Coming soon)
                      </span>
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Add extra security to your account
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 8. HELP & SUPPORT ────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              className="rounded-xl border"
              style={{ background: C.card, borderColor: C.border }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-5" style={{ color: C.green }} />
                  <CardTitle className="text-base font-semibold" style={{ color: C.white }}>
                    Help & Support
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#252538]"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => setCurrentPage('faq')}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,208,156,0.1)' }}
                  >
                    <HelpCircle className="size-4" style={{ color: C.green }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>FAQ</p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Find answers to common questions
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#252538]"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => setCurrentPage('contact-us')}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,208,156,0.1)' }}
                  >
                    <MessageSquare className="size-4" style={{ color: C.green }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>Contact Support</p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Get help from our support team
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>

                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-[#252538]"
                  style={{ border: `1px solid ${C.border}` }}
                  onClick={() => toast.info('Coming soon', { description: 'Ticket system will be available soon.' })}
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(156,163,175,0.08)' }}
                  >
                    <Ticket className="size-4" style={{ color: C.muted }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: C.white }}>Raise Ticket</p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Submit a support request
                    </p>
                  </div>
                  <ChevronRight className="size-4" style={{ color: C.muted }} />
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── 9. LOGOUT ────────────────────────────────────────── */}
          <motion.div
            custom={sectionIndex++}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Button
              className="w-full gap-3 text-base font-semibold h-12 rounded-xl border-0 transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: 'rgba(235,91,60,0.12)',
                color: C.red,
                border: '1px solid rgba(235,91,60,0.25)',
              }}
              onClick={handleLogout}
            >
              <LogOut className="size-5" />
              Logout
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

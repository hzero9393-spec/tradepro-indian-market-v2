'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Star,
  StarOff,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
  Loader2,
  Trash2,
  CandlestickChart,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import { formatINR } from '@/lib/format'
import { StockLogo } from '@/components/tradepro/ui/stock-logo'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface WatchlistItem {
  id: string
  symbol: string
  name: string | null
  segment: string
  addedAt: string
  currentPrice: number
  change: number
  changePercent: number
  sector: string
}

function getSectorColor(sector: string): string {
  const colors: Record<string, string> = {
    'Banking': 'bg-[#00D09C]/8 text-[#00D09C]',
    'IT': 'bg-[#00B386]/8 text-[#00B386]',
    'Pharma': 'bg-purple-500/8 text-purple-600',
    'Auto': 'bg-orange-500/8 text-orange-600',
    'FMCG': 'bg-pink-500/8 text-pink-600',
    'Energy': 'bg-yellow-500/8 text-yellow-700',
    'Metals': 'bg-gray-500/8 text-gray-600',
    'Financial Services': 'bg-[#00D09C]/8 text-[#00D09C]',
    'Telecom': 'bg-teal-500/8 text-teal-600',
    'Cement': 'bg-amber-500/8 text-amber-700',
    'Infrastructure': 'bg-sky-500/8 text-sky-600',
    'INDEX': 'bg-blue-500/8 text-blue-600',
  }
  return colors[sector] || 'bg-[#6b7280]/8 text-[#6b7280]'
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f2f5]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="size-9 rounded-lg bg-[#f0f0f5]" />
        <div className="min-w-0">
          <Skeleton className="h-4 w-20 mb-1.5 bg-[#f0f0f5]" />
          <Skeleton className="h-3 w-28 bg-[#f0f0f5]" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-14 bg-[#f0f0f5] rounded-full" />
        <div className="text-right min-w-[100px]">
          <Skeleton className="h-5 w-20 mb-1 bg-[#f0f0f5] ml-auto" />
        </div>
        <Skeleton className="h-6 w-16 bg-[#f0f0f5] rounded-full" />
        <Skeleton className="size-8 rounded-lg bg-[#f0f0f5]" />
      </div>
    </div>
  )
}

export function WatchlistPage() {
  const { token } = useAuthStore()
  const { navigateToStock, navigateToIndex } = useAppStore()

  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null)

  const fetchWatchlist = useCallback(async (isRefresh = false) => {
    if (!token) { setLoading(false); return }
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data)
      }
    } catch {
      toast.error('Failed to load watchlist')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchWatchlist(true), 30000)
    return () => clearInterval(interval)
  }, [fetchWatchlist])

  const handleRemove = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRemovingSymbol(symbol)
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.symbol !== symbol))
        toast.success(`${symbol} removed from watchlist`)
      } else {
        toast.error(data.error || 'Failed to remove')
      }
    } catch {
      toast.error('Failed to remove from watchlist')
    } finally {
      setRemovingSymbol(null)
    }
  }

  const handleClick = (item: WatchlistItem) => {
    if (item.segment === 'INDEX') {
      navigateToIndex(item.symbol)
    } else {
      navigateToStock(item.symbol)
    }
  }

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (i) =>
          i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (i.name && i.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items

  // Summary stats
  const gainers = items.filter((i) => i.changePercent > 0).length
  const losers = items.filter((i) => i.changePercent < 0).length
  const totalValue = items.reduce((sum, i) => sum + (i.currentPrice || 0), 0)

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* ═══ Header ═════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30"
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f59e0b]/10">
                <Star className="size-5 text-[#f59e0b]" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
                  Watchlist
                </h1>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Track your favourite stocks and indices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6b7280]" />
                <Input
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full sm:w-72 bg-[#f5f7fa] border-[#e5e7eb] text-sm text-[#1a1a1a] placeholder:text-[#6b7280] focus:ring-[#00D09C]/20 focus:border-[#00D09C] rounded-xl"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 rounded-xl border-[#e5e7eb] text-[#6b7280] hover:text-[#00D09C] hover:border-[#00D09C]/30"
                onClick={() => fetchWatchlist(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-[#00B386]">
                <TrendingUp className="size-3" />
                {gainers} Gainers
              </span>
              <span className="flex items-center gap-1 text-[#EB5B3C]">
                <ArrowDownRight className="size-3" />
                {losers} Losers
              </span>
              <span className="text-[#6b7280]">
                {items.length} items
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ Main Content ═════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Empty State */}
        {!loading && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="size-16 rounded-full bg-[#f59e0b]/10 flex items-center justify-center mb-4">
                  <Star className="size-8 text-[#f59e0b]/40" />
                </div>
                <p className="text-[#1a1a1a] font-bold text-lg">Your watchlist is empty</p>
                <p className="text-[#6b7280] text-sm mt-2 max-w-md">
                  Add stocks to your watchlist by clicking the star icon on any stock. You can also add indices like NIFTY, BANKNIFTY to track them here.
                </p>
                <Button
                  className="mt-5 gap-2 bg-[#00D09C] hover:bg-[#00b88a] text-white font-semibold rounded-xl"
                  onClick={() => useAppStore.getState().setCurrentPage('trading')}
                >
                  <CandlestickChart className="size-4" />
                  Browse Stocks
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search Empty State */}
        {!loading && items.length > 0 && filteredItems.length === 0 && searchQuery && (
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-3">
                <Search className="size-6 text-[#6b7280]/40" />
              </div>
              <p className="text-[#1a1a1a] font-semibold text-sm">No matches for &quot;{searchQuery}&quot;</p>
              <p className="text-[#6b7280] text-xs mt-1">Try a different search term</p>
            </CardContent>
          </Card>
        )}

        {/* Watchlist Items */}
        {items.length > 0 && (
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#f8f9fb] border-b border-[#e5e7eb]">
              <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                Instrument
              </span>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="hidden md:inline text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                  Segment
                </span>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider text-right min-w-[90px]">
                  LTP
                </span>
                <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider min-w-[72px] text-center">
                  Change
                </span>
                <span className="w-8" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-h-[calc(100vh-320px)] overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
                >
                  {filteredItems.map((item, index) => {
                    const isPositive = item.changePercent >= 0
                    const isRemoving = removingSymbol === item.symbol

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.02, 0.4), duration: 0.3 }}
                      >
                        <button
                          onClick={() => handleClick(item)}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fb] transition-colors cursor-pointer text-left border-b border-[#f0f2f5] last:border-b-0 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <StockLogo symbol={item.symbol} name={item.name || item.symbol} sector={item.segment === 'INDEX' ? 'INDEX' : item.sector} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1a1a1a] truncate">{item.symbol}</span>
                                {item.segment === 'INDEX' && (
                                  <span className="text-[8px] font-bold bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    INDEX
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6b7280] truncate mt-0.5 max-w-[200px]">
                                {item.name || item.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            <span className={`hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSectorColor(item.segment === 'INDEX' ? 'INDEX' : item.sector)}`}>
                              {item.segment === 'INDEX' ? 'Index' : item.sector}
                            </span>
                            <div className="text-right min-w-[90px]">
                              <span className="text-base font-bold font-mono font-tabular text-[#1a1a1a]">
                                {item.currentPrice > 0 ? formatINR(item.currentPrice) : '—'}
                              </span>
                            </div>
                            <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-bold min-w-[72px] justify-center ${
                              isPositive
                                ? 'bg-[#00B386]/10 text-[#00B386]'
                                : 'bg-[#EB5B3C]/10 text-[#EB5B3C]'
                            }`}>
                              {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                              {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                            </div>
                            <button
                              onClick={(e) => handleRemove(item.symbol, e)}
                              disabled={isRemoving}
                              className="size-8 rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#EB5B3C] hover:bg-[#EB5B3C]/5 transition-all opacity-0 group-hover:opacity-100"
                              title="Remove from watchlist"
                            >
                              {isRemoving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </button>
                          </div>
                        </button>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}
      </div>
    </div>
  )
}

function cn(...args: (string | boolean | undefined | null)[]) {
  return args.filter(Boolean).join(' ')
}

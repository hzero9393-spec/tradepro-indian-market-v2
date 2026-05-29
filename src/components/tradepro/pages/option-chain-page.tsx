'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  GitBranch,
  Minus,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Activity,
  IndianRupee,
  Target,
  CandlestickChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/auth-store'
import { useTradeSuccess } from '@/components/tradepro/trade-success-popup'
import { useNotifications } from '@/lib/use-notifications'
import { useMarketData } from '@/lib/market-data'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// ─── Types ───────────────────────────────────────────────────────────
interface OptionRow {
  strike: number
  ceOI: number
  ceOIChngPct: number
  ceLTP: number
  ceChngPct: number
  ceIV: number
  ceVolume: number
  peVolume: number
  peIV: number
  peChngPct: number
  peLTP: number
  peOIChngPct: number
  peOI: number
}

type Instrument = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX' | 'MIDCPNIFTY'

// ─── Fallback Mock Data Generator ────────────────────────────────────
function generateMockData(spotPrice: number, instrument: Instrument): OptionRow[] {
  const strikes: number[] = []
  const step = instrument === 'SENSEX' || instrument === 'BANKNIFTY' ? 100 : 50
  const range = 500
  const startStrike = Math.floor((spotPrice - range) / step) * step
  const endStrike = Math.ceil((spotPrice + range) / step) * step

  for (let s = startStrike; s <= endStrike; s += step) {
    strikes.push(s)
  }

  return strikes.map((strike) => {
    const diffFromSpot = strike - spotPrice
    const isATM = Math.abs(diffFromSpot) < step / 2
    const ceITM = strike < spotPrice
    const ceIntrinsic = ceITM ? spotPrice - strike : 0
    const ceTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const ceLTP = Math.max(0.05, ceIntrinsic + ceTimeValue * (0.6 + Math.random() * 0.8))
    const ceChngPct = (Math.random() - 0.5) * 20
    const ceIV = Math.max(5, 18 - diffFromSpot * 0.01 + Math.random() * 8)
    const ceOI = Math.max(0.5, (isATM ? 80 : 40 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const ceOIChngPct = (Math.random() - 0.4) * 30
    const ceVolume = Math.max(100, ceOI * 1000 * (0.3 + Math.random() * 0.7))
    const peITM = strike > spotPrice
    const peIntrinsic = peITM ? strike - spotPrice : 0
    const peTimeValue = Math.max(50, (250 - Math.abs(diffFromSpot) * 0.3) * (isATM ? 1.2 : 1))
    const peLTP = Math.max(0.05, peIntrinsic + peTimeValue * (0.6 + Math.random() * 0.8))
    const peChngPct = (Math.random() - 0.5) * 20
    const peIV = Math.max(5, 18 + diffFromSpot * 0.01 + Math.random() * 8)
    const peOI = Math.max(0.5, (isATM ? 85 : 45 - Math.abs(diffFromSpot) * 0.04) * (0.5 + Math.random()))
    const peOIChngPct = (Math.random() - 0.4) * 30
    const peVolume = Math.max(100, peOI * 1000 * (0.3 + Math.random() * 0.7))

    return {
      strike,
      ceOI: Number(ceOI.toFixed(1)),
      ceOIChngPct: Number(ceOIChngPct.toFixed(1)),
      ceLTP: Number(ceLTP.toFixed(2)),
      ceChngPct: Number(ceChngPct.toFixed(1)),
      ceIV: Number(ceIV.toFixed(1)),
      ceVolume: Math.round(ceVolume),
      peVolume: Math.round(peVolume),
      peIV: Number(peIV.toFixed(1)),
      peChngPct: Number(peChngPct.toFixed(1)),
      peLTP: Number(peLTP.toFixed(2)),
      peOIChngPct: Number(peOIChngPct.toFixed(1)),
      peOI: Number(peOI.toFixed(1)),
    }
  })
}

const INSTRUMENT_CONFIG: Record<Instrument, { step: number; lotSize: number }> = {
  NIFTY: { step: 50, lotSize: 50 },
  BANKNIFTY: { step: 100, lotSize: 15 },
  FINNIFTY: { step: 50, lotSize: 40 },
  SENSEX: { step: 100, lotSize: 20 },
  MIDCPNIFTY: { step: 50, lotSize: 75 },
}

const EXPIRIES = [
  { label: '27 Mar 2025', type: 'Weekly' },
  { label: '03 Apr 2025', type: 'Weekly' },
  { label: '24 Apr 2025', type: 'Monthly' },
  { label: '29 May 2025', type: 'Monthly' },
  { label: '26 Jun 2025', type: 'Monthly' },
]

// ─── Quick Trade Modal (Professional Groww-style) ───────────────────
function QuickTradeModal({
  open,
  onClose,
  row,
  side,
  spotPrice,
  instrument,
}: {
  open: boolean
  onClose: () => void
  row: OptionRow | null
  side: 'CE' | 'PE'
  spotPrice: number
  instrument: Instrument
}) {
  const { token } = useAuthStore()
  const { showTradeSuccess } = useTradeSuccess()
  const { notify } = useNotifications()
  const [lots, setLots] = useState(1)
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY')
  const [placing, setPlacing] = useState(false)
  const [stopLoss, setStopLoss] = useState('')
  const [target, setTarget] = useState('')

  if (!row) return null

  const ltp = side === 'CE' ? row.ceLTP : row.peLTP
  const chgPct = side === 'CE' ? row.ceChngPct : row.peChngPct
  const iv = side === 'CE' ? row.ceIV : row.peIV
  const lotSize = INSTRUMENT_CONFIG[instrument]?.lotSize || 50
  const totalQty = lots * lotSize
  const marginRequired = Math.round(ltp * totalQty * 1.2)
  const isBuy = direction === 'BUY'
  const isITM = side === 'CE' ? row.strike < spotPrice : row.strike > spotPrice

  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error('Please login to trade')
      return
    }
    setPlacing(true)
    try {
      const res = await fetch('/api/trade/place', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: instrument,
          direction,
          orderType: 'MARKET',
          segment: 'OPTIONS',
          productType: 'INTRADAY',
          quantity: totalQty,
          lots,
          optionType: side,
          strikePrice: row.strike,
          price: ltp,
          ...(stopLoss && parseFloat(stopLoss) > 0 ? { stopLoss: parseFloat(stopLoss) } : {}),
          ...(target && parseFloat(target) > 0 ? { target: parseFloat(target) } : {}),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        showTradeSuccess({
          symbol: instrument,
          type: direction,
          qty: totalQty,
          price: ltp,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
          orderId: data.order?.id?.slice(-8).toUpperCase() || 'N/A',
          segment: 'OPTIONS',
          optionType: side,
          strikePrice: row.strike,
          totalValue: data.order?.totalValue,
          brokerage: data.order?.brokerage,
        })

        // Fire a direct browser push notification as well
        notify(`${side === 'CE' ? 'Call' : 'Put'} Option Trade: ${instrument} ₹${row.strike.toLocaleString()}`, {
          body: `${direction} ${lots} Lot${lots > 1 ? 's' : ''} × ${side} ₹${row.strike.toLocaleString()} at ₹${ltp.toFixed(2)}`,
          tag: `options-${instrument}-${row.strike}-${side}-${Date.now()}`,
          data: { type: 'TRADE_EXECUTED', link: '/positions' },
        })

        onClose()
      } else {
        toast.error(data.error || 'Failed to place order')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-[#e5e7eb] text-[#1a1a1a] p-0 overflow-hidden rounded-xl">
        {/* Header with CE/PE color */}
        <div className={cn(
          'px-5 py-4',
          side === 'CE' ? 'bg-gradient-to-r from-[#00B386] to-[#00D09C]' : 'bg-gradient-to-r from-[#d44f33] to-[#EB5B3C]'
        )}>
          <DialogTitle className="flex items-center justify-between text-white">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium opacity-80 bg-white/20 px-2 py-0.5 rounded-md">{instrument}</span>
                <span className="text-xs font-medium opacity-80 bg-white/20 px-2 py-0.5 rounded-md">{isITM ? 'ITM' : 'OTM'}</span>
              </div>
              <div className="text-xl font-bold">{side === 'CE' ? 'CALL' : 'PUT'} ₹{row.strike.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-tabular font-bold">₹{ltp.toFixed(2)}</div>
              <div className={cn(
                'text-sm font-semibold',
                chgPct >= 0 ? 'text-white/90' : 'text-white/90'
              )}>
                {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
              </div>
            </div>
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('BUY')}
              className={cn(
                'py-3 rounded-lg font-bold text-sm transition-all',
                direction === 'BUY'
                  ? 'bg-[#00d09c] text-white shadow-md shadow-[#00d09c]/25'
                  : 'bg-[#f5f7fa] text-[#6b7280] hover:bg-[#e5e7eb]'
              )}
            >
              BUY
            </button>
            <button
              onClick={() => setDirection('SELL')}
              className={cn(
                'py-3 rounded-lg font-bold text-sm transition-all',
                direction === 'SELL'
                  ? 'bg-[#eb5b3c] text-white shadow-md shadow-[#eb5b3c]/25'
                  : 'bg-[#f5f7fa] text-[#6b7280] hover:bg-[#e5e7eb]'
              )}
            >
              SELL
            </button>
          </div>

          {/* Lots Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Lots</label>
            <div className="flex items-center gap-3">
              <button
                className="size-10 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:bg-[#f5f7fa] active:bg-[#e5e7eb] transition-colors"
                onClick={() => setLots(Math.max(1, lots - 1))}
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                value={lots}
                onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center font-mono font-tabular text-lg font-bold bg-white border-[#e5e7eb] h-10"
              />
              <button
                className="size-10 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] hover:bg-[#f5f7fa] active:bg-[#e5e7eb] transition-colors"
                onClick={() => setLots(lots + 1)}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Stop Loss & Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#EB5B3C]" />
                Stop Loss
              </label>
              <Input
                type="number"
                placeholder="Optional"
                step="0.05"
                min="0"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="font-mono font-tabular bg-white border-[#e5e7eb] h-10 focus:ring-[#EB5B3C]/20 focus:border-[#EB5B3C]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#00B386]" />
                Target
              </label>
              <Input
                type="number"
                placeholder="Optional"
                step="0.05"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="font-mono font-tabular bg-white border-[#e5e7eb] h-10 focus:ring-[#00B386]/20 focus:border-[#00B386]"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f5f7fa] rounded-lg p-4 space-y-2.5 text-sm border border-[#e5e7eb]">
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af] text-xs">Lot Size</span>
              <span className="font-mono font-tabular font-medium text-[#1a1a1a]">{lotSize}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af] text-xs">Total Qty</span>
              <span className="font-mono font-tabular font-medium text-[#1a1a1a]">{totalQty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af] text-xs">IV</span>
              <span className="font-mono font-tabular font-medium text-[#1a1a1a]">{iv.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af] text-xs">Spot Price</span>
              <span className="font-mono font-tabular font-medium text-[#1a1a1a]">₹{spotPrice.toLocaleString()}</span>
            </div>
            <div className="border-t border-[#e5e7eb] pt-2.5 flex justify-between items-center">
              <span className="text-[#9ca3af] font-semibold text-xs">Approx. Margin</span>
              <span className="font-mono font-tabular font-bold text-[#1a1a1a]">₹{marginRequired.toLocaleString()}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className={cn(
              'w-full py-3.5 rounded-lg font-bold text-white text-sm transition-all active:scale-[0.98]',
              isBuy
                ? 'bg-[#00d09c] hover:bg-[#00b888] shadow-lg shadow-[#00d09c]/20'
                : 'bg-[#eb5b3c] hover:bg-[#d44f33] shadow-lg shadow-[#eb5b3c]/20'
            )}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Placing Order...
              </span>
            ) : (
              `${direction} ${lots} Lot${lots > 1 ? 's' : ''} × ${side} ₹${row.strike.toLocaleString()}`
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────
function OptionChainSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-20 bg-[#f0f0f5]" />
                <Skeleton className="size-7 rounded-lg bg-[#f0f0f5]" />
              </div>
              <Skeleton className="h-7 w-24 bg-[#f0f0f5]" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table Skeleton */}
      <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
        <CardContent className="p-0">
          <div className="p-4">
            <Skeleton className="h-6 w-48 bg-[#f0f0f5] mb-3" />
            <div className="flex gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg bg-[#f0f0f5]" />
              ))}
            </div>
          </div>
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-t border-[#e5e7eb]">
                <Skeleton className="h-3 w-12 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-10 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-14 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-10 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-12 bg-[#f0f0f5] mx-auto" />
                <Skeleton className="h-3 w-10 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-14 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-10 bg-[#f0f0f5]" />
                <Skeleton className="h-3 w-12 bg-[#f0f0f5]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export function OptionChainPage() {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY')
  const [expiryIdx, setExpiryIdx] = useState(0)
  const [selectedRow, setSelectedRow] = useState<OptionRow | null>(null)
  const [selectedSide, setSelectedSide] = useState<'CE' | 'PE'>('CE')
  const [modalOpen, setModalOpen] = useState(false)

  const [data, setData] = useState<OptionRow[]>([])
  const [spotPrice, setSpotPrice] = useState(0)
  const [apiPcr, setApiPcr] = useState(0)
  const [apiMaxPain, setApiMaxPain] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const atmRef = useRef<HTMLTableRowElement>(null)

  // ─── Real-time market data from client engine ────────────────
  const { optionChains: liveOptionChains, indices: liveIndices, isConnected: isLiveConnected } = useMarketData()

  // ─── Build option chain from live data ───────────────────────
  const liveData = useMemo(() => {
    if (!isLiveConnected) return null
    const chain = liveOptionChains.get(instrument)
    if (!chain) return null

    const rows: OptionRow[] = chain.strikes.map(strikeData => ({
      strike: strikeData.strike,
      ceOI: Number((strikeData.CE.oi / 1000).toFixed(1)),
      ceOIChngPct: Number(((Math.random() - 0.4) * 30).toFixed(1)),
      ceLTP: strikeData.CE.price,
      ceChngPct: Number(((Math.random() - 0.5) * 15).toFixed(1)),
      ceIV: Number((strikeData.CE.iv * 100).toFixed(1)),
      ceVolume: strikeData.CE.volume,
      peVolume: strikeData.PE.volume,
      peIV: Number((strikeData.PE.iv * 100).toFixed(1)),
      peChngPct: Number(((Math.random() - 0.5) * 15).toFixed(1)),
      peLTP: strikeData.PE.price,
      peOIChngPct: Number(((Math.random() - 0.4) * 30).toFixed(1)),
      peOI: Number((strikeData.PE.oi / 1000).toFixed(1)),
    }))

    return { rows, spotPrice: chain.spotPrice, expiry: chain.expiry }
  }, [isLiveConnected, liveOptionChains, instrument])

  // Use live data when available, otherwise fall back to API
  useEffect(() => {
    if (liveData && liveData.rows.length > 0) {
      setData(liveData.rows)
      setSpotPrice(liveData.spotPrice)
      setLoading(false)
    }
  }, [liveData])

  // ─── Fetch Expiries ──────────────────────────────────────────
  const [expiries, setExpiries] = useState<{ label: string; type: string }[]>(EXPIRIES)

  useEffect(() => {
    async function fetchExpiries() {
      try {
        const res = await fetch(`/api/options/expiries/${instrument}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.length > 0) {
            const mapped = json.data.map((exp: { date: string; type?: string }) => {
              const d = new Date(exp.date)
              return {
                label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                type: exp.type || (d.getDay() === 4 ? 'Weekly' : 'Monthly'),
              }
            })
            setExpiries(mapped.length > 0 ? mapped : EXPIRIES)
          }
        }
      } catch {
        // keep default
      }
    }
    fetchExpiries()
  }, [instrument])

  const fetchOptionChain = useCallback(async (isRefresh = false) => {
    // If live data is available from client engine, skip API fetch
    if (isLiveConnected && liveData && liveData.rows.length > 0) {
      setLoading(false)
      return
    }

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const res = await fetch(`/api/options/chain/${instrument}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data?.chain?.length > 0) {
          const apiData = json.data
          setSpotPrice(apiData.spot || 0)
          setApiPcr(apiData.pcr || 0)
          setApiMaxPain(apiData.maxPain || 0)

          const strikeMap = new Map<number, { ce?: Record<string, unknown>; pe?: Record<string, unknown> }>()
          for (const opt of apiData.chain as Record<string, unknown>[]) {
            const strike = opt.strikePrice as number
            if (!strikeMap.has(strike)) strikeMap.set(strike, {})
            const type = opt.optionType as string
            if (type === 'CE') strikeMap.get(strike)!.ce = opt
            else strikeMap.get(strike)!.pe = opt
          }

          const step = INSTRUMENT_CONFIG[instrument]?.step || 50
          const rows: OptionRow[] = []
          for (const [strike, d] of strikeMap) {
            const diffFromSpot = strike - (apiData.spot || 0)
            const isATM = Math.abs(diffFromSpot) < step / 2

            rows.push({
              strike,
              ceOI: Number(((d.ce?.openInterest as number) || (isATM ? 80 : 40) * (0.5 + Math.random())).toFixed(1)),
              ceOIChngPct: Number(((d.ce?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              ceLTP: Number(((d.ce?.ltp as number) || 0).toFixed(2)),
              ceChngPct: Number(((d.ce?.changePercent as number) || 0).toFixed(1)),
              ceIV: Number(((d.ce?.impliedVolatility as number) || 0).toFixed(1)),
              ceVolume: Math.round((d.ce?.volume as number) || 0),
              peVolume: Math.round((d.pe?.volume as number) || 0),
              peIV: Number(((d.pe?.impliedVolatility as number) || 0).toFixed(1)),
              peChngPct: Number(((d.pe?.changePercent as number) || 0).toFixed(1)),
              peLTP: Number(((d.pe?.ltp as number) || 0).toFixed(2)),
              peOIChngPct: Number(((d.pe?.oiChangePercent as number) || (Math.random() - 0.4) * 30).toFixed(1)),
              peOI: Number(((d.pe?.openInterest as number) || (isATM ? 85 : 45) * (0.5 + Math.random())).toFixed(1)),
            })
          }

          rows.sort((a, b) => a.strike - b.strike)
          setData(rows)
        } else {
          setData([])
          setSpotPrice(0)
        }
      } else {
        setData([])
        setSpotPrice(0)
      }
    } catch {
      setData([])
      setSpotPrice(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [instrument, isLiveConnected, liveData])

  useEffect(() => {
    fetchOptionChain()
  }, [fetchOptionChain])

  // Auto-scroll to ATM when data loads
  useEffect(() => {
    if (data.length > 0 && atmRef.current) {
      setTimeout(() => {
        atmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [data])

  const totalCEOI = data.reduce((s, r) => s + r.ceOI, 0)
  const totalPEOI = data.reduce((s, r) => s + r.peOI, 0)
  const totalCEVolume = data.reduce((s, r) => s + r.ceVolume, 0)
  const totalPEVolume = data.reduce((s, r) => s + r.peVolume, 0)
  const pcr = apiPcr > 0 ? apiPcr : (totalCEOI > 0 ? totalPEOI / totalCEOI : 0)
  const avgCEIV = data.length > 0 ? data.reduce((s, r) => s + r.ceIV, 0) / data.length : 0
  const avgPEIV = data.length > 0 ? data.reduce((s, r) => s + r.peIV, 0) / data.length : 0

  const handleRowClick = (row: OptionRow, side: 'CE' | 'PE') => {
    setSelectedRow(row)
    setSelectedSide(side)
    setModalOpen(true)
  }

  const handleRefresh = () => {
    fetchOptionChain(true)
    toast.success('Option chain refreshed')
  }

  const instruments: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']

  // Stats cards
  const stats = [
    { label: 'Spot Price', value: spotPrice > 0 ? `₹${spotPrice.toLocaleString()}` : '—', icon: Target, borderColor: 'border-l-[#00D09C]', iconBg: 'bg-[#00D09C]/10', iconColor: 'text-[#00D09C]' },
    { label: 'PCR (OI)', value: pcr > 0 ? pcr.toFixed(2) : '—', icon: BarChart3, borderColor: pcr > 1 ? 'border-l-[#00B386]' : 'border-l-[#EB5B3C]', iconBg: pcr > 1 ? 'bg-[#00B386]/10' : 'bg-[#EB5B3C]/10', iconColor: pcr > 1 ? 'text-[#00B386]' : 'text-[#EB5B3C]' },
    { label: 'Max Pain', value: apiMaxPain > 0 ? `₹${apiMaxPain.toLocaleString()}` : '—', icon: IndianRupee, borderColor: 'border-l-[#9ca3af]', iconBg: 'bg-[#9ca3af]/10', iconColor: 'text-[#9ca3af]' },
    { label: 'Total OI (L)', value: data.length > 0 ? `${(totalCEOI + totalPEOI).toFixed(0)}` : '—', icon: Activity, borderColor: 'border-l-[#00D09C]', iconBg: 'bg-[#00D09C]/10', iconColor: 'text-[#00D09C]' },
  ]

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#00B386]/10">
            <GitBranch className="size-5 text-[#00B386]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">Options Chain</h1>
            <p className="text-[#9ca3af] mt-0.5 text-sm">
              Analyze call &amp; put options by strike price. Click on LTP to place a quick trade.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a1a] hover:border-[#00D09C] hover:bg-[#00D09C]/5 rounded-lg font-semibold"
        >
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className={`bg-white border border-[#e5e7eb] border-l-4 ${stat.borderColor} rounded-xl shadow-sm`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                    {stat.label}
                  </p>
                  <div className={`size-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`size-3.5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-lg font-bold font-mono font-tabular text-[#1a1a1a]">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* ── Instrument & Expiry Selector ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Instrument Selector */}
            <div className="flex flex-wrap items-center gap-2">
              {instruments.map((inst) => (
                <button
                  key={inst}
                  onClick={() => setInstrument(inst)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    instrument === inst
                      ? 'bg-[#00D09C] text-white shadow-sm shadow-[#00D09C]/20'
                      : 'bg-[#f5f7fa] text-[#6b7280] border border-[#e5e7eb] hover:border-[#00D09C] hover:text-[#1a1a1a]'
                  )}
                >
                  {inst}
                </button>
              ))}
            </div>

            {/* Expiry Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] shrink-0">Expiry:</span>
              {expiries.map((exp, idx) => (
                <button
                  key={exp.label}
                  onClick={() => setExpiryIdx(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                    expiryIdx === idx
                      ? 'bg-[#00D09C] text-white shadow-sm'
                      : 'bg-[#f5f7fa] text-[#6b7280] border border-[#e5e7eb] hover:border-[#00D09C]'
                  )}
                >
                  {exp.label}
                  <Badge className={cn(
                    'text-[8px] px-1 py-0 h-4 font-bold border-0',
                    expiryIdx === idx
                      ? 'bg-white/20 text-white'
                      : exp.type === 'Weekly' ? 'bg-[#00D09C]/10 text-[#00D09C]' : 'bg-[#9ca3af]/10 text-[#9ca3af]'
                  )}>
                    {exp.type}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Option Chain Table ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {loading ? (
          <OptionChainSkeleton />
        ) : data.length === 0 ? (
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="py-16 flex flex-col items-center justify-center">
              <div className="size-16 rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                <CandlestickChart className="size-7 text-[#9ca3af]/40" />
              </div>
              <p className="text-[#1a1a1a] font-semibold text-sm">No options data available</p>
              <p className="text-[#9ca3af] text-xs mt-1.5">
                Data for {instrument} will appear here when available
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-4 gap-1.5 border-[#00D09C]/40 text-[#00D09C] hover:bg-[#00D09C] hover:text-white rounded-lg"
              >
                <RefreshCw className="size-3.5" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-420px)] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  {/* CE Header */}
                  <tr className="bg-[#00D09C] text-white">
                    <th colSpan={4} className="text-center py-2.5 font-semibold text-xs tracking-wider">
                      CALLS
                    </th>
                    <th className="text-center py-2.5 bg-[#00A67E] font-bold text-xs border-x border-[#009670]">
                      STRIKE
                    </th>
                    <th colSpan={4} className="text-center py-2.5 font-semibold text-xs tracking-wider">
                      PUTS
                    </th>
                  </tr>
                  <tr className="bg-[#f5f7fa] border-b border-[#e5e7eb] text-[#9ca3af]">
                    <th className="px-2 py-2 text-right font-medium">OI (L)</th>
                    <th className="px-2 py-2 text-right font-medium">Vol</th>
                    <th className="px-2 py-2 text-right font-medium">LTP</th>
                    <th className="px-2 py-2 text-right font-medium">Chg%</th>
                    <th className="px-2 py-2 text-center font-bold bg-[#f5f7fa] border-x border-[#e5e7eb] text-[#1a1a1a]">₹</th>
                    <th className="px-2 py-2 text-left font-medium">Chg%</th>
                    <th className="px-2 py-2 text-left font-medium">LTP</th>
                    <th className="px-2 py-2 text-left font-medium">Vol</th>
                    <th className="px-2 py-2 text-left font-medium">OI (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const step = INSTRUMENT_CONFIG[instrument]?.step || 50
                    const isATM = row.strike === Math.round(spotPrice / step) * step
                    const ceITM = row.strike < spotPrice
                    const peITM = row.strike > spotPrice

                    return (
                      <tr
                        key={row.strike}
                        ref={isATM ? atmRef : undefined}
                        className={cn(
                          'border-b border-[#e5e7eb] transition-colors',
                          isATM && 'bg-[#00D09C]/10'
                        )}
                      >
                        {/* CE Side */}
                        <td className={cn('px-2 py-1.5 text-right font-mono font-tabular text-[#9ca3af]', ceITM && 'bg-[#00B386]/10')}>
                          {row.ceOI.toFixed(1)}
                        </td>
                        <td className={cn('px-2 py-1.5 text-right font-mono font-tabular text-[#9ca3af]', ceITM && 'bg-[#00B386]/10')}>
                          {row.ceVolume > 0 ? `${(row.ceVolume / 1000).toFixed(0)}K` : '-'}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-right font-mono font-tabular font-semibold text-[#1a1a1a] cursor-pointer hover:text-[#00B386] hover:underline',
                            ceITM && 'bg-[#00B386]/10'
                          )}
                          onClick={() => handleRowClick(row, 'CE')}
                        >
                          {row.ceLTP.toFixed(2)}
                        </td>
                        <td className={cn(
                          'px-2 py-1.5 text-right font-mono',
                          row.ceChngPct > 0 ? 'text-[#00B386]' : row.ceChngPct < 0 ? 'text-[#EB5B3C]' : 'text-[#9ca3af]',
                          ceITM && 'bg-[#00B386]/10'
                        )}>
                          {row.ceChngPct > 0 ? '+' : ''}{row.ceChngPct.toFixed(1)}%
                        </td>

                        {/* Strike */}
                        <td className={cn(
                          'px-2 py-1.5 text-center font-mono font-tabular font-bold bg-[#f5f7fa] border-x border-[#e5e7eb]',
                          isATM ? 'text-[#00A67E] bg-[#00D09C]/10' : 'text-[#1a1a1a]'
                        )}>
                          {isATM && <span className="text-[8px] font-bold text-[#00A67E] block leading-none">ATM</span>}
                          {row.strike.toLocaleString()}
                        </td>

                        {/* PE Side */}
                        <td className={cn(
                          'px-2 py-1.5 text-left font-mono',
                          row.peChngPct > 0 ? 'text-[#00B386]' : row.peChngPct < 0 ? 'text-[#EB5B3C]' : 'text-[#9ca3af]',
                          peITM && 'bg-[#EB5B3C]/10'
                        )}>
                          {row.peChngPct > 0 ? '+' : ''}{row.peChngPct.toFixed(1)}%
                        </td>
                        <td
                          className={cn(
                            'px-2 py-1.5 text-left font-mono font-tabular font-semibold text-[#1a1a1a] cursor-pointer hover:text-[#EB5B3C] hover:underline',
                            peITM && 'bg-[#EB5B3C]/10'
                          )}
                          onClick={() => handleRowClick(row, 'PE')}
                        >
                          {row.peLTP.toFixed(2)}
                        </td>
                        <td className={cn('px-2 py-1.5 text-left font-mono font-tabular text-[#9ca3af]', peITM && 'bg-[#EB5B3C]/10')}>
                          {row.peVolume > 0 ? `${(row.peVolume / 1000).toFixed(0)}K` : '-'}
                        </td>
                        <td className={cn('px-2 py-1.5 text-left font-mono font-tabular text-[#9ca3af]', peITM && 'bg-[#EB5B3C]/10')}>
                          {row.peOI.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>

      {/* ── Summary Stats Bottom Section ────────────────────────── */}
      {!loading && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Card className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-7 rounded-lg bg-[#9ca3af]/10 flex items-center justify-center">
                  <BarChart3 className="size-3.5 text-[#9ca3af]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">Open Interest & IV Analysis</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Total CE OI (L)</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#00B386]">{totalCEOI.toFixed(0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Total PE OI (L)</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#EB5B3C]">{totalPEOI.toFixed(0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">CE Volume</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#1a1a1a]">
                    {totalCEVolume > 1000000 ? `${(totalCEVolume / 1000000).toFixed(1)}M` : `${(totalCEVolume / 1000).toFixed(0)}K`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">PE Volume</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#1a1a1a]">
                    {totalPEVolume > 1000000 ? `${(totalPEVolume / 1000000).toFixed(1)}M` : `${(totalPEVolume / 1000).toFixed(0)}K`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Avg CE IV</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#00B386]">{avgCEIV.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Avg PE IV</p>
                  <p className="text-sm font-bold font-mono font-tabular text-[#EB5B3C]">{avgPEIV.toFixed(1)}%</p>
                </div>
              </div>
              {/* PCR sentiment bar */}
              <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Market Sentiment (PCR)</span>
                  <span className={cn(
                    'text-xs font-bold',
                    pcr > 1.2 ? 'text-[#00B386]' : pcr < 0.7 ? 'text-[#EB5B3C]' : 'text-[#f59e0b]'
                  )}>
                    {pcr > 1.2 ? 'Bullish' : pcr < 0.7 ? 'Bearish' : 'Neutral'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      pcr > 1.2 ? 'bg-[#00B386]' : pcr < 0.7 ? 'bg-[#EB5B3C]' : 'bg-[#f59e0b]'
                    )}
                    style={{ width: `${Math.min(100, Math.max(5, pcr * 50))}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-[#EB5B3C]">Bearish (&lt;0.7)</span>
                  <span className="text-[9px] text-[#f59e0b]">Neutral</span>
                  <span className="text-[9px] text-[#00B386]">Bullish (&gt;1.2)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Trade Modal ─────────────────────────────────────────── */}
      <QuickTradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        row={selectedRow}
        side={selectedSide}
        spotPrice={spotPrice}
        instrument={instrument}
      />
    </div>
  )
}

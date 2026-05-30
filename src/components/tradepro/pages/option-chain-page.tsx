'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  GitBranch,
  Minus,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/auth-store'
import { useTradeSuccess } from '@/components/tradepro/trade-success-popup'
import { useMarketStore } from '@/lib/market-store'
import { toast } from 'sonner'

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

// ─── Instrument Config ────────────────────────────────────────────────
const INSTRUMENT_CONFIG: Record<Instrument, { step: number; lotSize: number }> = {
  NIFTY: { step: 50, lotSize: 50 },
  BANKNIFTY: { step: 100, lotSize: 15 },
  FINNIFTY: { step: 50, lotSize: 40 },
  SENSEX: { step: 100, lotSize: 20 },
  MIDCPNIFTY: { step: 50, lotSize: 75 },
}

const INSTRUMENT_SPOT: Record<Instrument, number> = {
  NIFTY: 24500,
  BANKNIFTY: 52000,
  FINNIFTY: 23500,
  SENSEX: 81000,
  MIDCPNIFTY: 12500,
}

// ─── Fallback Mock Data Generator ────────────────────────────────────
function generateMockData(spotPrice: number, instrument: Instrument): OptionRow[] {
  const strikes: number[] = []
  const step = INSTRUMENT_CONFIG[instrument]?.step || 50
  // Wider range for higher-priced instruments like BANKNIFTY, SENSEX
  const range = spotPrice > 50000 ? 2000 : spotPrice > 30000 ? 1500 : 1000
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

const EXPIRIES = [
  { label: '05 Jun 2025', type: 'Weekly' },
  { label: '12 Jun 2025', type: 'Weekly' },
  { label: '19 Jun 2025', type: 'Weekly' },
  { label: '26 Jun 2025', type: 'Monthly' },
  { label: '31 Jul 2025', type: 'Monthly' },
  { label: '28 Aug 2025', type: 'Monthly' },
]

// ─── Quick Trade Modal (Groww-style) ────────────────────────────────
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
  const [lots, setLots] = useState(1)
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY')
  const [placing, setPlacing] = useState(false)

  if (!row) return null

  const ltp = side === 'CE' ? row.ceLTP : row.peLTP
  const chgPct = side === 'CE' ? row.ceChngPct : row.peChngPct
  const lotSize = INSTRUMENT_CONFIG[instrument]?.lotSize || 50
  const totalQty = lots * lotSize
  const marginRequired = Math.round(ltp * totalQty * 1.2)

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
      <DialogContent className="sm:max-w-sm bg-white border-[#e5e7eb] text-[#1a1a2e] p-0">
        {/* Header with CE/PE color */}
        <div className={cn(
          'px-6 py-4 rounded-t-lg',
          side === 'CE' ? 'bg-[#00d09c]' : 'bg-[#eb5b3c]'
        )}>
          <DialogTitle className="flex items-center justify-between text-white">
            <div>
              <span className="text-sm font-medium opacity-80">{instrument}</span>
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

        <div className="p-6 space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('BUY')}
              className={cn(
                'py-3 rounded-lg font-bold text-sm transition-all',
                direction === 'BUY'
                  ? 'bg-[#00d09c] text-white shadow-md'
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
                  ? 'bg-[#eb5b3c] text-white shadow-md'
                  : 'bg-[#f5f7fa] text-[#6b7280] hover:bg-[#e5e7eb]'
              )}
            >
              SELL
            </button>
          </div>

          {/* Lots Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">Lots</label>
            <div className="flex items-center gap-3">
              <button
                className="size-10 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#f5f7fa] active:bg-[#e5e7eb] transition-colors"
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
                className="size-10 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-[#f5f7fa] active:bg-[#e5e7eb] transition-colors"
                onClick={() => setLots(lots + 1)}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f9fafb] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Lot Size</span>
              <span className="font-mono font-tabular font-medium">{lotSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total Qty</span>
              <span className="font-mono font-tabular font-medium">{totalQty}</span>
            </div>
            <div className="border-t border-[#e5e7eb] pt-2 flex justify-between">
              <span className="text-[#6b7280] font-medium">Approx. Margin</span>
              <span className="font-mono font-tabular font-bold text-[#1a1a2e]">₹{marginRequired.toLocaleString()}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className={cn(
              'w-full py-3.5 rounded-lg font-bold text-white text-sm transition-all active:scale-[0.98]',
              direction === 'BUY'
                ? 'bg-[#00d09c] hover:bg-[#00b888]'
                : 'bg-[#eb5b3c] hover:bg-[#d44f33]'
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

// ─── Main Component ──────────────────────────────────────────────────
export function OptionChainPage() {
  const [instrument, setInstrument] = useState<Instrument>('NIFTY')
  const [expiryIdx, setExpiryIdx] = useState(0)
  const [selectedRow, setSelectedRow] = useState<OptionRow | null>(null)
  const [selectedSide, setSelectedSide] = useState<'CE' | 'PE'>('CE')
  const [modalOpen, setModalOpen] = useState(false)

  // ─── Live data from Market Engine ─────────────────────────────
  const marketIndices = useMarketStore((s) => s.indices)
  const optionChains = useMarketStore((s) => s.optionChains)
  const engineRunning = useMarketStore((s) => s.engineRunning)

  // Get live spot price and option chain from market engine
  const liveSpot = marketIndices[instrument]?.currentPrice || INSTRUMENT_SPOT[instrument] || 24500
  const liveChain = optionChains[instrument] || []

  // Convert engine OptionTick[] to display OptionRow[]
  const data: OptionRow[] = useMemo(() => {
    if (liveChain.length > 0) {
      return liveChain.map((tick) => ({
        strike: tick.strike,
        ceOI: tick.ceOI,
        ceOIChngPct: Number(((Math.random() - 0.4) * 10).toFixed(1)), // OI change not tracked in engine
        ceLTP: tick.ceLTP,
        ceChngPct: tick.ceChngPct,
        ceIV: tick.ceIV,
        ceVolume: tick.ceVolume,
        peVolume: tick.peVolume,
        peIV: tick.peIV,
        peChngPct: tick.peChngPct,
        peLTP: tick.peLTP,
        peOIChngPct: Number(((Math.random() - 0.4) * 10).toFixed(1)),
        peOI: tick.peOI,
      }))
    }
    // Fallback to static mock data if engine hasn't started
    return generateMockData(liveSpot, instrument)
  }, [liveChain, liveSpot, instrument])

  const spotPrice = liveSpot
  const [apiPcr, setApiPcr] = useState(0)
  const [apiMaxPain, setApiMaxPain] = useState(0)
  const [loading, setLoading] = useState(false) // No loading needed with live engine

  const atmRef = useRef<HTMLTableRowElement>(null)

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

  // Auto-scroll to ATM when data loads
  useEffect(() => {
    if (data.length > 0 && atmRef.current) {
      setTimeout(() => {
        atmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [instrument]) // Only scroll when instrument changes, not every tick

  const totalCEOI = data.reduce((s, r) => s + r.ceOI, 0)
  const totalPEOI = data.reduce((s, r) => s + r.peOI, 0)
  const pcr = apiPcr > 0 ? apiPcr : (totalCEOI > 0 ? totalPEOI / totalCEOI : 0)

  const handleRowClick = (row: OptionRow, side: 'CE' | 'PE') => {
    setSelectedRow(row)
    setSelectedSide(side)
    setModalOpen(true)
  }

  const instruments: Instrument[] = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto min-h-screen">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#00B386]/10">
            <GitBranch className="size-4 text-[#00B386]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1a1a2e]">Options Chain</h1>
            <p className="text-xs text-[#6b7280]">
              {instrument} · Live · Click on LTP to trade
              {engineRunning && <span className="ml-1 text-[#00B386]">●</span>}
            </p>
          </div>
        </div>
        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-[#6b7280]">Spot</span>
            <span className="font-mono font-tabular font-bold text-[#1a1a2e]">₹{spotPrice.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#6b7280]">PCR</span>
            <span className={cn(
              'font-mono font-bold',
              pcr > 1 ? 'text-[#00B386]' : pcr < 0.7 ? 'text-[#EB5B3C]' : 'text-[#1a1a2e]'
            )}>
              {pcr.toFixed(2)}
            </span>
          </div>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#6b7280]">Max Pain</span>
            <span className="font-mono font-tabular font-bold text-[#1a1a2e]">₹{apiMaxPain.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Instrument Selector ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {instruments.map((inst) => (
          <button
            key={inst}
            onClick={() => setInstrument(inst)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              instrument === inst
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#1a1a2e] hover:text-[#1a1a2e]'
            )}
          >
            {inst}
          </button>
        ))}
      </div>

      {/* ── Expiry Selector ───────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {expiries.map((exp, idx) => (
          <button
            key={exp.label}
            onClick={() => setExpiryIdx(idx)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              expiryIdx === idx
                ? 'bg-[#1a1a2e] text-white'
                : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#1a1a2e]'
            )}
          >
            {exp.label}
          </button>
        ))}
      </div>

      {/* ── Mobile Stats ──────────────────────────────────────── */}
      <div className="sm:hidden flex items-center gap-4 text-xs bg-white border border-[#e5e7eb] rounded-lg p-3">
        <div className="flex items-center gap-1">
          <span className="text-[#6b7280]">Spot</span>
          <span className="font-mono font-tabular font-bold text-[#1a1a2e]">₹{spotPrice.toLocaleString()}</span>
        </div>
        <div className="h-3 w-px bg-[#e5e7eb]" />
        <div className="flex items-center gap-1">
          <span className="text-[#6b7280]">PCR</span>
          <span className={cn('font-mono font-bold', pcr > 1 ? 'text-[#00B386]' : pcr < 0.7 ? 'text-[#EB5B3C]' : 'text-[#1a1a2e]')}>
            {pcr.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Option Chain Table ─────────────────────────────────── */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-6 animate-spin text-[#1a1a2e]" />
            <span className="text-sm text-[#6b7280]">Loading options data...</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-280px)] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                {/* CE Header */}
                <tr className="bg-[#1a1a2e] text-white">
                  <th colSpan={4} className="text-center py-2.5 font-semibold text-xs tracking-wider">
                    CALLS
                  </th>
                  <th className="text-center py-2.5 bg-[#374151] font-bold text-xs border-x border-[#4b5563]">
                    STRIKE
                  </th>
                  <th colSpan={4} className="text-center py-2.5 font-semibold text-xs tracking-wider">
                    PUTS
                  </th>
                </tr>
                <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[#6b7280]">
                  <th className="px-2 py-2 text-right font-medium">OI (L)</th>
                  <th className="px-2 py-2 text-right font-medium">Vol</th>
                  <th className="px-2 py-2 text-right font-medium">LTP</th>
                  <th className="px-2 py-2 text-right font-medium">Chg%</th>
                  <th className="px-2 py-2 text-center font-bold bg-[#f3f4f6] border-x border-[#e5e7eb] text-[#1a1a2e]">₹</th>
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
                        'border-b border-[#f3f4f6] transition-colors',
                        isATM && 'bg-[#1a1a2e]/5'
                      )}
                    >
                      {/* CE Side */}
                      <td className={cn('px-2 py-1.5 text-right font-mono font-tabular text-[#6b7280]', ceITM && 'bg-[#00B386]/6')}>
                        {row.ceOI.toFixed(1)}
                      </td>
                      <td className={cn('px-2 py-1.5 text-right font-mono font-tabular text-[#9ca3af]', ceITM && 'bg-[#00B386]/6')}>
                        {row.ceVolume > 0 ? `${(row.ceVolume / 1000).toFixed(0)}K` : '-'}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 text-right font-mono font-tabular font-semibold text-[#1a1a2e] cursor-pointer hover:text-[#00B386] hover:underline',
                          ceITM && 'bg-[#00B386]/6'
                        )}
                        onClick={() => handleRowClick(row, 'CE')}
                      >
                        {row.ceLTP.toFixed(2)}
                      </td>
                      <td className={cn(
                        'px-2 py-1.5 text-right font-mono',
                        row.ceChngPct > 0 ? 'text-[#00B386]' : row.ceChngPct < 0 ? 'text-[#EB5B3C]' : 'text-[#9ca3af]',
                        ceITM && 'bg-[#00B386]/6'
                      )}>
                        {row.ceChngPct > 0 ? '+' : ''}{row.ceChngPct.toFixed(1)}%
                      </td>

                      {/* Strike */}
                      <td className={cn(
                        'px-2 py-1.5 text-center font-mono font-tabular font-bold bg-[#f9fafb] border-x border-[#e5e7eb]',
                        isATM ? 'text-[#1a1a2e] bg-[#1a1a2e]/10' : 'text-[#1a1a2e]'
                      )}>
                        {row.strike.toLocaleString()}
                      </td>

                      {/* PE Side */}
                      <td className={cn(
                        'px-2 py-1.5 text-left font-mono',
                        row.peChngPct > 0 ? 'text-[#00B386]' : row.peChngPct < 0 ? 'text-[#EB5B3C]' : 'text-[#9ca3af]',
                        peITM && 'bg-[#EB5B3C]/6'
                      )}>
                        {row.peChngPct > 0 ? '+' : ''}{row.peChngPct.toFixed(1)}%
                      </td>
                      <td
                        className={cn(
                          'px-2 py-1.5 text-left font-mono font-tabular font-semibold text-[#1a1a2e] cursor-pointer hover:text-[#EB5B3C] hover:underline',
                          peITM && 'bg-[#EB5B3C]/6'
                        )}
                        onClick={() => handleRowClick(row, 'PE')}
                      >
                        {row.peLTP.toFixed(2)}
                      </td>
                      <td className={cn('px-2 py-1.5 text-left font-mono font-tabular text-[#9ca3af]', peITM && 'bg-[#EB5B3C]/6')}>
                        {row.peVolume > 0 ? `${(row.peVolume / 1000).toFixed(0)}K` : '-'}
                      </td>
                      <td className={cn('px-2 py-1.5 text-left font-mono font-tabular text-[#6b7280]', peITM && 'bg-[#EB5B3C]/6')}>
                        {row.peOI.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Trade Modal ───────────────────────────────────────── */}
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

'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import { useAppStore } from '@/lib/store'
import { useMarketData } from '@/lib/market-data'

interface MarketStatus {
  status: string
  message: string
  istTime: string
}

// 4 main indices — always shown in this order
const MAIN_INDICES_ORDER = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX']

const INDEX_NAMES: Record<string, string> = {
  NIFTY: 'NIFTY 50',
  BANKNIFTY: 'BANK NIFTY',
  FINNIFTY: 'FIN NIFTY',
  SENSEX: 'SENSEX',
}

// Fallback data for 4 main indices
const FALLBACK_INDICES = [
  { symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 22356.10, change: 142.30, changePercent: 0.64 },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 47210.45, change: -82.10, changePercent: -0.17 },
  { symbol: 'FINNIFTY', name: 'FIN NIFTY', currentPrice: 23450.80, change: 95.60, changePercent: 0.41 },
  { symbol: 'SENSEX', name: 'SENSEX', currentPrice: 73645.25, change: 450.15, changePercent: 0.61 },
]

export function IndexTicker() {
  const [indices, setIndices] = useState(FALLBACK_INDICES)
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const { navigateToIndex } = useAppStore()

  // ─── Real-time market data from client engine ────────────────
  const { indices: liveIndices, isConnected } = useMarketData()

  // Update indices from live data every tick
  useEffect(() => {
    if (!isConnected || liveIndices.size === 0) return

    const ordered: typeof FALLBACK_INDICES = []

    for (const symbol of MAIN_INDICES_ORDER) {
      const liveIdx = liveIndices.get(symbol)
      if (liveIdx) {
        ordered.push({
          symbol: liveIdx.symbol,
          name: INDEX_NAMES[liveIdx.symbol] || liveIdx.name,
          currentPrice: liveIdx.price,
          change: liveIdx.change,
          changePercent: liveIdx.changePercent,
        })
      }
    }

    // If we have less than 4 from live data, fill from fallback
    if (ordered.length < 4) {
      for (const fb of FALLBACK_INDICES) {
        if (!ordered.find(o => o.symbol === fb.symbol)) {
          ordered.push(fb)
        }
      }
    }

    // Re-sort to match MAIN_INDICES_ORDER
    ordered.sort((a, b) => {
      const ai = MAIN_INDICES_ORDER.indexOf(a.symbol)
      const bi = MAIN_INDICES_ORDER.indexOf(b.symbol)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

    setIndices(ordered.slice(0, 4))
  }, [liveIndices, isConnected])

  // Fetch market status (open/closed) separately
  useEffect(() => {
    async function fetchStatus() {
      try {
        const statusRes = await fetch('/api/market/status')
        const statusData = await statusRes.json()
        if (statusData.success) setMarketStatus(statusData.data)
      } catch {
        setMarketStatus({ status: 'CLOSED', message: 'Market closed', istTime: new Date().toISOString() })
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const isOpen = marketStatus?.status === 'OPEN'
  const statusLabel = marketStatus?.status || 'CLOSED'

  return (
    <div className="fixed left-0 right-0 top-[56px] z-20 md:left-[220px]">
      <div
        className="border-b shadow-sm"
        style={{
          background: '#ffffff',
          borderColor: '#e5e7eb',
          height: '40px',
        }}
      >
        <div className="flex items-center h-full px-3 gap-0 overflow-x-auto custom-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {/* Market Status */}
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r mr-1" style={{ borderColor: '#e5e7eb' }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isOpen ? 'rgba(0,208,156,0.08)' : 'rgba(235,91,60,0.08)',
                color: isOpen ? '#00D09C' : '#eb5b3c',
              }}
            >
              <span className="relative flex size-1.5">
                {isOpen && (
                  <span className="absolute inline-flex size-1.5 animate-ping rounded-full opacity-75" style={{ background: '#00D09C' }} />
                )}
                <span
                  className="relative inline-flex size-1.5 rounded-full"
                  style={{ background: isOpen ? '#00D09C' : '#eb5b3c' }}
                />
              </span>
              {statusLabel}
            </span>
          </div>

          {/* 4 Main Index Cards - Clickable */}
          <div className="flex items-center gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {indices.map((idx) => {
              const isPositive = idx.change >= 0
              return (
                <button
                  key={idx.symbol}
                  type="button"
                  className="flex flex-col items-start shrink-0 px-3 py-1 cursor-pointer hover:bg-[#f0f2f5] active:bg-[#e5e7eb] rounded-lg transition-all duration-150 group"
                  onClick={() => navigateToIndex(idx.symbol)}
                  title={`View ${idx.name} details`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#1a1a1a]">{idx.symbol}</span>
                    <span className="text-[13px] font-bold font-tabular text-[#1a1a1a]">{idx.currentPrice.toLocaleString('en-IN')}</span>
                    <span
                      className="flex items-center gap-0.5 text-[11px] font-semibold font-tabular"
                      style={{ color: isPositive ? '#00B386' : '#eb5b3c' }}
                    >
                      {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {isPositive ? '+' : ''}{formatPercent(idx.changePercent)}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#9ca3af] leading-tight">{idx.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

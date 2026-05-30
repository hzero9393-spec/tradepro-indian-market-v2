'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatPercent } from '@/lib/format'
import { useMarketStore } from '@/lib/market-store'

interface MarketStatus {
  status: string
  message: string
  istTime: string
}

export function IndexTicker() {
  // Live indices from market engine
  const marketIndices = useMarketStore((s) => s.indices)
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)

  // Fetch market status (lightweight, just time check)
  useEffect(() => {
    async function fetchStatus() {
      try {
        const statusRes = await fetch('/api/market/status')
        const statusData = await statusRes.json()
        if (statusData.success) setMarketStatus(statusData.data)
      } catch {
        setMarketStatus({ status: 'DEMO', message: 'Demo Market', istTime: new Date().toISOString() })
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  // Convert market engine indices to display format
  const indices = Object.values(marketIndices).map((idx) => ({
    symbol: idx.symbol,
    name: idx.name,
    currentPrice: idx.currentPrice,
    change: idx.change,
    changePercent: idx.changePercent,
  }))

  const isOpen = marketStatus?.status === 'OPEN' || marketStatus?.status === 'DEMO'
  const statusLabel = marketStatus?.status === 'DEMO' ? 'DEMO' : (marketStatus?.status || 'DEMO')

  return (
    <div className="fixed left-0 right-0 top-[56px] z-20 md:left-[220px]">
      <div
        className="border-b"
        style={{
          background: '#fafafa',
          borderColor: '#f0f0f0',
          height: '36px',
        }}
      >
        <div className="flex items-center h-full px-3 gap-0 overflow-x-auto custom-scrollbar">
          {/* Market Status */}
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r mr-2" style={{ borderColor: '#f0f0f0' }}>
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

          {/* Index Ticker - Groww style minimal */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {indices.map((idx) => {
              const isPositive = idx.change >= 0
              return (
                <button
                  key={idx.symbol}
                  type="button"
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-white px-2.5 py-1 rounded-md transition-colors"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('openIndexDetail', {
                        detail: { symbol: idx.symbol },
                      })
                    )
                  }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: '#4a4a4a' }}>
                    {idx.symbol}
                  </span>
                  <span className="text-[12px] font-semibold font-tabular" style={{ color: '#1a1a1a' }}>
                    {idx.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span
                    className="flex items-center gap-0.5 text-[11px] font-semibold font-tabular"
                    style={{ color: isPositive ? '#00B386' : '#eb5b3c' }}
                  >
                    {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {isPositive ? '+' : ''}{formatPercent(idx.changePercent)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

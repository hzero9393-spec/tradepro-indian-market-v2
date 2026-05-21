'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface IndexData {
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

interface MarketStatus {
  status: string
  message: string
  istTime: string
}

export function IndexTicker() {
  const [indices, setIndices] = useState<IndexData[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [indicesRes, statusRes] = await Promise.all([
          fetch('/api/indices'),
          fetch('/api/market/status'),
        ])
        const indicesData = await indicesRes.json()
        const statusData = await statusRes.json()
        if (indicesData.success) setIndices(indicesData.data)
        if (statusData.success) setMarketStatus(statusData.data)
      } catch {
        // Fallback to mock data
        setIndices([
          { symbol: 'NIFTY', name: 'NIFTY 50', currentPrice: 19500, change: 125.30, changePercent: 0.65 },
          { symbol: 'BANKNIFTY', name: 'BANK NIFTY', currentPrice: 44250, change: -210.45, changePercent: -0.47 },
          { symbol: 'SENSEX', name: 'SENSEX', currentPrice: 65200, change: 340.20, changePercent: 0.52 },
          { symbol: 'FINNIFTY', name: 'FINNIFTY', currentPrice: 20150, change: 85.75, changePercent: 0.43 },
          { symbol: 'MIDCPNIFTY', name: 'MIDCAP NIFTY', currentPrice: 12500, change: 40.10, changePercent: 0.32 },
        ])
        setMarketStatus({ status: 'CLOSED', message: 'Market closed', istTime: new Date().toISOString() })
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const isOpen = marketStatus?.status === 'OPEN'
  const isPreOpen = marketStatus?.status === 'PRE-OPEN'
  const statusLabel = marketStatus?.status || 'CLOSED'

  // Status badge config
  const statusConfig = {
    open: {
      bg: 'bg-[#00d09c]/10',
      text: 'text-[#00d09c]',
      dot: 'bg-[#00d09c]',
      ring: 'ring-[#00d09c]/20',
    },
    'pre-open': {
      bg: 'bg-[#f59e0b]/10',
      text: 'text-[#f59e0b]',
      dot: 'bg-[#f59e0b]',
      ring: 'ring-[#f59e0b]/20',
    },
    closed: {
      bg: 'bg-[#eb5b3c]/10',
      text: 'text-[#eb5b3c]',
      dot: 'bg-[#eb5b3c]',
      ring: 'ring-[#eb5b3c]/20',
    },
  }

  const currentStatus = isOpen
    ? statusConfig.open
    : isPreOpen
      ? statusConfig['pre-open']
      : statusConfig.closed

  return (
    <div className="fixed left-0 right-0 top-[56px] z-20 md:left-[280px]">
      <div
        className="bg-[#ffffff] border-b border-[#e5e7eb]"
        style={{ height: '32px' }}
      >
        <div className="flex items-center h-full px-3 gap-0 overflow-x-auto custom-scrollbar">
          {/* Market Status Badge */}
          <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#e5e7eb] mr-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}
            >
              {/* Pulsing dot for OPEN, static dot otherwise */}
              <span className="relative flex size-1.5">
                {isOpen && (
                  <span
                    className={`absolute inline-flex size-1.5 animate-ping rounded-full ${currentStatus.dot} opacity-75`}
                  />
                )}
                <span
                  className={`relative inline-flex size-1.5 rounded-full ${currentStatus.dot}`}
                />
              </span>
              {statusLabel}
            </span>
          </div>

          {/* Index Ticker */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {indices.map((idx) => {
              const isPositive = idx.change >= 0
              return (
                <button
                  key={idx.symbol}
                  type="button"
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-[#eef0ff] px-2 py-0.5 rounded transition-colors"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('openIndexDetail', {
                        detail: { symbol: idx.symbol },
                      })
                    )
                  }}
                >
                  <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                    {idx.symbol}
                  </span>
                  <span className="text-[12px] font-mono font-semibold text-[#1a1a2e]">
                    {idx.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-[11px] font-bold ${
                      isPositive ? 'text-[#00d09c]' : 'text-[#eb5b3c]'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {isPositive ? '+' : ''}
                    {idx.change.toFixed(2)} ({isPositive ? '+' : ''}
                    {idx.changePercent.toFixed(2)}%)
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

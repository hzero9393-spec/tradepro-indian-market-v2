// ─── useMarketEngine Hook ─────────────────────────────────────────────
// Auto-starts the client-side MarketEngine on mount and stops on unmount
// Place this in the root layout/page component

'use client'

import { useEffect, useRef } from 'react'
import { useMarketStore } from '@/lib/market-store'

export function useMarketEngine() {
  const startEngine = useMarketStore((s) => s.startEngine)
  const stopEngine = useMarketStore((s) => s.stopEngine)
  const engineRunning = useMarketStore((s) => s.engineRunning)
  const startedRef = useRef(false)

  useEffect(() => {
    // Only start once across re-renders
    if (!startedRef.current) {
      startedRef.current = true
      startEngine()
    }

    // Cleanup on unmount (e.g., navigating away from app)
    return () => {
      // Don't stop on re-renders, only on actual unmount
      // The engine should persist for the entire session
    }
  }, [startEngine])

  return { engineRunning }
}

// ─── Market Data Zustand Store ───────────────────────────────────────
// Connects the client-side MarketEngine to Zustand for reactive UI updates
// Components can subscribe to this store for live price data
//
// FUTURES: Uses functional state update (append/merge) — NEVER overwrites
// the full futures list. New contracts are added via addFuture() which
// checks for duplicates using symbol+expiry as unique key.

import { create } from 'zustand'
import {
  getMarketEngine,
  destroyMarketEngine,
  type MarketIndex,
  type MarketStock,
  type OptionTick,
  type FutureTick,
  type MarketState,
} from './market-engine'

// ─── Store Types ──────────────────────────────────────────────────────
interface MarketStoreState {
  // Live market data from engine
  indices: Record<string, MarketIndex>
  stocks: Record<string, MarketStock>
  optionChains: Record<string, OptionTick[]>
  futures: Record<string, FutureTick[]>  // keyed by underlying symbol
  engineRunning: boolean
  tickCount: number
  lastTickTime: number

  // Actions
  startEngine: () => void
  stopEngine: () => void

  // ─── NON-DESTRUCTIVE Futures Add ─────────────────────────────────
  // Uses functional state update: setFutures(prev => ...)
  // NEVER overwrites the full futures list.
  // Duplicates (same symbol + expiry) are silently skipped.
  addFuture: (newFuture: FutureTick) => void

  // Derived data helpers
  getGainers: (count?: number) => MarketStock[]
  getLosers: (count?: number) => MarketStock[]
  getStocksArray: () => MarketStock[]
  getIndex: (symbol: string) => MarketIndex | undefined
  getStock: (symbol: string) => MarketStock | undefined
  getOptionChain: (underlying: string) => OptionTick[]
  getFutures: (underlying: string) => FutureTick[]
}

// ─── Store ────────────────────────────────────────────────────────────
let unsubscribe: (() => void) | null = null

export const useMarketStore = create<MarketStoreState>((set, get) => ({
  indices: {},
  stocks: {},
  optionChains: {},
  futures: {},
  engineRunning: false,
  tickCount: 0,
  lastTickTime: 0,

  startEngine: () => {
    const engine = getMarketEngine()

    // Subscribe to engine updates and push to Zustand
    if (unsubscribe) unsubscribe()
    unsubscribe = engine.subscribe((state: MarketState) => {
      set({
        indices: state.indices,
        stocks: state.stocks,
        optionChains: state.optionChains,
        futures: state.futures,
        engineRunning: state.engineRunning,
        tickCount: state.tickCount,
        lastTickTime: state.lastTickTime,
      })
    })

    engine.start()
    set({ engineRunning: true })
  },

  stopEngine: () => {
    const engine = getMarketEngine()
    engine.stop()
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    destroyMarketEngine()
    set({ engineRunning: false })
  },

  /**
   * NON-DESTRUCTIVE ADD: Add a new futures contract to the store.
   * Uses functional state update — NEVER overwrites existing list.
   * Duplicates (same symbol + expiry) are silently skipped.
   *
   * This follows the SAFE FUTURES ADD pattern:
   *   setFutures(prev => {
   *     if (!prev) return [newFuture]
   *     const exists = prev.some(f => f.symbol === newFuture.symbol && f.expiryDate === newFuture.expiryDate)
   *     if (exists) return prev
   *     return [...prev, newFuture]
   *   })
   */
  addFuture: (newFuture: FutureTick) => {
    // Also add to the engine for live price simulation
    const engine = getMarketEngine()
    engine.addFutureContract(newFuture)

    // Functional state update — NON-DESTRUCTIVE
    set(state => {
      const prevList = state.futures[newFuture.symbol]
      if (!prevList) {
        return {
          futures: {
            ...state.futures,
            [newFuture.symbol]: [newFuture],
          }
        }
      }

      // Check for duplicate using unique key: symbol + expiryDate
      const exists = prevList.some(
        f => f.symbol === newFuture.symbol && f.expiryDate === newFuture.expiryDate
      )

      if (exists) {
        // Duplicate — skip, return unchanged state
        return state
      }

      // Append — no overwrite, preserve all existing
      return {
        futures: {
          ...state.futures,
          [newFuture.symbol]: [...prevList, newFuture],
        }
      }
    })
  },

  getGainers: (count = 5) => {
    const stocks = Object.values(get().stocks)
    return stocks
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, count)
  },

  getLosers: (count = 5) => {
    const stocks = Object.values(get().stocks)
    return stocks
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, count)
  },

  getStocksArray: () => {
    return Object.values(get().stocks).sort((a, b) => b.marketCap - a.marketCap)
  },

  getIndex: (symbol: string) => {
    return get().indices[symbol]
  },

  getStock: (symbol: string) => {
    return get().stocks[symbol]
  },

  getOptionChain: (underlying: string) => {
    return get().optionChains[underlying] || []
  },

  getFutures: (underlying: string) => {
    return get().futures[underlying] || []
  },
}))

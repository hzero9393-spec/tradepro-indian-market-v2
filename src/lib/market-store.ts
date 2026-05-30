// ─── Market Data Zustand Store ───────────────────────────────────────
// Connects the client-side MarketEngine to Zustand for reactive UI updates
// Components can subscribe to this store for live price data

import { create } from 'zustand'
import {
  getMarketEngine,
  destroyMarketEngine,
  type MarketIndex,
  type MarketStock,
  type OptionTick,
  type MarketState,
} from './market-engine'

// ─── Store Types ──────────────────────────────────────────────────────
interface MarketStoreState {
  // Live market data from engine
  indices: Record<string, MarketIndex>
  stocks: Record<string, MarketStock>
  optionChains: Record<string, OptionTick[]>
  engineRunning: boolean
  tickCount: number
  lastTickTime: number

  // Actions
  startEngine: () => void
  stopEngine: () => void

  // Derived data helpers
  getGainers: (count?: number) => MarketStock[]
  getLosers: (count?: number) => MarketStock[]
  getStocksArray: () => MarketStock[]
  getIndex: (symbol: string) => MarketIndex | undefined
  getStock: (symbol: string) => MarketStock | undefined
  getOptionChain: (underlying: string) => OptionTick[]
}

// ─── Store ────────────────────────────────────────────────────────────
let unsubscribe: (() => void) | null = null

export const useMarketStore = create<MarketStoreState>((set, get) => ({
  indices: {},
  stocks: {},
  optionChains: {},
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
}))

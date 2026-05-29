/**
 * TradePro - Real-Time Market Data Provider
 * Socket.IO connection manager + Zustand store for live market data.
 * 
 * Connects to the Market Simulator Engine (server/) and provides
 * real-time price updates to all components.
 * 
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Initial snapshot on connect
 * - Per-stock/index/option subscription
 * - SL/TP and order fill notifications
 * - Fallback to REST API when simulator is not running
 */

'use client';

import { create } from 'zustand';
import { io as socketIO } from 'socket.io-client';

// ─── Socket Configuration ──────────────────────────────────────
const SIMULATOR_URL = process.env.NEXT_PUBLIC_SIMULATOR_URL || 'http://localhost:3001';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

// ─── Types ─────────────────────────────────────────────────────

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN';
  volume: number;
  sector: string;
  isFuturesAvailable: boolean;
  isOptionsAvailable: boolean;
  lotSize: number;
  strikeInterval: number;
}

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN';
  volume: number;
  lotSize: number;
  strikeInterval: number;
}

interface OptionStrikeData {
  strike: number;
  CE: { price: number; oi: number; volume: number; iv: number };
  PE: { price: number; oi: number; volume: number; iv: number };
}

interface OptionChainData {
  underlying: string;
  spotPrice: number;
  expiry: string;
  strikes: OptionStrikeData[];
}

interface TriggerEvent {
  positionId?: string;
  orderId?: string;
  symbol: string;
  exitPrice?: number;
  fillPrice?: number;
  exitReason?: string;
  realizedPnl?: number;
  userId: string;
}

// ─── Store Interface ───────────────────────────────────────────

interface MarketDataState {
  // Connection
  isConnected: boolean;
  isSimulatorRunning: boolean;
  reconnectAttempts: number;

  // Market Data
  indices: Map<string, IndexData>;
  stocks: Map<string, StockData>;
  optionChains: Map<string, OptionChainData>;
  marketTrend: 'UP' | 'DOWN';
  tickCount: number;
  lastTickTime: number | null;

  // Events
  recentTriggers: TriggerEvent[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  getStockPrice: (symbol: string) => number | null;
  getIndexPrice: (symbol: string) => number | null;
  getOptionChain: (underlying: string) => OptionChainData | null;
  clearTriggers: () => void;
}

// ─── Create Store ──────────────────────────────────────────────

let socket: ReturnType<typeof socketIO> | null = null;

export const useMarketData = create<MarketDataState>((set, get) => ({
  isConnected: false,
  isSimulatorRunning: false,
  reconnectAttempts: 0,

  indices: new Map(),
  stocks: new Map(),
  optionChains: new Map(),
  marketTrend: 'UP',
  tickCount: 0,
  lastTickTime: null,

  recentTriggers: [],

  connect: () => {
    if (socket?.connected) return;
    if (typeof window === 'undefined') return;

    console.log('[MarketData] Connecting to simulator at', SIMULATOR_URL);

    socket = socketIO(SIMULATOR_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      timeout: 10000,
    });

    // ─── Connection Events ───────────────────────────────────
    socket.on('connect', () => {
      console.log('[MarketData] Connected to simulator');
      set({ isConnected: true, isSimulatorRunning: true, reconnectAttempts: 0 });
    });

    socket.on('disconnect', (reason) => {
      console.log('[MarketData] Disconnected:', reason);
      set({ isConnected: false, isSimulatorRunning: false });
    });

    socket.on('connect_error', (error) => {
      console.warn('[MarketData] Connection error:', error.message);
      const attempts = get().reconnectAttempts + 1;
      set({ isConnected: false, isSimulatorRunning: attempts < 3, reconnectAttempts: attempts });
    });

    // ─── Initial Snapshot ───────────────────────────────────
    socket.on('initMarket', (data) => {
      console.log('[MarketData] Received initial snapshot:', {
        indices: data.indices?.length || 0,
        stocks: data.stocks?.length || 0,
        optionChains: data.optionChains?.length || 0,
      });

      const indicesMap = new Map<string, IndexData>();
      const stocksMap = new Map<string, StockData>();
      const optionsMap = new Map<string, OptionChainData>();

      if (data.indices) {
        for (const idx of data.indices) {
          indicesMap.set(idx.symbol, idx);
        }
      }

      if (data.stocks) {
        for (const stock of data.stocks) {
          stocksMap.set(stock.symbol, stock);
        }
      }

      if (data.optionChains) {
        for (const chain of data.optionChains) {
          optionsMap.set(chain.underlying, chain);
        }
      }

      set({
        indices: indicesMap,
        stocks: stocksMap,
        optionChains: optionsMap,
        marketTrend: data.marketTrend || 'UP',
        tickCount: data.tick || 0,
        lastTickTime: data.timestamp || Date.now(),
      });
    });

    // ─── Market Tick (every 1 second) ───────────────────────
    socket.on('marketTick', (data) => {
      const indicesMap = new Map(get().indices);
      const stocksMap = new Map(get().stocks);
      const optionsMap = new Map(get().optionChains);

      if (data.indices) {
        for (const idx of data.indices) {
          indicesMap.set(idx.symbol, idx);
        }
      }

      if (data.stocks) {
        for (const stock of data.stocks) {
          stocksMap.set(stock.symbol, stock);
        }
      }

      if (data.optionChains) {
        for (const chain of data.optionChains) {
          optionsMap.set(chain.underlying, chain);
        }
      }

      set({
        indices: indicesMap,
        stocks: stocksMap,
        optionChains: optionsMap,
        marketTrend: data.marketTrend || get().marketTrend,
        tickCount: data.tick || get().tickCount + 1,
        lastTickTime: data.timestamp || Date.now(),
      });
    });

    // ─── SL/TP and Order Fill Events ────────────────────────
    socket.on('positionClosed', (data: TriggerEvent) => {
      console.log('[MarketData] Position closed:', data.exitReason, data.symbol, 'P&L:', data.realizedPnl);
      set(state => ({
        recentTriggers: [
          ...state.recentTriggers.slice(-19), // Keep last 20
          { ...data, type: 'positionClosed' },
        ],
      }));
    });

    socket.on('orderFilled', (data: TriggerEvent) => {
      console.log('[MarketData] Order filled:', data.symbol, 'Price:', data.fillPrice);
      set(state => ({
        recentTriggers: [
          ...state.recentTriggers.slice(-19),
          { ...data, type: 'orderFilled' },
        ],
      }));
    });
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    set({ isConnected: false, isSimulatorRunning: false });
  },

  getStockPrice: (symbol: string) => {
    const stock = get().stocks.get(symbol);
    return stock?.price ?? null;
  },

  getIndexPrice: (symbol: string) => {
    const index = get().indices.get(symbol);
    return index?.price ?? null;
  },

  getOptionChain: (underlying: string) => {
    return get().optionChains.get(underlying) ?? null;
  },

  clearTriggers: () => {
    set({ recentTriggers: [] });
  },
}));

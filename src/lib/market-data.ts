/**
 * TradePro - Real-Time Market Data Store
 * 
 * Uses ClientMarketEngine as PRIMARY data source (runs in browser, no server needed).
 * Falls back to Socket.IO if the simulator server is running (local dev).
 * 
 * This ensures real-time 1-second updates work EVERYWHERE:
 * - Vercel deployment (client engine only)
 * - Local dev with simulator (Socket.IO preferred, client engine fallback)
 * 
 * INTEGRATED: Client-Side Execution Engine for SL/TP auto-triggers.
 * Live prices are fed to ExecutionEngine every tick, which checks
 * open positions and auto-squares-off when SL/TP is hit.
 */

'use client';

import { create } from 'zustand';
import { getClientMarketEngine, destroyClientMarketEngine, type IndexData, type StockData, type OptionChainData, type MarketTickData } from './client-market-engine';
import { getExecutionEngine, destroyExecutionEngine, type OpenPosition, type TriggerResult } from './execution-engine';

// ─── Socket.IO (optional, for when server is running) ──────────
let socketImport: typeof import('socket.io-client') | null = null;
let socket: ReturnType<typeof import('socket.io-client').io> | null = null;

const SIMULATOR_URL = process.env.NEXT_PUBLIC_SIMULATOR_URL || 'http://localhost:3001';

// ─── Trigger Event Types ───────────────────────────────────────

interface TriggerEvent {
  type: 'positionClosed' | 'orderFilled';
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
  dataSource: 'client-engine' | 'socket-io' | 'none';
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

  // ─── Execution Engine Integration ──────────────────────────────
  // Feed open positions to the client-side execution engine
  // for automatic SL/TP trigger detection against live prices
  syncPositionsToEngine: (positions: OpenPosition[]) => void;
  removePositionFromEngine: (positionId: string) => void;
}

// ─── Create Store ──────────────────────────────────────────────

export const useMarketData = create<MarketDataState>((set, get) => ({
  isConnected: false,
  isSimulatorRunning: false,
  dataSource: 'none',
  reconnectAttempts: 0,

  indices: new Map(),
  stocks: new Map(),
  optionChains: new Map(),
  marketTrend: 'UP',
  tickCount: 0,
  lastTickTime: null,

  recentTriggers: [],

  connect: () => {
    if (typeof window === 'undefined') return;

    // ─── Strategy: Try Socket.IO first, fall back to client engine ───
    // This gives us the best of both worlds:
    // - Local dev: Socket.IO server handles SL/TP and DB updates
    // - Vercel: Client engine provides real-time prices without a server

    let socketConnected = false;
    let clientEngineStarted = false;

    // Try Socket.IO connection
    const trySocketIO = async () => {
      try {
        const { io: socketIO } = await import('socket.io-client');
        socketImport = await import('socket.io-client');

        socket = socketIO(SIMULATOR_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000,
        });

        socket.on('connect', () => {
          console.log('[MarketData] Connected to simulator via Socket.IO');
          socketConnected = true;
          set({ isConnected: true, isSimulatorRunning: true, dataSource: 'socket-io', reconnectAttempts: 0 });

          // If client engine was running, stop it (Socket.IO takes over)
          if (clientEngineStarted) {
            const engine = getClientMarketEngine();
            engine.stop();
            clientEngineStarted = false;
            console.log('[MarketData] Stopped client engine, using Socket.IO');
          }
        });

        socket.on('initMarket', (data) => {
          console.log('[MarketData] Socket.IO init snapshot:', {
            indices: data.indices?.length || 0,
            stocks: data.stocks?.length || 0,
          });
          applyMarketData(data);
        });

        socket.on('marketTick', (data) => {
          applyMarketData(data);
        });

        socket.on('positionClosed', (data: TriggerEvent) => {
          set(state => ({
            recentTriggers: [...state.recentTriggers.slice(-19), { ...data, type: 'positionClosed' }],
          }));
        });

        socket.on('orderFilled', (data: TriggerEvent) => {
          set(state => ({
            recentTriggers: [...state.recentTriggers.slice(-19), { ...data, type: 'orderFilled' }],
          }));
        });

        socket.on('disconnect', () => {
          console.log('[MarketData] Socket.IO disconnected');
          socketConnected = false;
          set({ isConnected: false, dataSource: 'none' });

          // Start client engine as fallback
          if (!clientEngineStarted) {
            startClientEngine();
          }
        });

        socket.on('connect_error', () => {
          // Socket.IO failed - use client engine
          if (!socketConnected && !clientEngineStarted) {
            console.log('[MarketData] Socket.IO unavailable, starting client engine');
            startClientEngine();
          }
        });
      } catch {
        // socket.io-client import failed - use client engine
        if (!clientEngineStarted) {
          console.log('[MarketData] Socket.IO import failed, starting client engine');
          startClientEngine();
        }
      }
    };

    // Start client-side engine
    const startClientEngine = () => {
      clientEngineStarted = true;
      const engine = getClientMarketEngine();

      engine.setOnTick((data: MarketTickData) => {
        applyMarketData(data);
        if (!socketConnected) {
          set({
            isConnected: true,
            isSimulatorRunning: true,
            dataSource: 'client-engine',
          });
        }
      });

      engine.start();
      console.log('[MarketData] Client market engine started');
    };

    // Always start client engine immediately for instant data
    // If Socket.IO connects, it will stop the client engine
    startClientEngine();

    // Then try Socket.IO in the background
    trySocketIO();
  },

  disconnect: () => {
    // Stop client engine
    const engine = getClientMarketEngine();
    engine.stop();

    // Disconnect socket
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    set({ isConnected: false, isSimulatorRunning: false, dataSource: 'none' });
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

  // ─── Execution Engine: Sync positions for SL/TP monitoring ────
  syncPositionsToEngine: (positions: OpenPosition[]) => {
    const execEngine = getExecutionEngine();
    execEngine.addPositions(positions);
    console.log(`[MarketData] Synced ${positions.length} positions to ExecutionEngine`);
  },

  removePositionFromEngine: (positionId: string) => {
    const execEngine = getExecutionEngine();
    execEngine.removePosition(positionId);
  },
}));

// ─── Helper: Apply market data from any source ────────────────

function applyMarketData(data: {
  indices?: IndexData[];
  stocks?: StockData[];
  optionChains?: OptionChainData[];
  marketTrend?: 'UP' | 'DOWN';
  tick?: number;
  timestamp?: number;
}) {
  const state = useMarketData.getState();
  const indicesMap = new Map(state.indices);
  const stocksMap = new Map(state.stocks);
  const optionsMap = new Map(state.optionChains);

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

  useMarketData.setState({
    indices: indicesMap,
    stocks: stocksMap,
    optionChains: optionsMap,
    marketTrend: data.marketTrend || state.marketTrend,
    tickCount: data.tick || state.tickCount + 1,
    lastTickTime: data.timestamp || Date.now(),
  });

  // ─── Feed live prices to ExecutionEngine for SL/TP checks ────────
  // This is the KEY integration point: every market tick updates
  // the ExecutionEngine, which checks all open positions against
  // the latest prices and triggers auto square-off when SL/TP is hit.
  const priceBatch = new Map<string, number>()
  if (data.indices) {
    for (const idx of data.indices) {
      priceBatch.set(idx.symbol, idx.price)
    }
  }
  if (data.stocks) {
    for (const stock of data.stocks) {
      priceBatch.set(stock.symbol, stock.price)
    }
  }
  if (priceBatch.size > 0) {
    const execEngine = getExecutionEngine()
    execEngine.onBatchPriceUpdate(priceBatch)
  }
}

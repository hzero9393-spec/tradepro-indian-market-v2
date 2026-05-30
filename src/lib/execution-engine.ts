/**
 * TradePro - Client-Side Execution Engine
 *
 * PROBLEM: The /api/trade/check-triggers endpoint reads prices from the DATABASE,
 * but live simulated prices only exist in the client-side MarketEngine.
 * So SL/TP checks on the server NEVER see the latest price → triggers never fire.
 *
 * SOLUTION: This ExecutionEngine runs in the browser, subscribes to live market ticks,
 * and checks ALL open positions' SL/TP against real-time prices every tick.
 * When a trigger fires, it calls the server API to square-off the position.
 *
 * Features:
 * - Cross-price checking (prevPrice → currentPrice) to catch fast moves
 * - OHLC tracking per symbol to catch intra-tick triggers
 * - Floating-point tolerance (0.01 threshold)
 * - Debounced API calls to prevent duplicate square-offs
 * - Debug logging for all trigger events
 */

'use client'

// ─── Types ─────────────────────────────────────────────────────────

export interface OpenPosition {
  id: string
  userId: string
  symbol: string
  segment: string
  tradeDirection: 'BUY' | 'SELL'
  entryPrice: number
  quantity: number
  stopLoss: number | null
  target: number | null
  marginUsed: number
  totalInvested: number
  isOpen: boolean
}

export interface TriggerResult {
  positionId: string
  symbol: string
  exitReason: 'STOP_LOSS' | 'TARGET'
  exitPrice: number
  triggeredAt: number
  pnl: number
}

export type TriggerListener = (result: TriggerResult) => void

// ─── OHLC Bar for intra-tick trigger detection ────────────────────

class PriceBar {
  open: number | null = null
  high: number | null = null
  low: number | null = null
  close: number | null = null

  update(price: number): void {
    if (this.open === null) this.open = price
    this.high = this.high === null ? price : Math.max(this.high, price)
    this.low = this.low === null ? price : Math.min(this.low, price)
    this.close = price
  }

  /**
   * Check if a target/SL was hit during this bar's price range.
   * For BUY: target hit if high >= target, SL hit if low <= stopLoss
   * For SELL: target hit if low <= target, SL hit if high >= stopLoss
   */
  didHitPrice(level: number, direction: 'BUY' | 'SELL', isTarget: boolean): boolean {
    if (this.high === null || this.low === null) return false
    if (direction === 'BUY') {
      return isTarget ? this.high >= level : this.low <= level
    } else {
      return isTarget ? this.low <= level : this.high >= level
    }
  }

  reset(): void {
    this.open = null
    this.high = null
    this.low = null
    this.close = null
  }
}

// ─── Debug Logger ──────────────────────────────────────────────────

class DebugLogger {
  private static ENABLED = process.env.NODE_ENV === 'development'

  static log(event: string, data: Record<string, unknown>): void {
    if (!this.ENABLED) return
    console.log(`[ExecutionEngine] ${event}:`, {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }

  static warn(event: string, data: Record<string, unknown>): void {
    console.warn(`[ExecutionEngine] ${event}:`, data)
  }

  static error(event: string, data: Record<string, unknown>): void {
    console.error(`[ExecutionEngine] ${event}:`, data)
  }
}

// ─── Execution Engine ──────────────────────────────────────────────

export class ExecutionEngine {
  private openPositions: Map<string, OpenPosition> = new Map()
  private priceFeeds: Map<string, number> = new Map()        // symbol → latestPrice
  private lastCheckPrice: Map<string, number> = new Map()    // positionId → lastCheckedPrice
  private ohlcBars: Map<string, PriceBar> = new Map()        // symbol → current bar
  private listeners: Set<TriggerListener> = new Set()
  private squaredOffPositions: Set<string> = new Set()       // Prevent duplicate triggers
  private tickCount = 0
  private ohlcResetInterval = 5 // Reset OHLC bars every N ticks

  // Floating-point tolerance: 1 paisa
  private readonly THRESHOLD = 0.01

  /**
   * Update live price for a symbol. Called on every market tick.
   */
  onPriceUpdate(symbol: string, price: number): void {
    if (!price || price <= 0) return

    this.priceFeeds.set(symbol, price)

    // Update OHLC bar
    let bar = this.ohlcBars.get(symbol)
    if (!bar) {
      bar = new PriceBar()
      this.ohlcBars.set(symbol, bar)
    }
    bar.update(price)

    // Check all positions for this symbol
    this.checkPositionsForSymbol(symbol)
  }

  /**
   * Batch update multiple prices at once (from a tick).
   */
  onBatchPriceUpdate(prices: Map<string, number>): void {
    this.tickCount++

    // Reset OHLC bars periodically
    if (this.tickCount % this.ohlcResetInterval === 0) {
      for (const bar of this.ohlcBars.values()) {
        bar.reset()
      }
    }

    for (const [symbol, price] of prices) {
      this.onPriceUpdate(symbol, price)
    }
  }

  /**
   * Add an open position to monitor for SL/TP triggers.
   * If position already tracked, update it.
   */
  addPosition(position: OpenPosition): void {
    if (!position.stopLoss && !position.target) {
      DebugLogger.log('SKIP_NO_SL_TP', { positionId: position.id, symbol: position.symbol })
      return
    }

    this.openPositions.set(position.id, position)
    this.squaredOffPositions.delete(position.id)

    // Initialize last check price to current live price
    const currentPrice = this.priceFeeds.get(position.symbol)
    if (currentPrice) {
      this.lastCheckPrice.set(position.id, currentPrice)
    }

    DebugLogger.log('POSITION_ADDED', {
      positionId: position.id,
      symbol: position.symbol,
      direction: position.tradeDirection,
      sl: position.stopLoss,
      tp: position.target,
      livePrice: currentPrice,
    })
  }

  /**
   * Add multiple positions at once.
   */
  addPositions(positions: OpenPosition[]): void {
    for (const pos of positions) {
      this.addPosition(pos)
    }
  }

  /**
   * Remove a position (e.g., after manual square-off).
   */
  removePosition(positionId: string): void {
    this.openPositions.delete(positionId)
    this.lastCheckPrice.delete(positionId)
    this.squaredOffPositions.add(positionId)
  }

  /**
   * Remove all positions.
   */
  clearPositions(): void {
    this.openPositions.clear()
    this.lastCheckPrice.clear()
  }

  /**
   * Check all open positions for a specific symbol.
   */
  private checkPositionsForSymbol(symbol: string): void {
    const currentPrice = this.priceFeeds.get(symbol)
    if (!currentPrice) return

    for (const [positionId, position] of this.openPositions) {
      if (position.symbol !== symbol) continue
      if (this.squaredOffPositions.has(positionId)) continue

      this.checkPosition(position, currentPrice)
    }
  }

  /**
   * Check a single position against the current price.
   * Uses cross-price checking + OHLC for missed trigger detection.
   */
  private checkPosition(position: OpenPosition, currentPrice: number): void {
    const previousPrice = this.lastCheckPrice.get(position.id) ?? currentPrice
    const bar = this.ohlcBars.get(position.symbol)

    let crossedTarget = false
    let crossedSL = false

    // ─── Method 1: Cross-Price Check ────────────────────────────
    // Did price cross from previous to current?
    if (position.target) {
      crossedTarget = this.hasCrossedLevel(
        position.tradeDirection,
        previousPrice,
        currentPrice,
        position.target,
        true // isTarget
      )
    }

    if (!crossedTarget && position.stopLoss) {
      crossedSL = this.hasCrossedLevel(
        position.tradeDirection,
        previousPrice,
        currentPrice,
        position.stopLoss,
        false // isStopLoss
      )
    }

    // ─── Method 2: OHLC Bar Check ───────────────────────────────
    // Even if cross-price didn't detect, OHLC range might have hit it
    if (!crossedTarget && !crossedSL && bar) {
      if (position.target && bar.didHitPrice(position.target, position.tradeDirection, true)) {
        crossedTarget = true
        DebugLogger.log('OHLC_TARGET_DETECTED', {
          positionId: position.id,
          symbol: position.symbol,
          target: position.target,
          barHigh: bar.high,
          barLow: bar.low,
        })
      }
      if (!crossedTarget && position.stopLoss && bar.didHitPrice(position.stopLoss, position.tradeDirection, false)) {
        crossedSL = true
        DebugLogger.log('OHLC_SL_DETECTED', {
          positionId: position.id,
          symbol: position.symbol,
          stopLoss: position.stopLoss,
          barHigh: bar.high,
          barLow: bar.low,
        })
      }
    }

    // Update last check price
    this.lastCheckPrice.set(position.id, currentPrice)

    // ─── Execute if triggered ───────────────────────────────────
    if (crossedTarget || crossedSL) {
      const exitReason: 'STOP_LOSS' | 'TARGET' = crossedSL ? 'STOP_LOSS' : 'TARGET'
      this.executeTrigger(position, currentPrice, exitReason)
    }
  }

  /**
   * Cross-Price Check: Did price cross a level between prev and current?
   *
   * BUY Target: prev < target AND current >= target → TRIGGER
   * BUY SL:     prev > stopLoss AND current <= stopLoss → TRIGGER
   * SELL Target: prev > target AND current <= target → TRIGGER
   * SELL SL:     prev < stopLoss AND current >= stopLoss → TRIGGER
   */
  private hasCrossedLevel(
    direction: 'BUY' | 'SELL',
    prevPrice: number,
    currentPrice: number,
    level: number,
    isTarget: boolean
  ): boolean {
    if (direction === 'BUY') {
      if (isTarget) {
        // Target hit if price moved from below to above target
        return prevPrice < level && currentPrice >= level - this.THRESHOLD
      } else {
        // SL hit if price moved from above to below stopLoss
        return prevPrice > level && currentPrice <= level + this.THRESHOLD
      }
    } else {
      // SELL direction
      if (isTarget) {
        // Target hit if price moved from above to below target
        return prevPrice > level && currentPrice <= level + this.THRESHOLD
      } else {
        // SL hit if price moved from below to above stopLoss
        return prevPrice < level && currentPrice >= level - this.THRESHOLD
      }
    }
  }

  /**
   * Execute a trigger — emit event and attempt server-side square-off.
   */
  private executeTrigger(
    position: OpenPosition,
    exitPrice: number,
    exitReason: 'STOP_LOSS' | 'TARGET'
  ): void {
    // Prevent duplicate triggers
    if (this.squaredOffPositions.has(position.id)) return
    this.squaredOffPositions.add(position.id)

    // Calculate P&L
    let pnl: number
    if (position.tradeDirection === 'BUY') {
      pnl = (exitPrice - position.entryPrice) * position.quantity
    } else {
      pnl = (position.entryPrice - exitPrice) * position.quantity
    }

    DebugLogger.log('TRIGGER_FIRED', {
      positionId: position.id,
      symbol: position.symbol,
      direction: position.tradeDirection,
      exitReason,
      exitPrice,
      entryPrice: position.entryPrice,
      pnl: pnl.toFixed(2),
      sl: position.stopLoss,
      tp: position.target,
    })

    const result: TriggerResult = {
      positionId: position.id,
      symbol: position.symbol,
      exitReason,
      exitPrice,
      triggeredAt: Date.now(),
      pnl: Number(pnl.toFixed(2)),
    }

    // Notify listeners (UI will call server API)
    for (const listener of this.listeners) {
      try {
        listener(result)
      } catch (err) {
        DebugLogger.error('LISTENER_ERROR', { error: String(err) })
      }
    }

    // Remove from tracking
    this.openPositions.delete(position.id)
    this.lastCheckPrice.delete(position.id)
  }

  /**
   * Subscribe to trigger events.
   * Returns unsubscribe function.
   */
  subscribe(listener: TriggerListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get number of positions being monitored.
   */
  getMonitoredCount(): number {
    return this.openPositions.size
  }

  /**
   * Get current live price for a symbol.
   */
  getLivePrice(symbol: string): number | null {
    return this.priceFeeds.get(symbol) ?? null
  }

  /**
   * Get all monitored position IDs.
   */
  getMonitoredPositionIds(): string[] {
    return Array.from(this.openPositions.keys())
  }
}

// ─── Singleton ─────────────────────────────────────────────────────

let engineInstance: ExecutionEngine | null = null

export function getExecutionEngine(): ExecutionEngine {
  if (!engineInstance) {
    engineInstance = new ExecutionEngine()
    console.log('[ExecutionEngine] Created singleton instance')
  }
  return engineInstance
}

export function destroyExecutionEngine(): void {
  if (engineInstance) {
    engineInstance.clearPositions()
    engineInstance = null
    console.log('[ExecutionEngine] Destroyed')
  }
}

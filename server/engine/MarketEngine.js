/**
 * TradePro Market Simulator - Market Engine
 * Core 1-second tick loop that updates indices, stocks, and option chains.
 * Also checks SL/TP triggers and LIMIT order execution on every tick.
 * Updates Turso database periodically for API route compatibility.
 */

const PriceSimulator = require('./PriceSimulator');
const OptionChainEngine = require('./OptionChainEngine');
const initialIndices = require('../data/indices');
const initialStocks = require('../data/stocks');
const config = require('../data/config');
const { round2 } = require('../utils/helpers');

class MarketEngine {
  constructor() {
    this.indices = [];
    this.stocks = [];
    this.optionChains = new Map();
    this.priceSimulator = new PriceSimulator();
    this.optionChainEngine = new OptionChainEngine();
    this.interval = null;
    this.tickCount = 0;
    this.lastTimestamp = Date.now();
    this.listeners = [];  // Callback functions for tick events
    this.dbClient = null; // libSQL client for DB updates
    this.io = null;       // Socket.IO instance

    // Initialize data
    this._initializeData();
  }

  /**
   * Initialize indices and stocks with base prices.
   */
  _initializeData() {
    // Initialize indices with base price tracking
    this.indices = initialIndices.map(idx => ({
      ...idx,
      basePrice: idx.price,  // Track base price for change calculation
      change: 0,
      changePercent: 0,
      trend: Math.random() > 0.5 ? 'UP' : 'DOWN',
    }));

    // Initialize stocks with base price tracking
    this.stocks = initialStocks.map(stock => ({
      ...stock,
      basePrice: stock.price,  // Track base price for change calculation
    }));

    // Generate initial option chains
    this.optionChains = this.optionChainEngine.updateAllOptionChains(this.indices);

    console.log(`[MarketEngine] Initialized with ${this.indices.length} indices, ${this.stocks.length} stocks`);
  }

  /**
   * Set the Socket.IO instance for broadcasting.
   */
  setIO(io) {
    this.io = io;
  }

  /**
   * Set the database client for direct DB updates.
   */
  setDbClient(client) {
    this.dbClient = client;
    console.log('[MarketEngine] Database client connected');
  }

  /**
   * Start the 1-second tick loop.
   */
  start() {
    console.log('[MarketEngine] Starting simulation...');

    this.interval = setInterval(() => {
      try {
        const tick = this.generateTick();
        this.broadcast(tick);
        this.tickCount++;
      } catch (error) {
        console.error('[MarketEngine] Tick error:', error.message);
      }
    }, config.TICK_INTERVAL_MS);

    console.log(`[MarketEngine] Running at ${config.TICK_INTERVAL_MS}ms interval`);
  }

  /**
   * Stop the simulation.
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MarketEngine] Stopped');
    }
  }

  /**
   * Generate a single tick of market data.
   * This is the core loop that runs every second.
   */
  generateTick() {
    const startTime = Date.now();

    // Step 1: Update market-wide trend
    this.priceSimulator.updateMarketTrend();
    const marketTrend = this.priceSimulator.marketTrend;

    // Step 2: Update all indices
    this.indices = this.indices.map(idx =>
      this.priceSimulator.updateIndex(idx)
    );

    // Step 3: Update all stocks based on market trend
    this.stocks = this.stocks.map(stock =>
      this.priceSimulator.updateStock(stock, marketTrend)
    );

    // Step 4: Update option chains every 5 ticks (5 seconds, not every tick)
    if (this.tickCount % 5 === 0) {
      this.optionChains = this.optionChainEngine.updateAllOptionChains(this.indices);
    }

    // Step 5: Update database periodically (every N ticks)
    if (this.tickCount % config.DB_UPDATE_INTERVAL_TICKS === 0 && this.dbClient) {
      this._updateDatabase().catch(err =>
        console.error('[MarketEngine] DB update error:', err.message)
      );
    }

    // Step 6: Check SL/TP and LIMIT orders (if DB is connected)
    if (this.dbClient && config.CHECK_SL_TP_ON_TICK) {
      this._checkTriggers().catch(err =>
        console.error('[MarketEngine] Trigger check error:', err.message)
      );
    }

    const processingTime = Date.now() - startTime;

    return {
      timestamp: Date.now(),
      tick: this.tickCount,
      marketTrend,
      indices: this.indices.map(idx => ({
        symbol: idx.symbol,
        name: idx.name,
        price: idx.price,
        change: idx.change,
        changePercent: idx.changePercent,
        trend: idx.trend,
        volume: idx.volume,
        lotSize: idx.lotSize,
        strikeInterval: idx.strikeInterval,
      })),
      stocks: this.stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        trend: stock.trend,
        volume: stock.volume,
        sector: stock.sector,
        isFuturesAvailable: stock.isFuturesAvailable,
        isOptionsAvailable: stock.isOptionsAvailable,
        lotSize: stock.lotSize,
        strikeInterval: stock.strikeInterval,
      })),
      optionChains: this.tickCount % 5 === 0 ? Array.from(this.optionChains.values()) : undefined,
      processingTime,
    };
  }

  /**
   * Broadcast tick data via Socket.IO and listeners.
   */
  broadcast(tick) {
    // Broadcast via Socket.IO
    if (this.io) {
      // Send lightweight tick with only indices and stocks (no option chains in tick)
      const lightTick = {
        timestamp: tick.timestamp,
        tick: tick.tick,
        marketTrend: tick.marketTrend,
        indices: tick.indices,
        stocks: tick.stocks,
        processingTime: tick.processingTime,
      };
      this.io.emit('marketTick', lightTick);

      // Also emit individual stock updates for targeted subscriptions
      for (const stock of tick.stocks) {
        this.io.emit(`stock:${stock.symbol}`, stock);
      }
      for (const index of tick.indices) {
        this.io.emit(`index:${index.symbol}`, index);
      }
      // Broadcast option chains separately (every 5th tick)
      if (tick.optionChains && Array.isArray(tick.optionChains)) {
        for (const chain of tick.optionChains) {
          this.io.emit(`options:${chain.underlying}`, chain);
        }
      }
    }

    // Notify local listeners
    for (const listener of this.listeners) {
      try {
        listener(tick);
      } catch (err) {
        console.error('[MarketEngine] Listener error:', err.message);
      }
    }
  }

  /**
   * Get current market snapshot (for initial connection).
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      tick: this.tickCount,
      marketTrend: this.priceSimulator.marketTrend,
      indices: this.indices.map(idx => ({
        symbol: idx.symbol,
        name: idx.name,
        price: idx.price,
        change: idx.change,
        changePercent: idx.changePercent,
        trend: idx.trend,
        volume: idx.volume,
        lotSize: idx.lotSize,
        strikeInterval: idx.strikeInterval,
      })),
      stocks: this.stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        trend: stock.trend,
        volume: stock.volume,
        sector: stock.sector,
        isFuturesAvailable: stock.isFuturesAvailable,
        isOptionsAvailable: stock.isOptionsAvailable,
        lotSize: stock.lotSize,
        strikeInterval: stock.strikeInterval,
      })),
      optionChains: Array.from(this.optionChains.values()),
    };
  }

  /**
   * Get current price for a symbol.
   */
  getPrice(symbol) {
    // Check indices first
    const index = this.indices.find(idx => idx.symbol === symbol);
    if (index) return index.price;

    // Check stocks
    const stock = this.stocks.find(s => s.symbol === symbol);
    if (stock) return stock.price;

    return null;
  }

  /**
   * Update the Turso database with current prices.
   * Called every N ticks to reduce DB load.
   */
  async _updateDatabase() {
    if (!this.dbClient) return;

    try {
      // Batch update stock prices
      for (const stock of this.stocks) {
        await this.dbClient.execute({
          sql: `UPDATE stocks SET currentPrice = ?, change = ?, changePercent = ?, volume = ?, lastUpdated = CURRENT_TIMESTAMP WHERE symbol = ?`,
          args: [stock.price, stock.change, stock.changePercent, stock.volume, stock.symbol],
        });
      }

      // Batch update index prices
      for (const idx of this.indices) {
        await this.dbClient.execute({
          sql: `UPDATE indices SET currentPrice = ?, change = ?, changePercent = ?, volume = ?, lastUpdated = CURRENT_TIMESTAMP WHERE symbol = ?`,
          args: [idx.price, idx.change, idx.changePercent, idx.volume, idx.symbol],
        });
      }

      // Update futures prices (based on index/stock prices + basis)
      for (const idx of this.indices) {
        // Futures have a small basis over spot (contango)
        const basis = round2(idx.price * (0.001 + Math.random() * 0.003));
        const futurePrice = round2(idx.price + basis);
        await this.dbClient.execute({
          sql: `UPDATE futures SET ltp = ?, change = ?, changePercent = ?, lastUpdated = CURRENT_TIMESTAMP WHERE underlying = ? AND isActive = 1`,
          args: [futurePrice, idx.change, idx.changePercent, idx.symbol],
        });
      }

      // Update option prices from option chains
      for (const [underlying, chain] of this.optionChains) {
        for (const strikeData of chain.strikes) {
          // Update CE option
          await this.dbClient.execute({
            sql: `UPDATE options SET ltp = ?, openInterest = ?, volume = ?, impliedVolatility = ?, underlyingPrice = ?, lastUpdated = CURRENT_TIMESTAMP 
                  WHERE underlying = ? AND strikePrice = ? AND optionType = 'CE' AND isActive = 1`,
            args: [strikeData.CE.price, strikeData.CE.oi, strikeData.CE.volume, strikeData.CE.iv, chain.spotPrice, underlying, strikeData.strike],
          });

          // Update PE option
          await this.dbClient.execute({
            sql: `UPDATE options SET ltp = ?, openInterest = ?, volume = ?, impliedVolatility = ?, underlyingPrice = ?, lastUpdated = CURRENT_TIMESTAMP 
                  WHERE underlying = ? AND strikePrice = ? AND optionType = 'PE' AND isActive = 1`,
            args: [strikeData.PE.price, strikeData.PE.oi, strikeData.PE.volume, strikeData.PE.iv, chain.spotPrice, underlying, strikeData.strike],
          });
        }
      }
    } catch (error) {
      console.error('[MarketEngine] DB batch update error:', error.message);
    }
  }

  /**
   * Check SL/TP triggers and LIMIT order execution on every tick.
   * This replaces the frontend polling approach with event-driven checking.
   */
  async _checkTriggers() {
    if (!this.dbClient) return;

    try {
      // ─── 1. Check PENDING LIMIT orders ─────────────────────────
      if (config.CHECK_LIMIT_ORDERS_ON_TICK) {
        const pendingOrders = await this.dbClient.execute(
          `SELECT * FROM orders WHERE status = 'PENDING' LIMIT 50`
        );

        for (const order of pendingOrders.rows) {
          const currentPrice = this._getPriceForOrder(order);
          if (!currentPrice) continue;

          let shouldTrigger = false;

          // LIMIT order: BUY when price <= limit price, SELL when price >= limit price
          if (order.orderType === 'LIMIT') {
            if (order.tradeDirection === 'BUY' && currentPrice <= order.price) shouldTrigger = true;
            if (order.tradeDirection === 'SELL' && currentPrice >= order.price) shouldTrigger = true;
          }

          // SL order: BUY when price >= trigger price, SELL when price <= trigger price
          if (order.orderType === 'SL' || order.orderType === 'SL_M') {
            const triggerPrice = order.triggerPrice || order.price;
            if (order.tradeDirection === 'BUY' && currentPrice >= triggerPrice) shouldTrigger = true;
            if (order.tradeDirection === 'SELL' && currentPrice <= triggerPrice) shouldTrigger = true;
          }

          if (shouldTrigger) {
            await this._executeTriggeredOrder(order, currentPrice);
          }
        }
      }

      // ─── 2. Check SL/TP on open positions ──────────────────────
      const openPositions = await this.dbClient.execute(
        `SELECT * FROM positions WHERE isOpen = 1 AND (stopLoss > 0 OR target > 0) LIMIT 100`
      );

      for (const position of openPositions.rows) {
        const currentPrice = this._getPriceForPosition(position);
        if (!currentPrice) continue;

        let shouldExit = false;
        let exitReason = '';

        // Check Stop Loss
        if (position.stopLoss && position.stopLoss > 0) {
          // BUY position: SL triggers when price <= stopLoss
          if (position.tradeDirection === 'BUY' && currentPrice <= position.stopLoss) {
            shouldExit = true;
            exitReason = 'STOP_LOSS';
          }
          // SELL position: SL triggers when price >= stopLoss
          if (position.tradeDirection === 'SELL' && currentPrice >= position.stopLoss) {
            shouldExit = true;
            exitReason = 'STOP_LOSS';
          }
        }

        // Check Target (only if SL hasn't triggered)
        if (!shouldExit && position.target && position.target > 0) {
          // BUY position: Target triggers when price >= target
          if (position.tradeDirection === 'BUY' && currentPrice >= position.target) {
            shouldExit = true;
            exitReason = 'TARGET';
          }
          // SELL position: Target triggers when price <= target
          if (position.tradeDirection === 'SELL' && currentPrice <= position.target) {
            shouldExit = true;
            exitReason = 'TARGET';
          }
        }

        if (shouldExit) {
          await this._executeSquareOff(position, currentPrice, exitReason);
        }
      }
    } catch (error) {
      // Silent error - don't break the tick loop
      console.error('[MarketEngine] Trigger check error:', error.message);
    }
  }

  /**
   * Get current price for an order based on its segment and symbol.
   */
  _getPriceForOrder(order) {
    if (order.segment === 'EQUITY') {
      return this.getPrice(order.symbol);
    }
    if (order.segment === 'FUTURES') {
      const idx = this.indices.find(i => i.symbol === order.symbol);
      if (idx) {
        // Future price = spot + basis
        return round2(idx.price * (1 + 0.001 + Math.random() * 0.003));
      }
      return this.getPrice(order.symbol);
    }
    if (order.segment === 'OPTIONS') {
      // Look up option price from option chains
      for (const [, chain] of this.optionChains) {
        if (chain.underlying === order.symbol) {
          const strikeData = chain.strikes.find(s => s.strike === order.strikePrice);
          if (strikeData) {
            return order.optionType === 'CE' ? strikeData.CE.price : strikeData.PE.price;
          }
        }
      }
    }
    return null;
  }

  /**
   * Get current price for a position based on its segment and symbol.
   */
  _getPriceForPosition(position) {
    return this._getPriceForOrder(position);
  }

  /**
   * Execute a triggered LIMIT/SL order.
   * This is called from the engine's tick loop when price conditions are met.
   */
  async _executeTriggeredOrder(order, currentPrice) {
    if (!this.dbClient) return;

    try {
      const fillPrice = currentPrice;
      const totalValue = Math.round(order.quantity * fillPrice * 100) / 100;

      // Check user balance
      const userResult = await this.dbClient.execute({
        sql: `SELECT virtualBalance FROM users WHERE id = ?`,
        args: [order.userId],
      });

      if (userResult.rows.length === 0) return;
      const userBalance = userResult.rows[0].virtualBalance;

      // Validate balance/margin before executing
      if (order.segment === 'EQUITY' && order.tradeDirection === 'BUY') {
        const brokerage = Math.max(20, Math.min(500, Math.round(totalValue * 0.0005 * 100) / 100));
        if (userBalance < totalValue + brokerage) {
          // Reject - insufficient balance
          await this.dbClient.execute({
            sql: `UPDATE orders SET status = 'REJECTED', rejectReason = 'Insufficient balance at trigger time', cancelledAt = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [order.id],
          });
          return;
        }
      }

      // Update order to FILLED
      await this.dbClient.execute({
        sql: `UPDATE orders SET status = 'FILLED', fillPrice = ?, totalValue = ?, filledAt = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [fillPrice, totalValue, order.id],
      });

      // Create trade record
      const brokerage = Math.max(20, Math.min(500, Math.round(totalValue * 0.0005 * 100) / 100));
      await this.dbClient.execute({
        sql: `INSERT INTO trades (id, userId, orderId, segment, productType, tradeDirection, symbol, instrumentId, optionType, strikePrice, expiryDate, quantity, fillPrice, totalValue, brokerage, executedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          `trd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          order.userId,
          order.id,
          order.segment,
          order.productType,
          order.tradeDirection,
          order.symbol,
          order.instrumentId || null,
          order.optionType || null,
          order.strikePrice || null,
          order.expiryDate || null,
          order.quantity,
          fillPrice,
          totalValue,
          brokerage,
        ],
      });

      // Handle position creation/update based on segment
      if (order.segment === 'EQUITY' && order.tradeDirection === 'BUY') {
        const requiredAmount = totalValue + brokerage;
        await this.dbClient.execute({
          sql: `UPDATE users SET virtualBalance = virtualBalance - ?, totalTrades = totalTrades + 1, totalPnl = totalPnl - ? WHERE id = ?`,
          args: [requiredAmount, brokerage, order.userId],
        });

        // Check for existing position
        const existingPos = await this.dbClient.execute({
          sql: `SELECT * FROM positions WHERE userId = ? AND symbol = ? AND segment = 'EQUITY' AND productType = ? AND tradeDirection = 'BUY' AND isOpen = 1`,
          args: [order.userId, order.symbol, order.productType],
        });

        if (existingPos.rows.length > 0) {
          const pos = existingPos.rows[0];
          const newQty = pos.quantity + order.quantity;
          const newInvested = pos.totalInvested + totalValue;
          const newEntry = Math.round((newInvested / newQty) * 100) / 100;
          const newCurrent = newQty * currentPrice;
          await this.dbClient.execute({
            sql: `UPDATE positions SET quantity = ?, entryPrice = ?, totalInvested = ?, currentValue = ?, currentPrice = ?, unrealizedPnl = ?, stopLoss = COALESCE(?, stopLoss), target = COALESCE(?, target) WHERE id = ?`,
            args: [
              newQty, newEntry, newInvested, newCurrent, currentPrice,
              Math.round((newCurrent - newInvested) * 100) / 100,
              order.stopLoss || null, order.target || null, pos.id,
            ],
          });
        } else {
          const currentValue = order.quantity * currentPrice;
          await this.dbClient.execute({
            sql: `INSERT INTO positions (id, userId, segment, productType, tradeDirection, symbol, quantity, entryPrice, currentPrice, totalInvested, currentValue, unrealizedPnl, stopLoss, target, isOpen, createdAt) 
                  VALUES (?, ?, 'EQUITY', ?, 'BUY', ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            args: [
              `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              order.userId, order.productType, order.symbol, order.quantity,
              fillPrice, currentPrice, totalValue, currentValue,
              Math.round((currentValue - totalValue) * 100) / 100,
              order.stopLoss || null, order.target || null,
            ],
          });
        }
      } else if (order.segment === 'OPTIONS' && order.tradeDirection === 'BUY') {
        const requiredAmount = totalValue + brokerage;
        await this.dbClient.execute({
          sql: `UPDATE users SET virtualBalance = virtualBalance - ?, totalTrades = totalTrades + 1, totalPnl = totalPnl - ? WHERE id = ?`,
          args: [requiredAmount, brokerage, order.userId],
        });

        // Check for existing options position
        const existingPos = await this.dbClient.execute({
          sql: `SELECT * FROM positions WHERE userId = ? AND symbol = ? AND segment = 'OPTIONS' AND optionType = ? AND strikePrice = ? AND productType = ? AND tradeDirection = 'BUY' AND isOpen = 1`,
          args: [order.userId, order.symbol, order.optionType, order.strikePrice, order.productType],
        });

        if (existingPos.rows.length > 0) {
          const pos = existingPos.rows[0];
          const newQty = pos.quantity + order.quantity;
          const newInvested = pos.totalInvested + totalValue;
          const newEntry = Math.round((newInvested / newQty) * 100) / 100;
          const newCurrent = newQty * currentPrice;
          await this.dbClient.execute({
            sql: `UPDATE positions SET quantity = ?, lots = lots + ?, entryPrice = ?, totalInvested = ?, currentValue = ?, currentPrice = ?, unrealizedPnl = ?, stopLoss = COALESCE(?, stopLoss), target = COALESCE(?, target) WHERE id = ?`,
            args: [
              newQty, order.lots || 1, newEntry, newInvested, newCurrent, currentPrice,
              Math.round((newCurrent - newInvested) * 100) / 100,
              order.stopLoss || null, order.target || null, pos.id,
            ],
          });
        } else {
          const currentValue = order.quantity * currentPrice;
          await this.dbClient.execute({
            sql: `INSERT INTO positions (id, userId, segment, productType, tradeDirection, symbol, optionType, strikePrice, lotSize, lots, quantity, entryPrice, currentPrice, totalInvested, currentValue, unrealizedPnl, stopLoss, target, isOpen, createdAt) 
                  VALUES (?, ?, 'OPTIONS', ?, 'BUY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
            args: [
              `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              order.userId, order.productType, order.symbol, order.optionType || null,
              order.strikePrice || null, order.lotSize || 50, order.lots || 1,
              order.quantity, fillPrice, currentPrice, totalValue, currentValue,
              Math.round((currentValue - totalValue) * 100) / 100,
              order.stopLoss || null, order.target || null,
            ],
          });
        }
      }

      console.log(`[MarketEngine] Order ${order.id} FILLED at ₹${fillPrice}`);

      // Notify via Socket.IO
      if (this.io) {
        this.io.emit('orderFilled', {
          orderId: order.id,
          symbol: order.symbol,
          fillPrice,
          userId: order.userId,
        });
      }
    } catch (error) {
      console.error(`[MarketEngine] Error executing order ${order.id}:`, error.message);
    }
  }

  /**
   * Execute square-off for a position that hit SL or Target.
   */
  async _executeSquareOff(position, currentPrice, exitReason) {
    if (!this.dbClient) return;

    try {
      const closeDirection = position.tradeDirection === 'BUY' ? 'SELL' : 'BUY';
      const totalValue = Math.round(position.quantity * currentPrice * 100) / 100;
      const brokerage = Math.max(20, Math.min(500, Math.round(totalValue * 0.0005 * 100) / 100));

      let realizedPnl;
      if (position.tradeDirection === 'BUY') {
        realizedPnl = (currentPrice - position.entryPrice) * position.quantity - brokerage;
      } else {
        realizedPnl = (position.entryPrice - currentPrice) * position.quantity - brokerage;
      }
      realizedPnl = Math.round(realizedPnl * 100) / 100;

      const pnlPercent = position.entryPrice > 0
        ? Math.round((realizedPnl / position.totalInvested) * 10000) / 100
        : 0;

      // Create exit order
      await this.dbClient.execute({
        sql: `INSERT INTO orders (id, userId, orderType, tradeDirection, segment, productType, symbol, instrumentId, optionType, strikePrice, expiryDate, lotSize, lots, quantity, price, fillPrice, totalValue, brokerage, marginRequired, status, placedAt, filledAt) 
              VALUES (?, ?, 'MARKET', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FILLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position.userId, closeDirection, position.segment, position.productType,
          position.symbol, position.instrumentId || null, position.optionType || null,
          position.strikePrice || null, position.expiryDate || null,
          position.lotSize || 1, position.lots || 1, position.quantity,
          currentPrice, currentPrice, totalValue, brokerage, position.marginUsed || 0,
        ],
      });

      // Create exit trade
      await this.dbClient.execute({
        sql: `INSERT INTO trades (id, userId, segment, productType, tradeDirection, symbol, instrumentId, optionType, strikePrice, quantity, fillPrice, totalValue, brokerage, pnl, pnlPercent, executedAt, squaredOffAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          `trd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position.userId, position.segment, position.productType,
          closeDirection, position.symbol, position.instrumentId || null,
          position.optionType || null, position.strikePrice || null,
          position.quantity, currentPrice, totalValue, brokerage,
          realizedPnl, pnlPercent,
        ],
      });

      // Close position
      await this.dbClient.execute({
        sql: `UPDATE positions SET isOpen = 0, currentPrice = ?, currentValue = 0, unrealizedPnl = 0, realizedPnl = realizedPnl + ?, squaredOffAt = CURRENT_TIMESTAMP, exitReason = ? WHERE id = ?`,
        args: [currentPrice, realizedPnl, exitReason, position.id],
      });

      // Update user balance
      if (position.tradeDirection === 'BUY') {
        const proceeds = totalValue - brokerage;
        await this.dbClient.execute({
          sql: `UPDATE users SET virtualBalance = virtualBalance + ?, totalTrades = totalTrades + 1, totalPnl = totalPnl + ?, marginUsed = marginUsed - ? WHERE id = ?`,
          args: [proceeds, realizedPnl, position.marginUsed || 0, position.userId],
        });
      } else {
        const marginReturn = (position.marginUsed || 0) + realizedPnl;
        await this.dbClient.execute({
          sql: `UPDATE users SET virtualBalance = virtualBalance + ?, totalTrades = totalTrades + 1, totalPnl = totalPnl + ?, marginUsed = marginUsed - ? WHERE id = ?`,
          args: [marginReturn, realizedPnl, position.marginUsed || 0, position.userId],
        });
      }

      console.log(`[MarketEngine] Position ${position.id} squared off (${exitReason}) at ₹${currentPrice}, P&L: ₹${realizedPnl}`);

      // Notify via Socket.IO
      if (this.io) {
        this.io.emit('positionClosed', {
          positionId: position.id,
          symbol: position.symbol,
          exitPrice: currentPrice,
          exitReason,
          realizedPnl,
          userId: position.userId,
        });
      }
    } catch (error) {
      console.error(`[MarketEngine] Error squaring off position ${position.id}:`, error.message);
    }
  }

  /**
   * Get engine stats for monitoring.
   */
  getStats() {
    return {
      tickCount: this.tickCount,
      indexCount: this.indices.length,
      stockCount: this.stocks.length,
      optionChainCount: this.optionChains.size,
      marketTrend: this.priceSimulator.marketTrend,
      isRunning: this.interval !== null,
      dbConnected: this.dbClient !== null,
    };
  }
}

module.exports = MarketEngine;

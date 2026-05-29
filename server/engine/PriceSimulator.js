/**
 * TradePro Market Simulator - Price Simulator
 * Deterministic price movement algorithms with trend system,
 * market correlation, and realistic volatility.
 */

const { calculateMovement, clamp, round2, calculateVolumeChange } = require('../utils/helpers');
const config = require('../data/config');

class PriceSimulator {
  constructor() {
    this.marketTrend = 'UP';  // Global market trend
    this.trendDuration = 0;    // How long current trend has lasted
    this.trendMaxLength = 300; // Max ticks before trend change (5 min at 1s ticks)
  }

  /**
   * Update market-wide trend.
   * 60% continue, 40% reverse.
   * Trend changes every few minutes for realism.
   */
  updateMarketTrend() {
    this.trendDuration++;

    // Change trend after random duration (2-5 minutes = 120-300 ticks)
    if (this.trendDuration >= this.trendMaxLength) {
      this.marketTrend = this.marketTrend === 'UP' ? 'DOWN' : 'UP';
      this.trendDuration = 0;
      this.trendMaxLength = 120 + Math.floor(Math.random() * 180); // 2-5 minutes
    }

    // Small chance of trend reversal each tick (1%)
    if (Math.random() < 0.01) {
      this.marketTrend = this.marketTrend === 'UP' ? 'DOWN' : 'UP';
      this.trendDuration = 0;
    }
  }

  /**
   * Update an index price.
   * Indices have lower volatility and drive market trend.
   */
  updateIndex(index) {
    const trendContinue = Math.random() < config.TREND_CONTINUE_PROBABILITY;
    let direction = trendContinue ? index.trend : (index.trend === 'UP' ? 'DOWN' : 'UP');

    let movement = calculateMovement(index.volatility);

    if (direction === 'UP') {
      movement = Math.abs(movement);
    } else {
      movement = -Math.abs(movement);
    }

    let newPrice = index.price + movement;
    newPrice = Math.max(newPrice, 0.01);

    const maxMove = index.price * config.MAX_PRICE_CHANGE_PER_TICK;
    newPrice = clamp(newPrice, index.price - maxMove, index.price + maxMove);
    newPrice = round2(newPrice);

    const basePrice = index.basePrice || index.price;
    const change = round2(newPrice - basePrice);
    const changePercent = round2((change / basePrice) * 100);
    const volume = calculateVolumeChange(Math.abs(movement), index.volume);

    return {
      ...index,
      price: newPrice,
      change,
      changePercent,
      trend: direction,
      volume,
    };
  }

  /**
   * Update a stock price.
   * Stocks follow index trend with correlation and sector-specific volatility.
   */
  updateStock(stock, marketTrend) {
    const trendContinue = Math.random() < config.TREND_CONTINUE_PROBABILITY;
    let direction = trendContinue ? stock.trend : (stock.trend === 'UP' ? 'DOWN' : 'UP');

    let movement = calculateMovement(stock.volatility);

    if (direction === 'UP') {
      movement = Math.abs(movement);
    } else {
      movement = -Math.abs(movement);
    }

    // Apply market correlation (stocks follow index trend)
    if (marketTrend === 'UP') {
      movement += Math.abs(movement) * config.MARKET_CORRELATION;
    } else {
      movement -= Math.abs(movement) * config.MARKET_CORRELATION;
    }

    let newPrice = stock.price + movement;
    newPrice = Math.max(newPrice, 0.01);

    const maxMove = stock.price * config.MAX_PRICE_CHANGE_PER_TICK;
    newPrice = clamp(newPrice, stock.price - maxMove, stock.price + maxMove);
    newPrice = round2(newPrice);

    const basePrice = stock.basePrice || stock.price;
    const change = round2(newPrice - basePrice);
    const changePercent = round2((change / basePrice) * 100);
    const volume = calculateVolumeChange(Math.abs(movement), stock.volume);

    return {
      ...stock,
      price: newPrice,
      change,
      changePercent,
      trend: direction,
      volume,
    };
  }
}

module.exports = PriceSimulator;

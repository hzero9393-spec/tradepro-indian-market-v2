/**
 * TradePro Market Simulator - Configuration
 * All simulation parameters are defined here for easy tuning.
 */

module.exports = {
  // ─── Tick Configuration ──────────────────────────────────────
  TICK_INTERVAL_MS: 1000,        // 1 second per tick
  MAX_PRICE_CHANGE_PER_TICK: 0.01, // Max 1% change per tick

  // ─── Trend System ────────────────────────────────────────────
  TREND_CONTINUE_PROBABILITY: 0.60, // 60% chance to continue current trend
  MARKET_CORRELATION: 0.30,         // 30% correlation to index movement

  // ─── Volatility Ranges ───────────────────────────────────────
  INDEX_VOLATILITY: { min: 0.1, max: 0.5 },   // 0.1% to 0.5% per tick
  STOCK_VOLATILITY: { min: 0.2, max: 1.0 },    // 0.2% to 1.0% per tick
  OPTION_VOLATILITY: { min: 1.0, max: 3.0 },   // 1% to 3% per tick

  // ─── Option Chain ────────────────────────────────────────────
  OPTION_RANGE: 1000,            // +/- 1000 from ATM
  NIFTY_STEP: 50,
  BANKNIFTY_STEP: 100,
  SENSEX_STEP: 100,
  FINNIFTY_STEP: 50,
  MIDCPNIFTY_STEP: 50,
  TIME_VALUE_MIN: 5,
  TIME_VALUE_MAX: 50,
  IV_RANGE: { min: 0.12, max: 0.27 },

  // ─── Volume ──────────────────────────────────────────────────
  VOLUME_CHANGE_FACTOR: 0.10,    // Volume changes with price movement
  VOLUME_MAX_INCREASE: 1.5,     // Max 50% increase
  VOLUME_MIN_DECREASE: 0.8,     // Min 20% decrease

  // ─── Slippage ────────────────────────────────────────────────
  SLIPPAGE_PERCENT: 0.0005,     // 0.05% random slippage for realism

  // ─── SL/TP Check ─────────────────────────────────────────────
  CHECK_SL_TP_ON_TICK: true,     // Check SL/TP on every tick
  CHECK_LIMIT_ORDERS_ON_TICK: true, // Check LIMIT orders on every tick

  // ─── Database ────────────────────────────────────────────────
  DB_UPDATE_INTERVAL_TICKS: 5,   // Update DB every 5 ticks (5 seconds)

  // ─── Server ──────────────────────────────────────────────────
  PORT: 3001,
  CORS_ORIGIN: '*',

  // ─── Initial Balance ────────────────────────────────────────
  INITIAL_VIRTUAL_BALANCE: 1000000, // ₹10,00,000
};

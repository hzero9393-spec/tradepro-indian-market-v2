/**
 * TradePro Market Simulator - Option Chain Engine
 * Generates realistic option chain data for NIFTY, BANKNIFTY, etc.
 * Uses intrinsic + time value pricing with IV noise.
 */

const { round2, roundTo, getNextExpiry } = require('../utils/helpers');
const config = require('../data/config');

class OptionChainEngine {
  constructor() {
    this.expiry = getNextExpiry();
    this.tickCount = 0;
  }

  /**
   * Get the step size for an underlying instrument.
   */
  getStepSize(underlying) {
    const steps = {
      'NIFTY': config.NIFTY_STEP,
      'BANKNIFTY': config.BANKNIFTY_STEP,
      'SENSEX': config.SENSEX_STEP,
      'FINNIFTY': config.FINNIFTY_STEP,
      'MIDCPNIFTY': config.MIDCPNIFTY_STEP,
    };
    return steps[underlying] || 50;
  }

  /**
   * Generate a complete option chain for a given underlying and spot price.
   * @param {string} underlying - Index symbol (NIFTY, BANKNIFTY, etc.)
   * @param {number} spotPrice - Current spot price of the underlying
   * @returns {object} Option chain with strikes array
   */
  generateOptionChain(underlying, spotPrice) {
    const strikes = [];
    const stepSize = this.getStepSize(underlying);
    const range = config.OPTION_RANGE;
    const atmStrike = Math.round(spotPrice / stepSize) * stepSize;

    for (let strike = atmStrike - range; strike <= atmStrike + range; strike += stepSize) {
      const ceData = this.generateOptionData(spotPrice, strike, 'CE');
      const peData = this.generateOptionData(spotPrice, strike, 'PE');

      strikes.push({
        strike,
        CE: ceData,
        PE: peData,
      });
    }

    return {
      underlying,
      spotPrice: round2(spotPrice),
      expiry: this.expiry,
      strikes,
    };
  }

  /**
   * Generate data for a single option (CE or PE).
   * Price = intrinsic value + time value + random noise.
   * @param {number} spotPrice - Current spot price
   * @param {number} strike - Strike price
   * @param {string} optionType - 'CE' or 'PE'
   * @returns {object} Option data with price, OI, volume, IV
   */
  generateOptionData(spotPrice, strike, optionType) {
    // Intrinsic value
    let intrinsic = 0;
    if (optionType === 'CE') {
      intrinsic = Math.max(0, spotPrice - strike);
    } else {
      intrinsic = Math.max(0, strike - spotPrice);
    }

    // Time value (random between configured range)
    // Time value is higher near ATM, lower for deep ITM/OTM
    const diffFromATM = Math.abs(spotPrice - strike);
    const atmBonus = diffFromATM < 200 ? 1.2 : (diffFromATM < 500 ? 1.0 : 0.7);
    const timeValue = config.TIME_VALUE_MIN + Math.random() * (config.TIME_VALUE_MAX - config.TIME_VALUE_MIN);
    const adjustedTimeValue = timeValue * atmBonus;

    // Option price = intrinsic + timeValue
    let optionPrice = intrinsic + adjustedTimeValue;

    // Add minor random noise (±10%)
    optionPrice *= (0.9 + Math.random() * 0.2);

    // Ensure minimum price
    optionPrice = Math.max(0.05, optionPrice);
    optionPrice = round2(optionPrice);

    // Implied Volatility (higher for OTM, lower for ITM)
    let iv = config.IV_RANGE.min + Math.random() * (config.IV_RANGE.max - config.IV_RANGE.min);
    if (optionType === 'CE' && strike > spotPrice) iv += 0.03; // OTM CE higher IV
    if (optionType === 'PE' && strike < spotPrice) iv += 0.03; // OTM PE higher IV
    iv = roundTo(iv, 3);

    // Open Interest (highest near ATM)
    const isNearATM = diffFromATM < 200;
    const baseOI = isNearATM ? 200000 : 80000;
    const oi = Math.floor(baseOI + Math.random() * 300000);

    // Volume (correlated with OI)
    const volume = Math.floor(oi * (0.3 + Math.random() * 0.7));

    return {
      price: optionPrice,
      oi,
      volume,
      iv,
    };
  }

  /**
   * Update option chains for all indices.
   * Regenerates full chains on every tick.
   * @param {Array} indices - Array of index data objects
   * @returns {Map} Map of underlying → option chain
   */
  updateAllOptionChains(indices) {
    const chains = new Map();

    for (const index of indices) {
      // Only generate option chains for major indices
      if (['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(index.symbol)) {
        const chain = this.generateOptionChain(index.symbol, index.price);
        chains.set(index.symbol, chain);
      }
    }

    this.tickCount++;
    return chains;
  }

  /**
   * Get the current expiry string.
   */
  getExpiry() {
    return this.expiry;
  }
}

module.exports = OptionChainEngine;

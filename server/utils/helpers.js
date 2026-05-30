/**
 * TradePro Market Simulator - Math Utilities
 * Pure functions for deterministic price simulation.
 */

/**
 * Box-Muller transform for normal distribution sampling.
 * Returns a random number from standard normal distribution (mean=0, std=1).
 */
function boxMullerRandom() {
  const u1 = Math.random();
  const v1 = Math.random();
  // Prevent log(0)
  const u = u1 === 0 ? 0.0001 : u1;
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v1);
}

/**
 * Calculate price movement using volatility percentage.
 * Uses Box-Muller transform for realistic normal distribution.
 * @param {number} volatility - Volatility as percentage (e.g., 0.3 means 0.3%)
 * @returns {number} Price movement (can be positive or negative)
 */
function calculateMovement(volatility) {
  const z = boxMullerRandom();
  return z * (volatility / 100);
}

/**
 * Clamp a value between min and max.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to 2 decimal places.
 */
function round2(value) {
  return Number(value.toFixed(2));
}

/**
 * Round to given decimal places.
 */
function roundTo(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Number(Math.round(value * factor) / factor);
}

/**
 * Calculate volume change based on price movement.
 * Volume increases with larger price movements.
 * @param {number} priceChange - Absolute price change
 * @param {number} currentVolume - Current volume
 * @returns {number} New volume
 */
function calculateVolumeChange(priceChange, currentVolume) {
  const volumeChange = Math.abs(priceChange) / 10;
  let newVolume = currentVolume * (1 + volumeChange);
  newVolume = Math.min(newVolume, currentVolume * 1.5);  // Max 50% increase
  newVolume = Math.max(newVolume, currentVolume * 0.8);   // Min 20% decrease
  return Math.floor(newVolume);
}

/**
 * Get the next Thursday expiry date.
 * If today is Thursday, get next week's Thursday.
 * @returns {string} Date in DDMMMYYYY format (e.g., "28MAY2026")
 */
function getNextExpiry() {
  const today = new Date();
  const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7;
  const expiry = new Date(today);
  expiry.setDate(today.getDate() + daysUntilThursday);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(expiry.getDate()).padStart(2, '0');
  const month = months[expiry.getMonth()];
  const year = expiry.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Add random slippage to execution price.
 * @param {number} price - Original price
 * @param {number} slippagePercent - Slippage percentage (e.g., 0.0005 = 0.05%)
 * @returns {number} Price with slippage applied
 */
function applySlippage(price, slippagePercent = 0.0005) {
  const slippage = price * slippagePercent;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return round2(price + (slippage * direction));
}

/**
 * Format a number as Indian currency string.
 * @param {number} num - Number to format
 * @returns {string} Formatted string (e.g., "1,00,000.00")
 */
function formatINR(num) {
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

module.exports = {
  boxMullerRandom,
  calculateMovement,
  clamp,
  round2,
  roundTo,
  calculateVolumeChange,
  getNextExpiry,
  applySlippage,
  formatINR,
};

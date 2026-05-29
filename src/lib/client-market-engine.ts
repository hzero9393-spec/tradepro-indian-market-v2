/**
 * TradePro - Client-Side Market Data Engine
 * Runs ENTIRELY in the browser - no server needed!
 * Generates realistic price movements with 1-second ticks.
 *
 * This is the PRIMARY market data source. Socket.IO server is optional fallback.
 * Works on Vercel, Netlify, or any static hosting.
 */

'use client';

// ─── Configuration ─────────────────────────────────────────────

const CONFIG = {
  TICK_INTERVAL_MS: 1000,
  MAX_PRICE_CHANGE_PER_TICK: 0.01, // Max 1% per tick
  TREND_CONTINUE_PROBABILITY: 0.60,
  MARKET_CORRELATION: 0.30,
  OPTION_RANGE: 1000,
  NIFTY_STEP: 50,
  BANKNIFTY_STEP: 100,
  SENSEX_STEP: 100,
  FINNIFTY_STEP: 50,
  MIDCPNIFTY_STEP: 50,
  TIME_VALUE_MIN: 5,
  TIME_VALUE_MAX: 50,
  IV_RANGE: { min: 0.12, max: 0.27 },
  VOLUME_CHANGE_FACTOR: 0.10,
  VOLUME_MAX_INCREASE: 1.5,
  VOLUME_MIN_DECREASE: 0.8,
};

// ─── Types ─────────────────────────────────────────────────────

export interface IndexData {
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

export interface StockData {
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

export interface OptionStrikeData {
  strike: number;
  CE: { price: number; oi: number; volume: number; iv: number };
  PE: { price: number; oi: number; volume: number; iv: number };
}

export interface OptionChainData {
  underlying: string;
  spotPrice: number;
  expiry: string;
  strikes: OptionStrikeData[];
}

export interface MarketTickData {
  timestamp: number;
  tick: number;
  marketTrend: 'UP' | 'DOWN';
  indices: IndexData[];
  stocks: StockData[];
  optionChains?: OptionChainData[];
}

// ─── Math Utilities ────────────────────────────────────────────

function boxMullerRandom(): number {
  const u1 = Math.random();
  const v1 = Math.random();
  const u = u1 === 0 ? 0.0001 : u1;
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v1);
}

function calculateMovement(volatility: number): number {
  const z = boxMullerRandom();
  return z * (volatility / 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function roundTo(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Number(Math.round(value * factor) / factor);
}

function calculateVolumeChange(priceChange: number, currentVolume: number): number {
  const volumeChange = Math.abs(priceChange) / 10;
  let newVolume = currentVolume * (1 + volumeChange);
  newVolume = Math.min(newVolume, currentVolume * CONFIG.VOLUME_MAX_INCREASE);
  newVolume = Math.max(newVolume, currentVolume * CONFIG.VOLUME_MIN_DECREASE);
  return Math.floor(newVolume);
}

function getNextExpiry(): string {
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

// ─── Initial Data ──────────────────────────────────────────────

const INITIAL_INDICES: Omit<IndexData, 'change' | 'changePercent' | 'trend'>[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50', price: 22500.00, lotSize: 50, strikeInterval: 50, volume: 1000000 },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 48500.00, lotSize: 15, strikeInterval: 100, volume: 800000 },
  { symbol: 'FINNIFTY', name: 'FIN NIFTY', price: 23200.00, lotSize: 40, strikeInterval: 50, volume: 400000 },
  { symbol: 'SENSEX', name: 'SENSEX', price: 74200.00, lotSize: 20, strikeInterval: 100, volume: 300000 },
  { symbol: 'MIDCPNIFTY', name: 'MIDCAP NIFTY', price: 12500.00, lotSize: 75, strikeInterval: 50, volume: 250000 },
];

const MAJOR_STOCKS: Omit<StockData, 'change' | 'changePercent' | 'trend'>[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2945.50, sector: 'Energy', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 250, strikeInterval: 20, volume: 0 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', price: 3925.00, sector: 'IT', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 150, strikeInterval: 20, volume: 0 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1675.25, sector: 'Banking', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 550, strikeInterval: 10, volume: 0 },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1582.75, sector: 'IT', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 300, strikeInterval: 10, volume: 0 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1285.40, sector: 'Banking', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 700, strikeInterval: 10, volume: 0 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2418.60, sector: 'FMCG', volatility: 0.25, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 300, strikeInterval: 20, volume: 0 },
  { symbol: 'ITC', name: 'ITC Ltd', price: 468.35, sector: 'FMCG', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1600, strikeInterval: 5, volume: 0 },
  { symbol: 'SBIN', name: 'State Bank of India', price: 825.70, sector: 'Banking', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 750, strikeInterval: 5, volume: 0 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1598.45, sector: 'Telecom', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 475, strikeInterval: 10, volume: 0 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', price: 1782.30, sector: 'Banking', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 400, strikeInterval: 10, volume: 0 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3542.80, sector: 'Infrastructure', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 150, strikeInterval: 20, volume: 0 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1172.55, sector: 'Banking', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 900, strikeInterval: 10, volume: 0 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 7285.60, sector: 'Financial Services', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 125, strikeInterval: 50, volume: 0 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', price: 2918.25, sector: 'Chemicals', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 200, strikeInterval: 20, volume: 0 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', price: 12450.75, sector: 'Auto', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 50, strikeInterval: 100, volume: 0 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', price: 1782.90, sector: 'Pharma', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 525, strikeInterval: 10, volume: 0 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 978.45, sector: 'Auto', volatility: 0.60, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 550, strikeInterval: 5, volume: 0 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: 468.80, sector: 'IT', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1500, strikeInterval: 5, volume: 0 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', price: 1645.30, sector: 'IT', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 350, strikeInterval: 10, volume: 0 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', price: 11250.40, sector: 'Cement', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 50, strikeInterval: 100, volume: 0 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', price: 3582.15, sector: 'FMCG', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 175, strikeInterval: 20, volume: 0 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', price: 2542.70, sector: 'FMCG', volatility: 0.25, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 200, strikeInterval: 20, volume: 0 },
  { symbol: 'NTPC', name: 'NTPC Ltd', price: 382.55, sector: 'Energy', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2400, strikeInterval: 5, volume: 0 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', price: 318.40, sector: 'Energy', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2400, strikeInterval: 5, volume: 0 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', price: 268.75, sector: 'Energy', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 3000, strikeInterval: 5, volume: 0 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 162.30, sector: 'Metal', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 6000, strikeInterval: 2, volume: 0 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', price: 2985.60, sector: 'Infrastructure', volatility: 0.70, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 250, strikeInterval: 20, volume: 0 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', price: 1342.85, sector: 'Infrastructure', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 500, strikeInterval: 10, volume: 0 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', price: 928.50, sector: 'Metal', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 800, strikeInterval: 5, volume: 0 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', price: 498.25, sector: 'Energy', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1800, strikeInterval: 5, volume: 0 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', price: 612.80, sector: 'Energy', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 900, strikeInterval: 5, volume: 0 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', price: 638.45, sector: 'Metal', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1000, strikeInterval: 5, volume: 0 },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', price: 2682.90, sector: 'Cement', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 225, strikeInterval: 20, volume: 0 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', price: 1582.35, sector: 'IT', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 300, strikeInterval: 10, volume: 0 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', price: 1698.75, sector: 'Financial Services', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 250, strikeInterval: 10, volume: 0 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd", price: 6482.30, sector: 'Pharma', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 125, strikeInterval: 40, volume: 0 },
  { symbol: 'CIPLA', name: 'Cipla Ltd', price: 1482.60, sector: 'Pharma', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 525, strikeInterval: 10, volume: 0 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', price: 4825.45, sector: 'Auto', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 100, strikeInterval: 40, volume: 0 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', price: 5182.70, sector: 'Auto', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 100, strikeInterval: 40, volume: 0 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', price: 2845.35, sector: 'Auto', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 200, strikeInterval: 20, volume: 0 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd", price: 5582.20, sector: 'Pharma', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 100, strikeInterval: 40, volume: 0 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', price: 5382.85, sector: 'FMCG', volatility: 0.25, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 100, strikeInterval: 40, volume: 0 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', price: 1482.90, sector: 'Banking', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 500, strikeInterval: 10, volume: 0 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd', price: 658.40, sector: 'Financial Services', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1100, strikeInterval: 5, volume: 0 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd', price: 1582.55, sector: 'Financial Services', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 350, strikeInterval: 10, volume: 0 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', price: 1148.35, sector: 'FMCG', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 525, strikeInterval: 10, volume: 0 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', price: 6382.75, sector: 'Pharma', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 75, strikeInterval: 50, volume: 0 },
  // Additional stocks
  { symbol: 'BANKBARODA', name: 'Bank of Baroda Ltd', price: 268.45, sector: 'Banking', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4000, strikeInterval: 2, volume: 0 },
  { symbol: 'PNB', name: 'Punjab National Bank', price: 128.70, sector: 'Banking', volatility: 0.60, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 7000, strikeInterval: 2, volume: 0 },
  { symbol: 'AUBANK', name: 'AU Small Finance Bank Ltd', price: 698.30, sector: 'Banking', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 900, strikeInterval: 5, volume: 0 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4482.60, sector: 'Infrastructure', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 125, strikeInterval: 40, volume: 0 },
  { symbol: 'SIEMENS', name: 'Siemens Ltd', price: 7825.40, sector: 'Infrastructure', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 75, strikeInterval: 50, volume: 0 },
  { symbol: 'VEDL', name: 'Vedanta Ltd', price: 448.70, sector: 'Metal', volatility: 0.60, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2000, strikeInterval: 5, volume: 0 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', price: 298.45, sector: 'Infrastructure', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4500, strikeInterval: 2, volume: 0 },
  { symbol: 'IRCTC', name: 'IRCTC Ltd', price: 882.70, sector: 'Infrastructure', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 900, strikeInterval: 5, volume: 0 },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 238.45, sector: 'IT', volatility: 0.60, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4500, strikeInterval: 2, volume: 0 },
  { symbol: 'PAYTM', name: 'One 97 Communications Ltd', price: 698.35, sector: 'Financial Services', volatility: 0.65, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1200, strikeInterval: 5, volume: 0 },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', price: 2982.55, sector: 'Chemicals', volatility: 0.25, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 200, strikeInterval: 20, volume: 0 },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd', price: 638.85, sector: 'Cement', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1500, strikeInterval: 5, volume: 0 },
  { symbol: 'NMDC', name: 'NMDC Ltd', price: 248.30, sector: 'Metal', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4500, strikeInterval: 2, volume: 0 },
  { symbol: 'GAIL', name: 'GAIL (India) Ltd', price: 218.45, sector: 'Energy', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4000, strikeInterval: 2, volume: 0 },
  { symbol: 'DABUR', name: 'Dabur India Ltd', price: 548.75, sector: 'FMCG', volatility: 0.25, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2500, strikeInterval: 5, volume: 0 },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd', price: 658.30, sector: 'Chemicals', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 1300, strikeInterval: 5, volume: 0 },
  { symbol: 'ACC', name: 'ACC Ltd', price: 2482.40, sector: 'Cement', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 250, strikeInterval: 20, volume: 0 },
  { symbol: 'IOC', name: 'Indian Oil Corporation Ltd', price: 162.80, sector: 'Energy', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 6000, strikeInterval: 2, volume: 0 },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', price: 5825.80, sector: 'Infrastructure', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 100, strikeInterval: 40, volume: 0 },
  // Non-F&O stocks
  { symbol: 'COLPAL', name: 'Colgate-Palmolive (India) Ltd', price: 3382.70, sector: 'FMCG', volatility: 0.20, isFuturesAvailable: false, isOptionsAvailable: false, lotSize: 1, strikeInterval: 0, volume: 0 },
  { symbol: 'MARICO', name: 'Marico Ltd', price: 628.40, sector: 'FMCG', volatility: 0.25, isFuturesAvailable: false, isOptionsAvailable: false, lotSize: 1, strikeInterval: 0, volume: 0 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures Ltd', price: 178.60, sector: 'FMCG', volatility: 0.55, isFuturesAvailable: false, isOptionsAvailable: false, lotSize: 1, strikeInterval: 0, volume: 0 },
  { symbol: 'DELHIVERY', name: 'Delhivery Ltd', price: 448.25, sector: 'Infrastructure', volatility: 0.55, isFuturesAvailable: false, isOptionsAvailable: false, lotSize: 1, strikeInterval: 0, volume: 0 },
  { symbol: 'TATAMTRDVR', name: 'Tata Motors DVR Ltd', price: 482.60, sector: 'Auto', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2100, strikeInterval: 5, volume: 0 },
  { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd', price: 218.55, sector: 'Banking', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 3600, strikeInterval: 2, volume: 0 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC FIRST Bank Ltd', price: 78.90, sector: 'Banking', volatility: 0.60, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 10000, strikeInterval: 1, volume: 0 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', price: 168.35, sector: 'Banking', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 5000, strikeInterval: 2, volume: 0 },
  { symbol: 'CANBK', name: 'Canara Bank', price: 118.25, sector: 'Banking', volatility: 0.55, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 6500, strikeInterval: 2, volume: 0 },
  { symbol: 'ABB', name: 'ABB India Ltd', price: 6825.85, sector: 'Infrastructure', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 75, strikeInterval: 50, volume: 0 },
  { symbol: 'SHREECEM', name: 'Shree Cement Ltd', price: 26825.35, sector: 'Cement', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 25, strikeInterval: 200, volume: 0 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', price: 9825.60, sector: 'Auto', volatility: 0.30, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 50, strikeInterval: 80, volume: 0 },
  { symbol: 'PETRONET', name: 'Petronet LNG Ltd', price: 398.60, sector: 'Energy', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 2000, strikeInterval: 5, volume: 0 },
  { symbol: 'MCDOWELL-N', name: 'United Spirits Ltd', price: 1582.35, sector: 'FMCG', volatility: 0.40, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 350, strikeInterval: 10, volume: 0 },
  { symbol: 'CONCOR', name: 'Container Corporation of India Ltd', price: 982.35, sector: 'Infrastructure', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 900, strikeInterval: 5, volume: 0 },
  { symbol: 'MOIL', name: 'MOIL Ltd', price: 358.75, sector: 'Metal', volatility: 0.45, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 3000, strikeInterval: 5, volume: 0 },
  { symbol: 'HINDCOPPER', name: 'Hindustan Copper Ltd', price: 278.60, sector: 'Metal', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 4000, strikeInterval: 2, volume: 0 },
  { symbol: 'BEML', name: 'BEML Ltd', price: 4482.80, sector: 'Infrastructure', volatility: 0.50, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 75, strikeInterval: 40, volume: 0 },
  { symbol: 'RAMCOCEM', name: 'Ramco Cements Ltd', price: 982.55, sector: 'Cement', volatility: 0.35, isFuturesAvailable: true, isOptionsAvailable: true, lotSize: 700, strikeInterval: 5, volume: 0 },
];

// Add volatility field to the type
interface StockInitData extends Omit<StockData, 'change' | 'changePercent' | 'trend'> {
  volatility: number;
}

// ─── Client Market Engine ──────────────────────────────────────

export class ClientMarketEngine {
  private indices: (IndexData & { basePrice: number; volatility: number })[] = [];
  private stocks: (StockData & { basePrice: number; volatility: number })[] = [];
  private optionChains: Map<string, OptionChainData> = new Map();
  private tickCount = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private marketTrend: 'UP' | 'DOWN' = 'UP';
  private trendDuration = 0;
  private trendMaxLength = 300;
  private expiry = getNextExpiry();
  private onTick: ((data: MarketTickData) => void) | null = null;
  private isRunning = false;

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    // Initialize indices
    this.indices = INITIAL_INDICES.map(idx => ({
      ...idx,
      basePrice: idx.price,
      change: 0,
      changePercent: 0,
      trend: Math.random() > 0.5 ? 'UP' as const : 'DOWN' as const,
      volatility: 0.25,
    }));

    // Initialize stocks
    this.stocks = (MAJOR_STOCKS as StockInitData[]).map(stock => ({
      ...stock,
      basePrice: stock.price,
      change: 0,
      changePercent: 0,
      trend: Math.random() > 0.5 ? 'UP' as const : 'DOWN' as const,
      volume: stock.volume || Math.floor(500000 + Math.random() * 5000000),
    }));

    // Generate initial option chains
    this.optionChains = this.generateAllOptionChains();

    console.log(`[ClientEngine] Initialized with ${this.indices.length} indices, ${this.stocks.length} stocks`);
  }

  /**
   * Set the tick callback function.
   */
  setOnTick(callback: (data: MarketTickData) => void): void {
    this.onTick = callback;
  }

  /**
   * Start the 1-second tick loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('[ClientEngine] Starting simulation...');

    // Send initial snapshot immediately
    if (this.onTick) {
      this.onTick(this.generateTickData());
    }

    this.interval = setInterval(() => {
      try {
        this.generateTick();
        if (this.onTick) {
          this.onTick(this.generateTickData());
        }
      } catch (error) {
        console.error('[ClientEngine] Tick error:', error);
      }
    }, CONFIG.TICK_INTERVAL_MS);
  }

  /**
   * Stop the simulation.
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('[ClientEngine] Stopped');
  }

  /**
   * Get current state (is the engine running).
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current price for a symbol.
   */
  getPrice(symbol: string): number | null {
    const index = this.indices.find(i => i.symbol === symbol);
    if (index) return index.price;
    const stock = this.stocks.find(s => s.symbol === symbol);
    if (stock) return stock.price;
    return null;
  }

  /**
   * Get current snapshot of all data.
   */
  getSnapshot(): MarketTickData {
    return this.generateTickData();
  }

  /**
   * Generate a single tick of market data.
   */
  private generateTick(): void {
    this.tickCount++;

    // Update market trend
    this.updateMarketTrend();

    // Update indices
    for (let i = 0; i < this.indices.length; i++) {
      this.indices[i] = this.updateIndex(this.indices[i]);
    }

    // Update stocks
    for (let i = 0; i < this.stocks.length; i++) {
      this.stocks[i] = this.updateStock(this.stocks[i]);
    }

    // Update option chains every 5 ticks
    if (this.tickCount % 5 === 0) {
      this.optionChains = this.generateAllOptionChains();
    }
  }

  private updateMarketTrend(): void {
    this.trendDuration++;

    if (this.trendDuration >= this.trendMaxLength) {
      this.marketTrend = this.marketTrend === 'UP' ? 'DOWN' : 'UP';
      this.trendDuration = 0;
      this.trendMaxLength = 120 + Math.floor(Math.random() * 180);
    }

    if (Math.random() < 0.01) {
      this.marketTrend = this.marketTrend === 'UP' ? 'DOWN' : 'UP';
      this.trendDuration = 0;
    }
  }

  private updateIndex(index: IndexData & { basePrice: number; volatility: number }): IndexData & { basePrice: number; volatility: number } {
    const trendContinue = Math.random() < CONFIG.TREND_CONTINUE_PROBABILITY;
    let direction: 'UP' | 'DOWN' = trendContinue ? index.trend : (index.trend === 'UP' ? 'DOWN' : 'UP');

    let movement = calculateMovement(index.volatility);
    if (direction === 'UP') movement = Math.abs(movement);
    else movement = -Math.abs(movement);

    let newPrice = index.price + movement;
    newPrice = Math.max(newPrice, 0.01);
    const maxMove = index.price * CONFIG.MAX_PRICE_CHANGE_PER_TICK;
    newPrice = clamp(newPrice, index.price - maxMove, index.price + maxMove);
    newPrice = round2(newPrice);

    const change = round2(newPrice - index.basePrice);
    const changePercent = round2((change / index.basePrice) * 100);
    const volume = calculateVolumeChange(Math.abs(movement), index.volume);

    return { ...index, price: newPrice, change, changePercent, trend: direction, volume };
  }

  private updateStock(stock: StockData & { basePrice: number; volatility: number }): StockData & { basePrice: number; volatility: number } {
    const trendContinue = Math.random() < CONFIG.TREND_CONTINUE_PROBABILITY;
    let direction: 'UP' | 'DOWN' = trendContinue ? stock.trend : (stock.trend === 'UP' ? 'DOWN' : 'UP');

    let movement = calculateMovement(stock.volatility);
    if (direction === 'UP') movement = Math.abs(movement);
    else movement = -Math.abs(movement);

    // Market correlation
    if (this.marketTrend === 'UP') movement += Math.abs(movement) * CONFIG.MARKET_CORRELATION;
    else movement -= Math.abs(movement) * CONFIG.MARKET_CORRELATION;

    let newPrice = stock.price + movement;
    newPrice = Math.max(newPrice, 0.01);
    const maxMove = stock.price * CONFIG.MAX_PRICE_CHANGE_PER_TICK;
    newPrice = clamp(newPrice, stock.price - maxMove, stock.price + maxMove);
    newPrice = round2(newPrice);

    const change = round2(newPrice - stock.basePrice);
    const changePercent = round2((change / stock.basePrice) * 100);
    const volume = calculateVolumeChange(Math.abs(movement), stock.volume);

    return { ...stock, price: newPrice, change, changePercent, trend: direction, volume };
  }

  private generateAllOptionChains(): Map<string, OptionChainData> {
    const chains = new Map<string, OptionChainData>();
    for (const index of this.indices) {
      if (['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(index.symbol)) {
        chains.set(index.symbol, this.generateOptionChain(index.symbol, index.price));
      }
    }
    return chains;
  }

  private getStepSize(underlying: string): number {
    const steps: Record<string, number> = {
      'NIFTY': CONFIG.NIFTY_STEP,
      'BANKNIFTY': CONFIG.BANKNIFTY_STEP,
      'SENSEX': CONFIG.SENSEX_STEP,
      'FINNIFTY': CONFIG.FINNIFTY_STEP,
      'MIDCPNIFTY': CONFIG.MIDCPNIFTY_STEP,
    };
    return steps[underlying] || 50;
  }

  private generateOptionChain(underlying: string, spotPrice: number): OptionChainData {
    const strikes: OptionStrikeData[] = [];
    const stepSize = this.getStepSize(underlying);
    const atmStrike = Math.round(spotPrice / stepSize) * stepSize;

    // Generate strikes within ±1000 range from ATM
    for (let strike = atmStrike - CONFIG.OPTION_RANGE; strike <= atmStrike + CONFIG.OPTION_RANGE; strike += stepSize) {
      strikes.push({
        strike,
        CE: this.generateOptionData(spotPrice, strike, 'CE'),
        PE: this.generateOptionData(spotPrice, strike, 'PE'),
      });
    }

    return { underlying, spotPrice: round2(spotPrice), expiry: this.expiry, strikes };
  }

  private generateOptionData(spotPrice: number, strike: number, optionType: 'CE' | 'PE'): { price: number; oi: number; volume: number; iv: number } {
    let intrinsic = 0;
    if (optionType === 'CE') intrinsic = Math.max(0, spotPrice - strike);
    else intrinsic = Math.max(0, strike - spotPrice);

    const diffFromATM = Math.abs(spotPrice - strike);
    const atmBonus = diffFromATM < 200 ? 1.2 : (diffFromATM < 500 ? 1.0 : 0.7);
    const timeValue = CONFIG.TIME_VALUE_MIN + Math.random() * (CONFIG.TIME_VALUE_MAX - CONFIG.TIME_VALUE_MIN);
    const adjustedTimeValue = timeValue * atmBonus;

    let optionPrice = intrinsic + adjustedTimeValue;
    optionPrice *= (0.9 + Math.random() * 0.2);
    optionPrice = Math.max(0.05, optionPrice);
    optionPrice = round2(optionPrice);

    let iv = CONFIG.IV_RANGE.min + Math.random() * (CONFIG.IV_RANGE.max - CONFIG.IV_RANGE.min);
    if (optionType === 'CE' && strike > spotPrice) iv += 0.03;
    if (optionType === 'PE' && strike < spotPrice) iv += 0.03;
    iv = roundTo(iv, 3);

    const isNearATM = diffFromATM < 200;
    const baseOI = isNearATM ? 200000 : 80000;
    const oi = Math.floor(baseOI + Math.random() * 300000);
    const volume = Math.floor(oi * (0.3 + Math.random() * 0.7));

    return { price: optionPrice, oi, volume, iv };
  }

  private generateTickData(): MarketTickData {
    return {
      timestamp: Date.now(),
      tick: this.tickCount,
      marketTrend: this.marketTrend,
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
    };
  }
}

// ─── Singleton ─────────────────────────────────────────────────

let engineInstance: ClientMarketEngine | null = null;

export function getClientMarketEngine(): ClientMarketEngine {
  if (!engineInstance) {
    engineInstance = new ClientMarketEngine();
  }
  return engineInstance;
}

export function destroyClientMarketEngine(): void {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
  }
}

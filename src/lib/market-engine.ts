// ─── Client-Side Real-Time Demo Market Data Engine ───────────────────
// Simulates realistic Indian market data with 1-second tick updates
// Runs entirely in the browser — no server/WebSocket needed (Vercel compatible)
// Uses Box-Muller transform for normal distribution, trend/momentum simulation

// ─── Types ─────────────────────────────────────────────────────────────
export interface MarketIndex {
  symbol: string
  name: string
  currentPrice: number
  open: number
  high: number
  low: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  trend: 'up' | 'down' | 'neutral'
  trendStrength: number // 0-1
  volatility: number // annualized vol %
}

export interface MarketStock {
  symbol: string
  name: string
  currentPrice: number
  open: number
  high: number
  low: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  sector: string
  marketCap: number // in crores
  trend: 'up' | 'down' | 'neutral'
  trendStrength: number
  volatility: number
}

export interface OptionTick {
  strike: number
  ceLTP: number
  ceChngPct: number
  ceIV: number
  ceOI: number
  ceVolume: number
  peLTP: number
  peChngPct: number
  peIV: number
  peOI: number
  peVolume: number
}

// ─── Futures Tick Type ────────────────────────────────────────────────
export interface FutureTick {
  symbol: string           // Underlying: NIFTY, BANKNIFTY, RELIANCE etc
  name: string             // Display name: "NIFTY Jan 2025 Fut"
  underlyingType: 'INDEX' | 'STOCK'
  expiryDate: string       // ISO date string
  expiryType: 'WEEKLY' | 'MONTHLY'
  lotSize: number
  ltp: number
  open: number
  high: number
  low: number
  previousClose: number
  change: number
  changePercent: number
  openInterest: number     // In Lakhs
  oiChange: number
  volume: number
  basis: number            // Future Price - Spot Price
  marginPercent: number
  trend: 'up' | 'down' | 'neutral'
  trendStrength: number
  volatility: number
}

export interface MarketState {
  indices: Record<string, MarketIndex>
  stocks: Record<string, MarketStock>
  optionChains: Record<string, OptionTick[]>
  futures: Record<string, FutureTick[]>  // keyed by underlying symbol
  engineRunning: boolean
  tickCount: number
  lastTickTime: number
}

type MarketListener = (state: MarketState) => void

// ─── Index Definitions ────────────────────────────────────────────────
const INDEX_DEFINITIONS: Omit<MarketIndex, 'currentPrice' | 'open' | 'high' | 'low' | 'previousClose' | 'change' | 'changePercent' | 'volume' | 'trend' | 'trendStrength' | 'volatility'>[] = [
  { symbol: 'NIFTY', name: 'NIFTY 50' },
  { symbol: 'BANKNIFTY', name: 'BANK NIFTY' },
  { symbol: 'FINNIFTY', name: 'FINNIFTY' },
  { symbol: 'SENSEX', name: 'SENSEX' },
  { symbol: 'MIDCPNIFTY', name: 'MIDCAP NIFTY' },
]

const INDEX_BASE_PRICES: Record<string, number> = {
  NIFTY: 24500,
  BANKNIFTY: 52000,
  FINNIFTY: 23500,
  SENSEX: 81000,
  MIDCPNIFTY: 12500,
}

const INDEX_VOLATILITY: Record<string, number> = {
  NIFTY: 14,
  BANKNIFTY: 22,
  FINNIFTY: 18,
  SENSEX: 15,
  MIDCPNIFTY: 20,
}

// ─── Futures Configuration ────────────────────────────────────────────
const FUTURES_INDEX_CONFIG: Record<string, { lotSize: number; marginPercent: number }> = {
  NIFTY: { lotSize: 50, marginPercent: 12 },
  BANKNIFTY: { lotSize: 25, marginPercent: 14 },
  FINNIFTY: { lotSize: 25, marginPercent: 13 },
  SENSEX: { lotSize: 15, marginPercent: 12 },
  MIDCPNIFTY: { lotSize: 75, marginPercent: 15 },
}

// F&O stocks eligible for futures trading
const FUTURES_STOCK_CONFIG: Record<string, { lotSize: number; marginPercent: number }> = {
  RELIANCE: { lotSize: 250, marginPercent: 16 },
  TCS: { lotSize: 150, marginPercent: 15 },
  HDFCBANK: { lotSize: 550, marginPercent: 14 },
  INFY: { lotSize: 300, marginPercent: 16 },
  ICICIBANK: { lotSize: 700, marginPercent: 15 },
  SBIN: { lotSize: 1500, marginPercent: 18 },
  BHARTIARTL: { lotSize: 600, marginPercent: 16 },
  ITC: { lotSize: 1600, marginPercent: 14 },
  KOTAKBANK: { lotSize: 400, marginPercent: 15 },
  LT: { lotSize: 150, marginPercent: 17 },
  AXISBANK: { lotSize: 900, marginPercent: 16 },
  BAJFINANCE: { lotSize: 125, marginPercent: 20 },
  TATAMOTORS: { lotSize: 2250, marginPercent: 22 },
  WIPRO: { lotSize: 1500, marginPercent: 17 },
  HCLTECH: { lotSize: 350, marginPercent: 16 },
  SUNPHARMA: { lotSize: 425, marginPercent: 17 },
  MARUTI: { lotSize: 50, marginPercent: 18 },
  ASIANPAINT: { lotSize: 200, marginPercent: 17 },
  TATASTEEL: { lotSize: 4250, marginPercent: 22 },
  ADANIENT: { lotSize: 500, marginPercent: 25 },
  ADANIPORTS: { lotSize: 1250, marginPercent: 18 },
  JSWSTEEL: { lotSize: 2000, marginPercent: 20 },
  COALINDIA: { lotSize: 3600, marginPercent: 17 },
  HINDALCO: { lotSize: 2800, marginPercent: 19 },
  GRASIM: { lotSize: 675, marginPercent: 18 },
  TECHM: { lotSize: 600, marginPercent: 17 },
  BAJAJFINSV: { lotSize: 400, marginPercent: 18 },
  DRREDDY: { lotSize: 125, marginPercent: 18 },
  CIPLA: { lotSize: 650, marginPercent: 17 },
  EICHERMOT: { lotSize: 75, marginPercent: 18 },
  M_M: { lotSize: 200, marginPercent: 18 },
  NTPC: { lotSize: 4800, marginPercent: 17 },
  POWERGRID: { lotSize: 5600, marginPercent: 16 },
  ONGC: { lotSize: 5625, marginPercent: 18 },
  ULTRACEMCO: { lotSize: 100, marginPercent: 17 },
  TITAN: { lotSize: 150, marginPercent: 19 },
}

// ─── Stock Definitions ────────────────────────────────────────────────
const STOCK_DEFINITIONS: { symbol: string; name: string; basePrice: number; sector: string; marketCap: number; vol: number }[] = [
  // Nifty 50 Major
  { symbol: 'RELIANCE', name: 'Reliance Industries', basePrice: 1432, sector: 'Oil & Gas', marketCap: 1940000, vol: 22 },
  { symbol: 'TCS', name: 'Tata Consultancy', basePrice: 3580, sector: 'IT', marketCap: 1300000, vol: 18 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', basePrice: 1745, sector: 'Banking', marketCap: 1320000, vol: 16 },
  { symbol: 'INFY', name: 'Infosys', basePrice: 1595, sector: 'IT', marketCap: 660000, vol: 20 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', basePrice: 1295, sector: 'Banking', marketCap: 910000, vol: 18 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', basePrice: 2435, sector: 'FMCG', marketCap: 572000, vol: 14 },
  { symbol: 'SBIN', name: 'State Bank of India', basePrice: 825, sector: 'Banking', marketCap: 736000, vol: 24 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', basePrice: 1650, sector: 'Telecom', marketCap: 980000, vol: 20 },
  { symbol: 'ITC', name: 'ITC Limited', basePrice: 460, sector: 'FMCG', marketCap: 575000, vol: 16 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', basePrice: 1885, sector: 'Banking', marketCap: 375000, vol: 18 },
  { symbol: 'LT', name: 'Larsen & Toubro', basePrice: 3580, sector: 'Infrastructure', marketCap: 492000, vol: 22 },
  { symbol: 'AXISBANK', name: 'Axis Bank', basePrice: 1180, sector: 'Banking', marketCap: 365000, vol: 22 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', basePrice: 7325, sector: 'Finance', marketCap: 453000, vol: 26 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', basePrice: 2420, sector: 'Paints', marketCap: 232000, vol: 20 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', basePrice: 12450, sector: 'Auto', marketCap: 388000, vol: 24 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', basePrice: 1790, sector: 'Pharma', marketCap: 430000, vol: 22 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', basePrice: 705, sector: 'Auto', marketCap: 260000, vol: 28 },
  { symbol: 'WIPRO', name: 'Wipro', basePrice: 480, sector: 'IT', marketCap: 250000, vol: 22 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', basePrice: 1745, sector: 'IT', marketCap: 475000, vol: 20 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', basePrice: 11450, sector: 'Cement', marketCap: 330000, vol: 20 },
  { symbol: 'TITAN', name: 'Titan Company', basePrice: 3520, sector: 'Consumer', marketCap: 312000, vol: 24 },
  { symbol: 'NESTLEIND', name: 'Nestle India', basePrice: 2540, sector: 'FMCG', marketCap: 245000, vol: 16 },
  { symbol: 'NTPC', name: 'NTPC Limited', basePrice: 395, sector: 'Power', marketCap: 383000, vol: 22 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', basePrice: 322, sector: 'Power', marketCap: 300000, vol: 18 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas', basePrice: 265, sector: 'Oil & Gas', marketCap: 334000, vol: 24 },
  { symbol: 'TATASTEEL', name: 'Tata Steel', basePrice: 168, sector: 'Steel', marketCap: 205000, vol: 30 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', basePrice: 2925, sector: 'Conglomerate', marketCap: 333000, vol: 36 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', basePrice: 1420, sector: 'Infrastructure', marketCap: 308000, vol: 26 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', basePrice: 950, sector: 'Steel', marketCap: 230000, vol: 28 },
  { symbol: 'COALINDIA', name: 'Coal India', basePrice: 500, sector: 'Mining', marketCap: 308000, vol: 22 },
  { symbol: 'BPCL', name: 'Bharat Petroleum', basePrice: 610, sector: 'Oil & Gas', marketCap: 133000, vol: 26 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', basePrice: 685, sector: 'Metals', marketCap: 154000, vol: 26 },
  { symbol: 'GRASIM', name: 'Grasim Industries', basePrice: 2780, sector: 'Cement', marketCap: 183000, vol: 24 },
  { symbol: 'TECHM', name: 'Tech Mahindra', basePrice: 1660, sector: 'IT', marketCap: 162000, vol: 22 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', basePrice: 1970, sector: 'Finance', marketCap: 314000, vol: 24 },
  { symbol: 'DRREDDY', name: "Dr Reddy's Labs", basePrice: 6750, sector: 'Pharma', marketCap: 112000, vol: 22 },
  { symbol: 'CIPLA', name: 'Cipla', basePrice: 1580, sector: 'Pharma', marketCap: 128000, vol: 20 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', basePrice: 4920, sector: 'Auto', marketCap: 135000, vol: 24 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer', basePrice: 1130, sector: 'FMCG', marketCap: 106000, vol: 22 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', basePrice: 3950, sector: 'Auto', marketCap: 79000, vol: 22 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', basePrice: 3050, sector: 'Auto', marketCap: 378000, vol: 24 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', basePrice: 6250, sector: 'Healthcare', marketCap: 90000, vol: 24 },
  { symbol: 'DIVISLAB', name: "Divi's Lab", basePrice: 5480, sector: 'Pharma', marketCap: 145000, vol: 26 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries', basePrice: 5560, sector: 'FMCG', marketCap: 134000, vol: 18 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank', basePrice: 1450, sector: 'Banking', marketCap: 113000, vol: 28 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life', basePrice: 655, sector: 'Insurance', marketCap: 140000, vol: 22 },
  { symbol: 'SBILIFE', name: 'SBI Life', basePrice: 1560, sector: 'Insurance', marketCap: 156000, vol: 20 },
  // Mid-cap & additional F&O
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', basePrice: 275, sector: 'Banking', marketCap: 135000, vol: 28 },
  { symbol: 'PNB', name: 'Punjab National Bank', basePrice: 125, sector: 'Banking', marketCap: 114000, vol: 30 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', basePrice: 78, sector: 'Banking', marketCap: 116000, vol: 32 },
  { symbol: 'CANBK', name: 'Canara Bank', basePrice: 115, sector: 'Banking', marketCap: 104000, vol: 28 },
  { symbol: 'UNIONBANK', name: 'Union Bank', basePrice: 128, sector: 'Banking', marketCap: 98000, vol: 28 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank', basePrice: 175, sector: 'Banking', marketCap: 41000, vol: 26 },
  { symbol: 'BANDHANBNK', name: 'Bandhan Bank', basePrice: 195, sector: 'Banking', marketCap: 32000, vol: 30 },
  { symbol: 'AUBANK', name: 'AU Small Finance', basePrice: 660, sector: 'Banking', marketCap: 49000, vol: 28 },
  { symbol: 'DELHIVERY', name: 'Delhivery', basePrice: 385, sector: 'Logistics', marketCap: 29000, vol: 30 },
  { symbol: 'ZYDUSLIFE', name: 'Zydus Lifesciences', basePrice: 1020, sector: 'Pharma', marketCap: 98000, vol: 24 },
  { symbol: 'TRENT', name: 'Trent Limited', basePrice: 5800, sector: 'Retail', marketCap: 205000, vol: 32 },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', basePrice: 3280, sector: 'Chemicals', marketCap: 167000, vol: 20 },
  { symbol: 'DABUR', name: 'Dabur India', basePrice: 540, sector: 'FMCG', marketCap: 96000, vol: 18 },
  { symbol: 'MARICO', name: 'Marico', basePrice: 680, sector: 'FMCG', marketCap: 88000, vol: 20 },
  { symbol: 'GODREJCP', name: 'Godrej Consumer', basePrice: 1480, sector: 'FMCG', marketCap: 47000, vol: 20 },
  { symbol: 'COLPAL', name: 'Colgate Palmolive', basePrice: 2950, sector: 'FMCG', marketCap: 80000, vol: 18 },
  { symbol: 'HAVELLS', name: 'Havells India', basePrice: 1680, sector: 'Consumer Electronics', marketCap: 105000, vol: 22 },
  { symbol: 'VOLTAS', name: 'Voltas Limited', basePrice: 1680, sector: 'Consumer Electronics', marketCap: 56000, vol: 26 },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements', basePrice: 625, sector: 'Cement', marketCap: 122000, vol: 24 },
  { symbol: 'ACC', name: 'ACC Limited', basePrice: 2480, sector: 'Cement', marketCap: 47000, vol: 24 },
  { symbol: 'RAMCOCEM', name: 'Ramco Cements', basePrice: 900, sector: 'Cement', marketCap: 21000, vol: 26 },
  { symbol: 'DALBHARAT', name: 'Dalmia Bharat', basePrice: 2050, sector: 'Cement', marketCap: 38000, vol: 28 },
  { symbol: 'SHREECEM', name: 'Shree Cement', basePrice: 26800, sector: 'Cement', marketCap: 97000, vol: 22 },
  { symbol: 'SIEMENS', name: 'Siemens India', basePrice: 8200, sector: 'Industrial', marketCap: 232000, vol: 24 },
  { symbol: 'ABB', name: 'ABB India', basePrice: 32000, sector: 'Industrial', marketCap: 68000, vol: 22 },
  { symbol: 'CGPOWER', name: 'CG Power', basePrice: 710, sector: 'Industrial', marketCap: 109000, vol: 28 },
  { symbol: 'LICI', name: 'LIC India', basePrice: 920, sector: 'Insurance', marketCap: 580000, vol: 22 },
  { symbol: 'ICICIPRULI', name: 'ICICI Prudential', basePrice: 680, sector: 'Insurance', marketCap: 96000, vol: 22 },
  { symbol: 'ICICIGI', name: 'ICICI Lombard', basePrice: 1900, sector: 'Insurance', marketCap: 88000, vol: 20 },
  { symbol: 'NAUKRI', name: 'Info Edge', basePrice: 7800, sector: 'Internet', marketCap: 100000, vol: 28 },
  { symbol: 'ZOMATO', name: 'Zomato', basePrice: 250, sector: 'Internet', marketCap: 230000, vol: 34 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce', basePrice: 195, sector: 'Internet', marketCap: 58000, vol: 34 },
  { symbol: 'PAYTM', name: 'One 97 Communications', basePrice: 870, sector: 'Fintech', marketCap: 55000, vol: 36 },
  { symbol: 'POLYCAB', name: 'Polycab India', basePrice: 6800, sector: 'Cables', marketCap: 102000, vol: 26 },
  { symbol: 'KEIIND', name: 'KEI Industries', basePrice: 3900, sector: 'Cables', marketCap: 35000, vol: 26 },
  { symbol: 'JUBLFOOD', name: 'Jubilant Foodworks', basePrice: 720, sector: 'Food', marketCap: 47000, vol: 26 },
  { symbol: 'DEVYANI', name: 'Devyani International', basePrice: 195, sector: 'Food', marketCap: 23000, vol: 30 },
  { symbol: 'DMART', name: 'Avenue Supermarts', basePrice: 4200, sector: 'Retail', marketCap: 273000, vol: 22 },
  { symbol: 'TVSMOTOR', name: 'TVS Motor', basePrice: 2400, sector: 'Auto', marketCap: 114000, vol: 26 },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson', basePrice: 175, sector: 'Auto Ancillary', marketCap: 77000, vol: 28 },
  { symbol: 'BOSCHLTD', name: 'Bosch Limited', basePrice: 35000, sector: 'Auto Ancillary', marketCap: 104000, vol: 22 },
  { symbol: 'PAGEIND', name: 'Page Industries', basePrice: 42000, sector: 'Textile', marketCap: 47000, vol: 24 },
  { symbol: 'ABFRL', name: 'Aditya Birla Fashion', basePrice: 310, sector: 'Textile', marketCap: 29000, vol: 32 },
  { symbol: 'TATAPOWER', name: 'Tata Power', basePrice: 430, sector: 'Power', marketCap: 137000, vol: 26 },
  { symbol: 'NHPC', name: 'NHPC Limited', basePrice: 90, sector: 'Power', marketCap: 90000, vol: 24 },
  { symbol: 'SJVN', name: 'SJVN Limited', basePrice: 110, sector: 'Power', marketCap: 44000, vol: 28 },
  { symbol: 'RECLTD', name: 'REC Limited', basePrice: 520, sector: 'Finance', marketCap: 137000, vol: 24 },
  { symbol: 'PFC', name: 'Power Finance Corp', basePrice: 440, sector: 'Finance', marketCap: 115000, vol: 24 },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Fin', basePrice: 1680, sector: 'Finance', marketCap: 56000, vol: 24 },
  { symbol: 'MANAPPURAM', name: 'Manappuram Finance', basePrice: 230, sector: 'Finance', marketCap: 19000, vol: 28 },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance', basePrice: 1480, sector: 'Finance', marketCap: 59000, vol: 22 },
  { symbol: 'DRALMOND', name: 'D.R. Almond', basePrice: 720, sector: 'Consumer', marketCap: 68000, vol: 24 },
]

// ─── Price Simulator (Box-Muller) ─────────────────────────────────────
class PriceSimulator {
  /**
   * Box-Muller transform for normally distributed random numbers
   */
  private static boxMuller(): number {
    let u1 = Math.random()
    let u2 = Math.random()
    // Avoid log(0)
    while (u1 === 0) u1 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  /**
   * Calculate price movement for a single tick
   * @param volatility Annualized volatility (e.g., 14 for NIFTY means 14%)
   * @param trendStrength -1 to 1 (negative = bearish, positive = bullish)
   * @param maxChangePercent Max % change per tick (default 0.3%)
   */
  static calculateMovement(
    volatility: number,
    trendStrength: number = 0,
    maxChangePercent: number = 0.3
  ): number {
    // Convert annual vol to per-tick vol (assuming ~250 trading days, ~37500 ticks per day at 1s)
    // But for demo, we use a simplified approach
    const perTickVol = volatility / 100 / 60 // Roughly 60 ticks per meaningful move
    const normalRandom = this.boxMuller()
    const drift = trendStrength * 0.0005 // Small drift based on trend

    let change = drift + normalRandom * perTickVol

    // 60% chance of trend continuation, 40% reversal
    if (Math.random() < 0.6) {
      change += trendStrength * perTickVol * 0.3
    }

    // Clamp to max change per tick
    const maxChange = maxChangePercent / 100
    change = Math.max(-maxChange, Math.min(maxChange, change))

    return change
  }

  /**
   * Update a price item with new movement
   */
  static updatePrice<T extends { currentPrice: number; open: number; high: number; low: number; previousClose: number; change: number; changePercent: number; trend: string; trendStrength: number; volatility: number }>(
    item: T,
    marketBias: number = 0 // Overall market direction -1 to 1
  ): T {
    const trendDir = item.trend === 'up' ? 1 : item.trend === 'down' ? -1 : 0
    const effectiveTrend = trendDir * item.trendStrength * 0.7 + marketBias * 0.3
    const movement = this.calculateMovement(item.volatility, effectiveTrend)

    const newPrice = Math.max(0.01, item.currentPrice * (1 + movement))
    const newChange = newPrice - item.previousClose
    const newChangePercent = item.previousClose > 0 ? (newChange / item.previousClose) * 100 : 0

    // Update trend based on recent movement
    let newTrend: 'up' | 'down' | 'neutral' = item.trend as 'up' | 'down' | 'neutral'
    let newTrendStrength = item.trendStrength

    // 10% chance of trend change each tick
    if (Math.random() < 0.1) {
      if (newChangePercent > 0.5) {
        newTrend = 'up'
        newTrendStrength = Math.min(1, item.trendStrength + 0.1)
      } else if (newChangePercent < -0.5) {
        newTrend = 'down'
        newTrendStrength = Math.min(1, item.trendStrength + 0.1)
      } else {
        newTrend = Math.random() > 0.5 ? 'up' : 'down'
        newTrendStrength = Math.random() * 0.3
      }
    }
    // Trend decay
    newTrendStrength = Math.max(0.1, newTrendStrength * 0.998)

    return {
      ...item,
      currentPrice: Number(newPrice.toFixed(2)),
      high: Math.max(item.high, newPrice),
      low: Math.min(item.low, newPrice),
      change: Number(newChange.toFixed(2)),
      changePercent: Number(newChangePercent.toFixed(2)),
      trend: newTrend,
      trendStrength: newTrendStrength,
    }
  }
}

// ─── Option Chain Engine ──────────────────────────────────────────────
class OptionChainEngine {
  private static INSTRUMENT_STEP: Record<string, number> = {
    NIFTY: 50,
    BANKNIFTY: 100,
    FINNIFTY: 50,
    SENSEX: 100,
    MIDCPNIFTY: 50,
  }

  static generateOptionChain(
    underlying: string,
    spotPrice: number,
    previousOptionTicks?: OptionTick[]
  ): OptionTick[] {
    const step = this.INSTRUMENT_STEP[underlying] || 50
    const range = spotPrice > 50000 ? 2000 : spotPrice > 30000 ? 1500 : 1000
    const startStrike = Math.floor((spotPrice - range) / step) * step
    const endStrike = Math.ceil((spotPrice + range) / step) * step

    const prevMap = new Map<number, OptionTick>()
    if (previousOptionTicks) {
      for (const t of previousOptionTicks) {
        prevMap.set(t.strike, t)
      }
    }

    const ticks: OptionTick[] = []
    for (let strike = startStrike; strike <= endStrike; strike += step) {
      const prev = prevMap.get(strike)
      const diffFromSpot = strike - spotPrice
      const isATM = Math.abs(diffFromSpot) < step / 2

      // CE pricing
      const ceITM = strike < spotPrice
      const ceIntrinsic = ceITM ? spotPrice - strike : 0
      const ceTimeValue = Math.max(20, (200 - Math.abs(diffFromSpot) * 0.25) * (isATM ? 1.15 : 1))
      const ceBaseLTP = ceIntrinsic + ceTimeValue * (0.5 + Math.random() * 0.5)
      const ceLTP = prev
        ? Math.max(0.05, prev.ceLTP * (1 + (Math.random() - 0.5) * 0.04))
        : Math.max(0.05, ceBaseLTP)
      const ceChngPct = prev
        ? Number((((ceLTP - prev.ceLTP) / Math.max(0.01, prev.ceLTP)) * 100).toFixed(1))
        : Number(((Math.random() - 0.5) * 10).toFixed(1))

      // PE pricing
      const peITM = strike > spotPrice
      const peIntrinsic = peITM ? strike - spotPrice : 0
      const peTimeValue = Math.max(20, (200 - Math.abs(diffFromSpot) * 0.25) * (isATM ? 1.15 : 1))
      const peBaseLTP = peIntrinsic + peTimeValue * (0.5 + Math.random() * 0.5)
      const peLTP = prev
        ? Math.max(0.05, prev.peLTP * (1 + (Math.random() - 0.5) * 0.04))
        : Math.max(0.05, peBaseLTP)
      const peChngPct = prev
        ? Number((((peLTP - prev.peLTP) / Math.max(0.01, prev.peLTP)) * 100).toFixed(1))
        : Number(((Math.random() - 0.5) * 10).toFixed(1))

      // IV with smile shape
      const ceIV = Number(Math.max(5, 16 - diffFromSpot * 0.008 + Math.random() * 6).toFixed(1))
      const peIV = Number(Math.max(5, 16 + diffFromSpot * 0.008 + Math.random() * 6).toFixed(1))

      // OI with slow drift
      const ceOI = prev
        ? Number(Math.max(0.5, prev.ceOI * (1 + (Math.random() - 0.5) * 0.02)).toFixed(1))
        : Number((isATM ? 75 : 35 - Math.abs(diffFromSpot) * 0.03) * (0.5 + Math.random() * 0.5)).toFixed(1)
      const peOI = prev
        ? Number(Math.max(0.5, prev.peOI * (1 + (Math.random() - 0.5) * 0.02)).toFixed(1))
        : Number((isATM ? 80 : 40 - Math.abs(diffFromSpot) * 0.03) * (0.5 + Math.random() * 0.5)).toFixed(1)

      // Volume with slow drift
      const ceVolume = prev
        ? Math.max(100, Math.round(prev.ceVolume * (1 + (Math.random() - 0.5) * 0.05)))
        : Math.max(100, Math.round(Number(ceOI) * 800 * (0.3 + Math.random() * 0.7)))
      const peVolume = prev
        ? Math.max(100, Math.round(prev.peVolume * (1 + (Math.random() - 0.5) * 0.05)))
        : Math.max(100, Math.round(Number(peOI) * 800 * (0.3 + Math.random() * 0.7)))

      ticks.push({
        strike,
        ceLTP: Number(ceLTP.toFixed(2)),
        ceChngPct,
        ceIV,
        ceOI: Number(ceOI),
        ceVolume,
        peLTP: Number(peLTP.toFixed(2)),
        peChngPct,
        peIV,
        peOI: Number(peOI),
        peVolume,
      })
    }
    return ticks
  }
}

// ─── Futures Engine ────────────────────────────────────────────────────
class FuturesEngine {
  /**
   * Generate next 3 monthly expiry dates (last Thursday of each month)
   */
  private static getNextExpiries(count: number = 3): Date[] {
    const expiries: Date[] = []
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()

    for (let i = 0; i < count + 2; i++) {
      // Find last Thursday of the month
      const lastDay = new Date(year, month + 1, 0).getDate()
      let lastThursday = lastDay
      while (lastThursday > 0) {
        const d = new Date(year, month, lastThursday)
        if (d.getDay() === 4) break // Thursday = 4
        lastThursday--
      }

      const expiry = new Date(year, month, lastThursday, 15, 30, 0)
      // Only add future expiries
      if (expiry > now) {
        expiries.push(expiry)
      }

      month++
      if (month > 11) { month = 0; year++ }
    }

    return expiries.slice(0, count)
  }

  /**
   * Initialize futures contracts for an underlying (INDEX or STOCK)
   */
  static initializeFutures(
    symbol: string,
    spotPrice: number,
    underlyingType: 'INDEX' | 'STOCK',
    lotSize: number,
    marginPercent: number,
    volatility: number
  ): FutureTick[] {
    const expiries = FuturesEngine.getNextExpiries(3)
    const contracts: FutureTick[] = []

    expiries.forEach((expiry, idx) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const name = `${symbol} ${monthNames[expiry.getMonth()]} ${expiry.getFullYear()} Fut`

      // Futures premium increases with time to expiry
      const basisPoints = [0.05, 0.15, 0.30] // % premium over spot
      const premium = spotPrice * basisPoints[idx] / 100
      const futurePrice = spotPrice + premium

      const previousClose = futurePrice * (1 + (Math.random() - 0.5) * 0.015)
      const open = previousClose * (1 + (Math.random() - 0.5) * 0.008)
      const trend = Math.random() > 0.5 ? 'up' : 'down'
      const trendStrength = Math.random() * 0.3 + 0.1

      contracts.push({
        symbol,
        name,
        underlyingType,
        expiryDate: expiry.toISOString(),
        expiryType: 'MONTHLY',
        lotSize,
        ltp: Number(open.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(Math.max(open, futurePrice).toFixed(2)),
        low: Number(Math.min(open, futurePrice).toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        change: Number((open - previousClose).toFixed(2)),
        changePercent: Number(((open - previousClose) / previousClose * 100).toFixed(2)),
        openInterest: Number((Math.random() * 80 + 20).toFixed(1)), // Lakhs
        oiChange: Number(((Math.random() - 0.3) * 5).toFixed(1)),
        volume: Math.round(Math.random() * 5000000 + 500000),
        basis: Number(premium.toFixed(2)),
        marginPercent,
        trend: trend as 'up' | 'down',
        trendStrength,
        volatility: volatility + 2, // Futures slightly more volatile than spot
      })
    })

    return contracts
  }

  /**
   * Update futures tick prices based on underlying spot movement
   * NON-DESTRUCTIVE: Merges new ticks into existing list, preserving
   * any externally-added contracts with matching symbol+expiry key
   */
  static updateFutures(
    prevTicks: FutureTick[],
    spotPrice: number,
    marketBias: number
  ): FutureTick[] {
    return prevTicks.map(tick => {
      // Futures price follows spot with basis adjustment
      const trendDir = tick.trend === 'up' ? 1 : tick.trend === 'down' ? -1 : 0
      const effectiveTrend = trendDir * tick.trendStrength * 0.6 + marketBias * 0.4
      const movement = PriceSimulator.calculateMovement(tick.volatility, effectiveTrend, 0.25)

      const newPrice = Math.max(0.01, tick.ltp * (1 + movement))
      const newChange = newPrice - tick.previousClose
      const newChangePct = tick.previousClose > 0 ? (newChange / tick.previousClose) * 100 : 0

      // Basis decays towards expiry (simplified)
      const daysToExpiry = Math.max(0, (new Date(tick.expiryDate).getTime() - Date.now()) / 86400000)
      const newBasis = daysToExpiry > 0 ? (newPrice - spotPrice) : 0

      // OI slow drift
      const newOI = Number(Math.max(0.5, tick.openInterest * (1 + (Math.random() - 0.5) * 0.015)).toFixed(1))
      const newOiChange = Number(((newOI - tick.openInterest) / Math.max(0.1, tick.openInterest) * 100).toFixed(1))

      // Trend update (10% chance)
      let newTrend = tick.trend
      let newTrendStrength = tick.trendStrength
      if (Math.random() < 0.1) {
        if (newChangePct > 0.3) { newTrend = 'up'; newTrendStrength = Math.min(1, tick.trendStrength + 0.1) }
        else if (newChangePct < -0.3) { newTrend = 'down'; newTrendStrength = Math.min(1, tick.trendStrength + 0.1) }
        else { newTrend = Math.random() > 0.5 ? 'up' : 'down'; newTrendStrength = Math.random() * 0.3 }
      }
      newTrendStrength = Math.max(0.1, newTrendStrength * 0.998)

      return {
        ...tick,
        ltp: Number(newPrice.toFixed(2)),
        high: Math.max(tick.high, newPrice),
        low: Math.min(tick.low, newPrice),
        change: Number(newChange.toFixed(2)),
        changePercent: Number(newChangePct.toFixed(2)),
        basis: Number(newBasis.toFixed(2)),
        openInterest: newOI,
        oiChange: newOiChange,
        volume: tick.volume + Math.round(Math.random() * 300),
        trend: newTrend,
        trendStrength: newTrendStrength,
      }
    })
  }

  /**
   * NON-DESTRUCTIVE ADD: Merge a new future into existing list.
   * If symbol+expiry already exists, skip (idempotent).
   * If not, append. NEVER overwrites the full list.
   */
  static addFuture(
    prev: FutureTick[] | undefined,
    newFuture: FutureTick
  ): FutureTick[] {
    if (!prev) return [newFuture]

    const exists = prev.some(
      f => f.symbol === newFuture.symbol && f.expiryDate === newFuture.expiryDate
    )

    if (exists) return prev // Duplicate — skip

    return [...prev, newFuture] // Append — no overwrite
  }
}

// ─── MarketEngine ─────────────────────────────────────────────────────
export class MarketEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private listeners: Set<MarketListener> = new Set()
  private state: MarketState
  private tickInterval: number = 1000 // 1 second

  constructor() {
    this.state = this.initializeState()
  }

  private initializeState(): MarketState {
    const indices: Record<string, MarketIndex> = {}
    const stocks: Record<string, MarketStock> = {}
    const optionChains: Record<string, OptionTick[]> = {}
    const futures: Record<string, FutureTick[]> = {}

    // Initialize indices with random open/preClose variations
    for (const def of INDEX_DEFINITIONS) {
      const basePrice = INDEX_BASE_PRICES[def.symbol] || 10000
      const vol = INDEX_VOLATILITY[def.symbol] || 15
      // Random previous close (±1% from base)
      const previousClose = basePrice * (1 + (Math.random() - 0.5) * 0.02)
      // Random open (±0.5% from previous close)
      const open = previousClose * (1 + (Math.random() - 0.5) * 0.01)
      const currentPrice = open
      const change = currentPrice - previousClose
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0
      const trend = Math.random() > 0.5 ? 'up' : 'down'
      const trendStrength = Math.random() * 0.4 + 0.1

      indices[def.symbol] = {
        symbol: def.symbol,
        name: def.name,
        currentPrice: Number(currentPrice.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(Math.max(open, currentPrice).toFixed(2)),
        low: Number(Math.min(open, currentPrice).toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: Math.round(Math.random() * 5000000 + 1000000),
        trend: trend as 'up' | 'down',
        trendStrength,
        volatility: vol,
      }
    }

    // Initialize stocks
    for (const def of STOCK_DEFINITIONS) {
      const previousClose = def.basePrice * (1 + (Math.random() - 0.5) * 0.02)
      const open = previousClose * (1 + (Math.random() - 0.5) * 0.01)
      const currentPrice = open
      const change = currentPrice - previousClose
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0
      const trend = Math.random() > 0.5 ? 'up' : 'down'
      const trendStrength = Math.random() * 0.4 + 0.1

      stocks[def.symbol] = {
        symbol: def.symbol,
        name: def.name,
        currentPrice: Number(currentPrice.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(Math.max(open, currentPrice).toFixed(2)),
        low: Number(Math.min(open, currentPrice).toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: Math.round(Math.random() * 10000000 + 500000),
        sector: def.sector,
        marketCap: def.marketCap,
        trend: trend as 'up' | 'down',
        trendStrength,
        volatility: def.vol,
      }
    }

    // Initialize option chains for main indices
    for (const idxSymbol of ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY']) {
      const spotPrice = indices[idxSymbol]?.currentPrice || INDEX_BASE_PRICES[idxSymbol] || 10000
      optionChains[idxSymbol] = OptionChainEngine.generateOptionChain(idxSymbol, spotPrice)
    }

    // Initialize futures for indices
    for (const [symbol, config] of Object.entries(FUTURES_INDEX_CONFIG)) {
      const spotPrice = indices[symbol]?.currentPrice || INDEX_BASE_PRICES[symbol] || 10000
      const vol = INDEX_VOLATILITY[symbol] || 15
      futures[symbol] = FuturesEngine.initializeFutures(
        symbol, spotPrice, 'INDEX', config.lotSize, config.marginPercent, vol
      )
    }

    // Initialize futures for F&O stocks
    for (const [symbol, config] of Object.entries(FUTURES_STOCK_CONFIG)) {
      const stock = stocks[symbol]
      if (stock) {
        futures[symbol] = FuturesEngine.initializeFutures(
          symbol, stock.currentPrice, 'STOCK', config.lotSize, config.marginPercent, stock.volatility
        )
      }
    }

    return {
      indices,
      stocks,
      optionChains,
      futures,
      engineRunning: false,
      tickCount: 0,
      lastTickTime: Date.now(),
    }
  }

  /**
   * Generate a single tick - update all prices
   */
  private generateTick(): void {
    this.state.tickCount++
    this.state.lastTickTime = Date.now()

    // Calculate overall market bias from major index trends
    const niftyTrend = this.state.indices['NIFTY']
    const marketBias = niftyTrend
      ? (niftyTrend.trend === 'up' ? 1 : niftyTrend.trend === 'down' ? -1 : 0) * niftyTrend.trendStrength * 0.3
      : 0

    // Update indices
    for (const symbol of Object.keys(this.state.indices)) {
      this.state.indices[symbol] = PriceSimulator.updatePrice(
        this.state.indices[symbol],
        marketBias * 0.5
      )
      // Slowly increment volume
      this.state.indices[symbol].volume += Math.round(Math.random() * 1000)
    }

    // Update stocks (with 30% index correlation)
    for (const symbol of Object.keys(this.state.stocks)) {
      const stock = this.state.stocks[symbol]
      // 30% correlation to market, 70% idiosyncratic
      const stockBias = marketBias * 0.3 + (stock.trend === 'up' ? 1 : stock.trend === 'down' ? -1 : 0) * stock.trendStrength * 0.7
      this.state.stocks[symbol] = PriceSimulator.updatePrice(stock, stockBias)
      this.state.stocks[symbol].volume += Math.round(Math.random() * 500)
    }

    // Update option chains for active indices (every 2nd tick to save CPU)
    if (this.state.tickCount % 2 === 0) {
      for (const idxSymbol of Object.keys(this.state.optionChains)) {
        const spotPrice = this.state.indices[idxSymbol]?.currentPrice || 10000
        this.state.optionChains[idxSymbol] = OptionChainEngine.generateOptionChain(
          idxSymbol,
          spotPrice,
          this.state.optionChains[idxSymbol]
        )
      }
    }

    // Update futures contracts (every tick for smooth price updates)
    for (const underlying of Object.keys(this.state.futures)) {
      const spotPrice = this.state.indices[underlying]?.currentPrice
        || this.state.stocks[underlying]?.currentPrice
        || 0
      if (spotPrice > 0) {
        this.state.futures[underlying] = FuturesEngine.updateFutures(
          this.state.futures[underlying],
          spotPrice,
          marketBias
        )
      }
    }

    // Notify all listeners
    this.notifyListeners()
  }

  private notifyListeners(): void {
    const snapshot: MarketState = {
      indices: { ...this.state.indices },
      stocks: { ...this.state.stocks },
      optionChains: { ...this.state.optionChains },
      futures: { ...this.state.futures },
      engineRunning: this.state.engineRunning,
      tickCount: this.state.tickCount,
      lastTickTime: this.state.lastTickTime,
    }
    for (const listener of this.listeners) {
      try {
        listener(snapshot)
      } catch (err) {
        console.error('[MarketEngine] Listener error:', err)
      }
    }
  }

  /**
   * Start the engine
   */
  start(): void {
    if (this.intervalId) return // Already running
    this.state.engineRunning = true
    this.intervalId = setInterval(() => this.generateTick(), this.tickInterval)
    // Do first tick immediately
    this.generateTick()
    console.log('[MarketEngine] Started — 1-second tick interval')
  }

  /**
   * Stop the engine
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.state.engineRunning = false
    console.log('[MarketEngine] Stopped')
  }

  /**
   * Subscribe to market state updates
   */
  subscribe(listener: MarketListener): () => void {
    this.listeners.add(listener)
    // Send current state immediately
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get current market state (snapshot)
   */
  getState(): MarketState {
    return {
      indices: { ...this.state.indices },
      stocks: { ...this.state.stocks },
      optionChains: { ...this.state.optionChains },
      futures: { ...this.state.futures },
      engineRunning: this.state.engineRunning,
      tickCount: this.state.tickCount,
      lastTickTime: this.state.lastTickTime,
    }
  }

  /**
   * Get a specific index
   */
  getIndex(symbol: string): MarketIndex | undefined {
    return this.state.indices[symbol]
  }

  /**
   * Get a specific stock
   */
  getStock(symbol: string): MarketStock | undefined {
    return this.state.stocks[symbol]
  }

  /**
   * Get option chain for an underlying
   */
  getOptionChain(underlying: string): OptionTick[] {
    return this.state.optionChains[underlying] || []
  }

  /**
   * Get futures contracts for an underlying
   */
  getFutures(underlying: string): FutureTick[] {
    return this.state.futures[underlying] || []
  }

  /**
   * NON-DESTRUCTIVE ADD: Add a new futures contract to the engine.
   * Uses symbol+expiry as unique key — duplicates are silently skipped.
   * Never overwrites existing data.
   */
  addFutureContract(newFuture: FutureTick): void {
    const prev = this.state.futures[newFuture.symbol] || []
    this.state.futures[newFuture.symbol] = FuturesEngine.addFuture(prev, newFuture)
  }

  /**
   * Get all stocks as sorted array
   */
  getStocksArray(): MarketStock[] {
    return Object.values(this.state.stocks).sort((a, b) => b.marketCap - a.marketCap)
  }

  /**
   * Get top gainers
   */
  getGainers(count: number = 5): MarketStock[] {
    return this.getStocksArray()
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, count)
  }

  /**
   * Get top losers
   */
  getLosers(count: number = 5): MarketStock[] {
    return this.getStocksArray()
      .filter(s => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, count)
  }

  /**
   * Is the engine running?
   */
  isRunning(): boolean {
    return this.state.engineRunning
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────
// Single instance shared across the app
let _instance: MarketEngine | null = null

export function getMarketEngine(): MarketEngine {
  if (!_instance) {
    _instance = new MarketEngine()
  }
  return _instance
}

export function destroyMarketEngine(): void {
  if (_instance) {
    _instance.stop()
    _instance = null
  }
}

/**
 * TradePro Market Simulator - 100+ Indian Stocks Data
 * Realistic stock prices based on actual NSE market data.
 * Each stock has sector, volatility, and F&O availability.
 */

const SECTORS = ['IT', 'Banking', 'Energy', 'Pharma', 'Auto', 'FMCG', 'Metal', 'Telecom', 'Financial Services', 'Infrastructure', 'Cement', 'Chemicals'];

// ─── NIFTY 50 Major Stocks (with real-ish prices) ─────────────
const MAJOR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2945.50, sector: 'Energy', volatility: 0.45, isFno: true, lotSize: 250, strikeInterval: 20 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', price: 3925.00, sector: 'IT', volatility: 0.30, isFno: true, lotSize: 150, strikeInterval: 20 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1675.25, sector: 'Banking', volatility: 0.35, isFno: true, lotSize: 550, strikeInterval: 10 },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1582.75, sector: 'IT', volatility: 0.35, isFno: true, lotSize: 300, strikeInterval: 10 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1285.40, sector: 'Banking', volatility: 0.40, isFno: true, lotSize: 700, strikeInterval: 10 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2418.60, sector: 'FMCG', volatility: 0.25, isFno: true, lotSize: 300, strikeInterval: 20 },
  { symbol: 'ITC', name: 'ITC Ltd', price: 468.35, sector: 'FMCG', volatility: 0.30, isFno: true, lotSize: 1600, strikeInterval: 5 },
  { symbol: 'SBIN', name: 'State Bank of India', price: 825.70, sector: 'Banking', volatility: 0.50, isFno: true, lotSize: 750, strikeInterval: 5 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1598.45, sector: 'Telecom', volatility: 0.35, isFno: true, lotSize: 475, strikeInterval: 10 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', price: 1782.30, sector: 'Banking', volatility: 0.35, isFno: true, lotSize: 400, strikeInterval: 10 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3542.80, sector: 'Infrastructure', volatility: 0.40, isFno: true, lotSize: 150, strikeInterval: 20 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1172.55, sector: 'Banking', volatility: 0.45, isFno: true, lotSize: 900, strikeInterval: 10 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 7285.60, sector: 'Financial Services', volatility: 0.55, isFno: true, lotSize: 125, strikeInterval: 50 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', price: 2918.25, sector: 'Chemicals', volatility: 0.30, isFno: true, lotSize: 200, strikeInterval: 20 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', price: 12450.75, sector: 'Auto', volatility: 0.40, isFno: true, lotSize: 50, strikeInterval: 100 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', price: 1782.90, sector: 'Pharma', volatility: 0.35, isFno: true, lotSize: 525, strikeInterval: 10 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 978.45, sector: 'Auto', volatility: 0.60, isFno: true, lotSize: 550, strikeInterval: 5 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: 468.80, sector: 'IT', volatility: 0.35, isFno: true, lotSize: 1500, strikeInterval: 5 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', price: 1645.30, sector: 'IT', volatility: 0.30, isFno: true, lotSize: 350, strikeInterval: 10 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', price: 11250.40, sector: 'Cement', volatility: 0.35, isFno: true, lotSize: 50, strikeInterval: 100 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', price: 3582.15, sector: 'FMCG', volatility: 0.40, isFno: true, lotSize: 175, strikeInterval: 20 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', price: 2542.70, sector: 'FMCG', volatility: 0.25, isFno: true, lotSize: 200, strikeInterval: 20 },
  { symbol: 'NTPC', name: 'NTPC Ltd', price: 382.55, sector: 'Energy', volatility: 0.40, isFno: true, lotSize: 2400, strikeInterval: 5 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd', price: 318.40, sector: 'Energy', volatility: 0.30, isFno: true, lotSize: 2400, strikeInterval: 5 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd', price: 268.75, sector: 'Energy', volatility: 0.45, isFno: true, lotSize: 3000, strikeInterval: 5 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 162.30, sector: 'Metal', volatility: 0.55, isFno: true, lotSize: 6000, strikeInterval: 2 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', price: 2985.60, sector: 'Infrastructure', volatility: 0.70, isFno: true, lotSize: 250, strikeInterval: 20 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', price: 1342.85, sector: 'Infrastructure', volatility: 0.50, isFno: true, lotSize: 500, strikeInterval: 10 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', price: 928.50, sector: 'Metal', volatility: 0.50, isFno: true, lotSize: 800, strikeInterval: 5 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', price: 498.25, sector: 'Energy', volatility: 0.40, isFno: true, lotSize: 1800, strikeInterval: 5 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd', price: 612.80, sector: 'Energy', volatility: 0.50, isFno: true, lotSize: 900, strikeInterval: 5 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', price: 638.45, sector: 'Metal', volatility: 0.45, isFno: true, lotSize: 1000, strikeInterval: 5 },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd', price: 2682.90, sector: 'Cement', volatility: 0.40, isFno: true, lotSize: 225, strikeInterval: 20 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', price: 1582.35, sector: 'IT', volatility: 0.35, isFno: true, lotSize: 300, strikeInterval: 10 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', price: 1698.75, sector: 'Financial Services', volatility: 0.45, isFno: true, lotSize: 250, strikeInterval: 10 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd", price: 6482.30, sector: 'Pharma', volatility: 0.30, isFno: true, lotSize: 125, strikeInterval: 40 },
  { symbol: 'CIPLA', name: 'Cipla Ltd', price: 1482.60, sector: 'Pharma', volatility: 0.30, isFno: true, lotSize: 525, strikeInterval: 10 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', price: 4825.45, sector: 'Auto', volatility: 0.35, isFno: true, lotSize: 100, strikeInterval: 40 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', price: 5182.70, sector: 'Auto', volatility: 0.30, isFno: true, lotSize: 100, strikeInterval: 40 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', price: 2845.35, sector: 'Auto', volatility: 0.40, isFno: true, lotSize: 200, strikeInterval: 20 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd", price: 5582.20, sector: 'Pharma', volatility: 0.35, isFno: true, lotSize: 100, strikeInterval: 40 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', price: 5382.85, sector: 'FMCG', volatility: 0.25, isFno: true, lotSize: 100, strikeInterval: 40 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', price: 1482.90, sector: 'Banking', volatility: 0.50, isFno: true, lotSize: 500, strikeInterval: 10 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd', price: 658.40, sector: 'Financial Services', volatility: 0.30, isFno: true, lotSize: 1100, strikeInterval: 5 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd', price: 1582.55, sector: 'Financial Services', volatility: 0.30, isFno: true, lotSize: 350, strikeInterval: 10 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd', price: 1148.35, sector: 'FMCG', volatility: 0.30, isFno: true, lotSize: 525, strikeInterval: 10 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd', price: 6382.75, sector: 'Pharma', volatility: 0.35, isFno: true, lotSize: 75, strikeInterval: 50 },
  { symbol: 'TATAMTRDVR', name: 'Tata Motors DVR Ltd', price: 482.60, sector: 'Auto', volatility: 0.55, isFno: true, lotSize: 2100, strikeInterval: 5 },
];

// ─── Additional F&O Stocks ─────────────────────────────────────
const ADDITIONAL_FNO_STOCKS = [
  { symbol: 'BANKBARODA', name: 'Bank of Baroda Ltd', price: 268.45, sector: 'Banking', volatility: 0.55, isFno: true, lotSize: 4000, strikeInterval: 2 },
  { symbol: 'PNB', name: 'Punjab National Bank', price: 128.70, sector: 'Banking', volatility: 0.60, isFno: true, lotSize: 7000, strikeInterval: 2 },
  { symbol: 'AUBANK', name: 'AU Small Finance Bank Ltd', price: 698.30, sector: 'Banking', volatility: 0.55, isFno: true, lotSize: 900, strikeInterval: 5 },
  { symbol: 'BANDHANBNK', name: 'Bandhan Bank Ltd', price: 218.55, sector: 'Banking', volatility: 0.55, isFno: true, lotSize: 3600, strikeInterval: 2 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC FIRST Bank Ltd', price: 78.90, sector: 'Banking', volatility: 0.60, isFno: true, lotSize: 10000, strikeInterval: 1 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', price: 168.35, sector: 'Banking', volatility: 0.50, isFno: true, lotSize: 5000, strikeInterval: 2 },
  { symbol: 'CANBK', name: 'Canara Bank', price: 118.25, sector: 'Banking', volatility: 0.55, isFno: true, lotSize: 6500, strikeInterval: 2 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4482.60, sector: 'Infrastructure', volatility: 0.45, isFno: true, lotSize: 125, strikeInterval: 40 },
  { symbol: 'SIEMENS', name: 'Siemens Ltd', price: 7825.40, sector: 'Infrastructure', volatility: 0.35, isFno: true, lotSize: 75, strikeInterval: 50 },
  { symbol: 'ABB', name: 'ABB India Ltd', price: 6825.85, sector: 'Infrastructure', volatility: 0.35, isFno: true, lotSize: 75, strikeInterval: 50 },
  { symbol: 'VEDL', name: 'Vedanta Ltd', price: 448.70, sector: 'Metal', volatility: 0.60, isFno: true, lotSize: 2000, strikeInterval: 5 },
  { symbol: 'SHREECEM', name: 'Shree Cement Ltd', price: 26825.35, sector: 'Cement', volatility: 0.30, isFno: true, lotSize: 25, strikeInterval: 200 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', price: 9825.60, sector: 'Auto', volatility: 0.30, isFno: true, lotSize: 50, strikeInterval: 80 },
  { symbol: 'IOC', name: 'Indian Oil Corporation Ltd', price: 162.80, sector: 'Energy', volatility: 0.45, isFno: true, lotSize: 6000, strikeInterval: 2 },
  { symbol: 'GAIL', name: 'GAIL (India) Ltd', price: 218.45, sector: 'Energy', volatility: 0.40, isFno: true, lotSize: 4000, strikeInterval: 2 },
  { symbol: 'PETRONET', name: 'Petronet LNG Ltd', price: 398.60, sector: 'Energy', volatility: 0.40, isFno: true, lotSize: 2000, strikeInterval: 5 },
  { symbol: 'MCDOWELL-N', name: 'United Spirits Ltd', price: 1582.35, sector: 'FMCG', volatility: 0.40, isFno: true, lotSize: 350, strikeInterval: 10 },
  { symbol: 'DABUR', name: 'Dabur India Ltd', price: 548.75, sector: 'FMCG', volatility: 0.25, isFno: true, lotSize: 2500, strikeInterval: 5 },
  { symbol: 'MARICO', name: 'Marico Ltd', price: 628.40, sector: 'FMCG', volatility: 0.25, isFno: true, lotSize: 1800, strikeInterval: 5 },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', price: 2982.55, sector: 'Chemicals', volatility: 0.25, isFno: true, lotSize: 200, strikeInterval: 20 },
  { symbol: 'BERGEPAINT', name: 'Berger Paints India Ltd', price: 658.30, sector: 'Chemicals', volatility: 0.30, isFno: true, lotSize: 1300, strikeInterval: 5 },
  { symbol: 'COLPAL', name: 'Colgate-Palmolive (India) Ltd', price: 3382.70, sector: 'FMCG', volatility: 0.20, isFno: false, lotSize: 1, strikeInterval: 0 },
  { symbol: 'AMBUJACEM', name: 'Ambuja Cements Ltd', price: 638.85, sector: 'Cement', volatility: 0.40, isFno: true, lotSize: 1500, strikeInterval: 5 },
  { symbol: 'ACC', name: 'ACC Ltd', price: 2482.40, sector: 'Cement', volatility: 0.35, isFno: true, lotSize: 250, strikeInterval: 20 },
  { symbol: 'RAMCOCEM', name: 'Ramco Cements Ltd', price: 982.55, sector: 'Cement', volatility: 0.35, isFno: true, lotSize: 700, strikeInterval: 5 },
  { symbol: 'NMDC', name: 'NMDC Ltd', price: 248.30, sector: 'Metal', volatility: 0.45, isFno: true, lotSize: 4500, strikeInterval: 2 },
  { symbol: 'MOIL', name: 'MOIL Ltd', price: 358.75, sector: 'Metal', volatility: 0.45, isFno: true, lotSize: 3000, strikeInterval: 5 },
  { symbol: 'HINDCOPPER', name: 'Hindustan Copper Ltd', price: 278.60, sector: 'Metal', volatility: 0.50, isFno: true, lotSize: 4000, strikeInterval: 2 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', price: 298.45, sector: 'Infrastructure', volatility: 0.45, isFno: true, lotSize: 4500, strikeInterval: 2 },
  { symbol: 'BEML', name: 'BEML Ltd', price: 4482.80, sector: 'Infrastructure', volatility: 0.50, isFno: true, lotSize: 75, strikeInterval: 40 },
  { symbol: 'CONCOR', name: 'Container Corporation of India Ltd', price: 982.35, sector: 'Infrastructure', volatility: 0.35, isFno: true, lotSize: 900, strikeInterval: 5 },
  { symbol: 'IRCTC', name: 'IRCTC Ltd', price: 882.70, sector: 'Infrastructure', volatility: 0.45, isFno: true, lotSize: 900, strikeInterval: 5 },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 238.45, sector: 'IT', volatility: 0.60, isFno: true, lotSize: 4500, strikeInterval: 2 },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures Ltd', price: 178.60, sector: 'FMCG', volatility: 0.55, isFno: true, lotSize: 5000, strikeInterval: 2 },
  { symbol: 'PAYTM', name: 'One 97 Communications Ltd', price: 698.35, sector: 'Financial Services', volatility: 0.65, isFno: true, lotSize: 1200, strikeInterval: 5 },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', price: 5825.80, sector: 'Infrastructure', volatility: 0.40, isFno: true, lotSize: 100, strikeInterval: 40 },
  { symbol: 'DELHIVERY', name: 'Delhivery Ltd', price: 448.25, sector: 'Infrastructure', volatility: 0.55, isFno: true, lotSize: 2200, strikeInterval: 5 },
];

// ─── Combine and generate 100+ stocks ──────────────────────────
function generateStocks() {
  const stocks = [];

  // Add major stocks
  for (const s of MAJOR_STOCKS) {
    stocks.push({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change: 0,
      changePercent: 0,
      trend: Math.random() > 0.5 ? 'UP' : 'DOWN',
      volatility: s.volatility,
      volume: Math.floor(500000 + Math.random() * 5000000),
      sector: s.sector,
      isFuturesAvailable: s.isFno,
      isOptionsAvailable: s.isFno,
      lotSize: s.lotSize,
      strikeInterval: s.strikeInterval,
    });
  }

  // Add additional F&O stocks
  for (const s of ADDITIONAL_FNO_STOCKS) {
    stocks.push({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      change: 0,
      changePercent: 0,
      trend: Math.random() > 0.5 ? 'UP' : 'DOWN',
      volatility: s.volatility,
      volume: Math.floor(200000 + Math.random() * 3000000),
      sector: s.sector,
      isFuturesAvailable: s.isFno,
      isOptionsAvailable: s.isFno,
      lotSize: s.lotSize,
      strikeInterval: s.strikeInterval,
    });
  }

  return stocks;
}

module.exports = generateStocks();

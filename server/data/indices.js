/**
 * TradePro Market Simulator - Initial Indices Data
 * 5 major Indian market indices with realistic base prices.
 */

module.exports = [
  {
    symbol: 'NIFTY',
    name: 'NIFTY 50',
    price: 22500.00,
    lotSize: 50,
    expiryDay: 'Thursday',
    tickSize: 0.05,
    strikeInterval: 50,
    volatility: 0.25,     // 0.25% per tick
    volume: 1000000,
  },
  {
    symbol: 'BANKNIFTY',
    name: 'BANK NIFTY',
    price: 48500.00,
    lotSize: 15,
    expiryDay: 'Wednesday',
    tickSize: 0.05,
    strikeInterval: 100,
    volatility: 0.35,     // 0.35% per tick
    volume: 800000,
  },
  {
    symbol: 'FINNIFTY',
    name: 'FIN NIFTY',
    price: 23200.00,
    lotSize: 40,
    expiryDay: 'Tuesday',
    tickSize: 0.05,
    strikeInterval: 50,
    volatility: 0.28,
    volume: 400000,
  },
  {
    symbol: 'SENSEX',
    name: 'SENSEX',
    price: 74200.00,
    lotSize: 20,
    expiryDay: 'Thursday',
    tickSize: 0.05,
    strikeInterval: 100,
    volatility: 0.22,
    volume: 300000,
  },
  {
    symbol: 'MIDCPNIFTY',
    name: 'MIDCAP NIFTY',
    price: 12500.00,
    lotSize: 75,
    expiryDay: 'Monday',
    tickSize: 0.05,
    strikeInterval: 50,
    volatility: 0.30,
    volume: 250000,
  },
];

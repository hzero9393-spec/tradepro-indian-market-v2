/**
 * TradePro Market Simulator Server
 * Express + Socket.IO server for real-time market data streaming.
 * 
 * - Generates simulated market data every 1 second
 * - Streams via Socket.IO WebSocket
 * - Updates Turso database for API route compatibility
 * - Checks SL/TP and LIMIT orders on every tick
 * 
 * Usage: node server.js
 * 
 * Environment Variables:
 * - TURSO_DATABASE_URL: Turso database URL (required for DB updates + SL/TP)
 * - TURSO_AUTH_TOKEN: Turso auth token (required for DB updates + SL/TP)
 * - PORT: Server port (default: 3001)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@libsql/client');
const MarketEngine = require('./engine/MarketEngine');
const config = require('./data/config');

// ─── Express Setup ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || config.PORT || 3001;

app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());

// ─── HTTP Server ───────────────────────────────────────────────
const server = http.createServer(app);

// ─── Socket.IO Setup ───────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// ─── Market Engine ─────────────────────────────────────────────
const marketEngine = new MarketEngine();
marketEngine.setIO(io);

// ─── Database Connection ───────────────────────────────────────
let dbConnected = false;

async function connectDatabase() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    try {
      const client = createClient({
        url: tursoUrl,
        authToken: tursoAuthToken || undefined,
      });

      // Test connection
      await client.execute('SELECT 1 as test');
      marketEngine.setDbClient(client);
      dbConnected = true;
      console.log('[Server] Turso database connected successfully');
    } catch (error) {
      console.warn('[Server] Turso database connection failed:', error.message);
      console.warn('[Server] Running in memory-only mode (no DB updates, no SL/TP)');
    }
  } else {
    console.warn('[Server] No TURSO_DATABASE_URL found. Running in memory-only mode.');
    console.warn('[Server] Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN for full functionality.');
  }
}

// ─── REST API Routes ───────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  const stats = marketEngine.getStats();
  res.json({
    status: 'ok',
    service: 'tradepro-market-simulator',
    ...stats,
    dbConnected,
    uptime: process.uptime(),
  });
});

// Get current market snapshot
app.get('/api/snapshot', (req, res) => {
  const snapshot = marketEngine.getSnapshot();
  res.json({
    success: true,
    data: snapshot,
  });
});

// Get specific stock price
app.get('/api/price/:symbol', (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const price = marketEngine.getPrice(symbol);
  if (price !== null) {
    res.json({ success: true, symbol, price });
  } else {
    res.status(404).json({ success: false, error: `Symbol not found: ${symbol}` });
  }
});

// Get option chain for underlying
app.get('/api/option-chain/:underlying', (req, res) => {
  const underlying = req.params.underlying.toUpperCase();
  const chain = marketEngine.optionChains.get(underlying);
  if (chain) {
    res.json({ success: true, data: chain });
  } else {
    res.status(404).json({ success: false, error: `Option chain not found for: ${underlying}` });
  }
});

// Get engine stats
app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: marketEngine.getStats(),
  });
});

// Control endpoints
app.post('/api/control/start', (req, res) => {
  marketEngine.start();
  res.json({ success: true, message: 'Market simulator started' });
});

app.post('/api/control/stop', (req, res) => {
  marketEngine.stop();
  res.json({ success: true, message: 'Market simulator stopped' });
});

// ─── Socket.IO Events ─────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send initial full market snapshot on connection
  const snapshot = marketEngine.getSnapshot();
  socket.emit('initMarket', snapshot);

  // Subscribe to specific stock updates
  socket.on('subscribeStocks', (symbols) => {
    if (Array.isArray(symbols)) {
      for (const sym of symbols) {
        socket.join(`stock:${sym}`);
      }
    }
  });

  // Subscribe to specific index updates
  socket.on('subscribeIndices', (symbols) => {
    if (Array.isArray(symbols)) {
      for (const sym of symbols) {
        socket.join(`index:${sym}`);
      }
    }
  });

  // Subscribe to option chain updates
  socket.on('subscribeOptions', (underlying) => {
    socket.join(`options:${underlying}`);
  });

  // Unsubscribe
  socket.on('unsubscribeStocks', (symbols) => {
    if (Array.isArray(symbols)) {
      for (const sym of symbols) {
        socket.leave(`stock:${sym}`);
      }
    }
  });

  // Get current price request
  socket.on('getPrice', (symbol, callback) => {
    const price = marketEngine.getPrice(symbol);
    if (typeof callback === 'function') {
      callback({ symbol, price });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─── Start Server ──────────────────────────────────────────────

async function startServer() {
  // Connect to database first
  await connectDatabase();

  // Start the market engine
  marketEngine.start();

  // Start HTTP server
  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     TradePro Market Simulator Engine - Running          ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Server:     http://localhost:${PORT}                     ║`);
    console.log(`║  WebSocket:  ws://localhost:${PORT}                       ║`);
    console.log(`║  Health:     http://localhost:${PORT}/api/health          ║`);
    console.log(`║  Snapshot:   http://localhost:${PORT}/api/snapshot        ║`);
    console.log(`║  DB Status:  ${dbConnected ? 'Connected ✓' : 'Not Connected (memory only)'}               ║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Frontend Connection:                                   ║');
    console.log('║  const socket = io("http://localhost:3001");             ║');
    console.log('║  socket.on("marketTick", (data) => {...});              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  marketEngine.stop();
  io.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received, shutting down...');
  marketEngine.stop();
  io.close();
  server.close();
  process.exit(0);
});

// ─── Start! ────────────────────────────────────────────────────
startServer().catch(err => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

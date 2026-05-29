/**
 * Turso Database Migration Script
 * Uses @libsql/client directly to push schema changes
 * (prisma db push doesn't work with libsql:// URLs)
 */

const { createClient } = require('@libsql/client');

async function migrate() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.log('⚠️ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set, skipping Turso migration');
    return;
  }

  console.log('🔧 Connecting to Turso database for migration...');
  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  try {
    // Get existing table info
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const existingTables = new Set(tables.rows.map(r => r.name));
    console.log('📋 Existing tables:', [...existingTables].join(', '));

    // Helper: get columns for a table
    async function getColumns(tableName) {
      if (!existingTables.has(tableName)) return new Set();
      const cols = await client.execute(`PRAGMA table_info(${tableName})`);
      return new Set(cols.rows.map(r => r.name));
    }

    // Helper: create table if not exists
    async function createTableIfNotExists(name, sql) {
      if (!existingTables.has(name)) {
        console.log(`  ➕ Creating table: ${name}`);
        try {
          await client.execute(sql);
          console.log(`  ✅ Created: ${name}`);
          existingTables.add(name);
        } catch (e) {
          console.log(`  ⚠️ Failed ${name}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already exists: ${name}`);
      }
    }

    // Helper: add column if missing
    async function addColumnIfMissing(table, col, sql) {
      const cols = await getColumns(table);
      if (!cols.has(col)) {
        console.log(`  ➕ Adding column: ${table}.${col}`);
        try {
          await client.execute(sql);
          console.log(`  ✅ Added: ${table}.${col}`);
        } catch (e) {
          console.log(`  ⚠️ Skipped ${table}.${col}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already exists: ${table}.${col}`);
      }
    }

    // ════════════════════════════════════════════════════════════════
    // CORE TRADING TABLES — These are required for orders/trades/positions to work
    // ════════════════════════════════════════════════════════════════

    // ──── INDICES ────
    await createTableIfNotExists('indices', `CREATE TABLE indices (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      lotSize INTEGER NOT NULL DEFAULT 50,
      expiryDay TEXT NOT NULL DEFAULT 'Thursday',
      tickSize REAL NOT NULL DEFAULT 0.05,
      strikeInterval INTEGER NOT NULL DEFAULT 50,
      currentPrice REAL NOT NULL DEFAULT 0,
      open REAL,
      high REAL,
      low REAL,
      previousClose REAL,
      change REAL NOT NULL DEFAULT 0,
      changePercent REAL NOT NULL DEFAULT 0,
      volume REAL,
      isEnabled BOOLEAN NOT NULL DEFAULT 1,
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ──── INDEX HISTORY ────
    await createTableIfNotExists('index_history', `CREATE TABLE index_history (
      id TEXT PRIMARY KEY,
      indexSymbol TEXT NOT NULL,
      date DATETIME NOT NULL,
      open REAL NOT NULL DEFAULT 0,
      high REAL NOT NULL DEFAULT 0,
      low REAL NOT NULL DEFAULT 0,
      close REAL NOT NULL DEFAULT 0,
      volume REAL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(indexSymbol, date)
    )`);

    // ──── STOCKS ────
    await createTableIfNotExists('stocks', `CREATE TABLE stocks (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      isin TEXT,
      sector TEXT NOT NULL DEFAULT '',
      industry TEXT,
      exchange TEXT NOT NULL DEFAULT 'NSE',
      faceValue REAL,
      marketCap REAL,
      peRatio REAL,
      dividendYield REAL,
      lotSize INTEGER NOT NULL DEFAULT 1,
      isFuturesAvailable BOOLEAN NOT NULL DEFAULT 0,
      isOptionsAvailable BOOLEAN NOT NULL DEFAULT 0,
      strikeInterval INTEGER,
      circuitLimit REAL NOT NULL DEFAULT 20,
      currentPrice REAL NOT NULL DEFAULT 0,
      open REAL,
      high REAL,
      low REAL,
      previousClose REAL,
      change REAL NOT NULL DEFAULT 0,
      changePercent REAL NOT NULL DEFAULT 0,
      volume REAL,
      week52High REAL,
      week52Low REAL,
      isFnoBan BOOLEAN NOT NULL DEFAULT 0,
      banStartDate DATETIME,
      banEndDate DATETIME,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ──── STOCK HISTORY ────
    await createTableIfNotExists('stock_history', `CREATE TABLE stock_history (
      id TEXT PRIMARY KEY,
      stockSymbol TEXT NOT NULL,
      date DATETIME NOT NULL,
      open REAL NOT NULL DEFAULT 0,
      high REAL NOT NULL DEFAULT 0,
      low REAL NOT NULL DEFAULT 0,
      close REAL NOT NULL DEFAULT 0,
      volume REAL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stockSymbol, date)
    )`);

    // ──── FUTURES ────
    await createTableIfNotExists('futures', `CREATE TABLE futures (
      id TEXT PRIMARY KEY,
      underlying TEXT NOT NULL,
      underlyingType TEXT NOT NULL DEFAULT 'INDEX',
      expiryDate DATETIME NOT NULL,
      expiryType TEXT NOT NULL DEFAULT 'MONTHLY',
      lotSize INTEGER NOT NULL DEFAULT 1,
      ltp REAL NOT NULL DEFAULT 0,
      open REAL,
      high REAL,
      low REAL,
      previousClose REAL,
      change REAL NOT NULL DEFAULT 0,
      changePercent REAL NOT NULL DEFAULT 0,
      openInterest REAL NOT NULL DEFAULT 0,
      oiChange REAL NOT NULL DEFAULT 0,
      volume REAL NOT NULL DEFAULT 0,
      basis REAL NOT NULL DEFAULT 0,
      marginPercent REAL NOT NULL DEFAULT 10,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(underlying, expiryDate)
    )`);

    // ──── OPTIONS ────
    await createTableIfNotExists('options', `CREATE TABLE options (
      id TEXT PRIMARY KEY,
      underlying TEXT NOT NULL,
      underlyingType TEXT NOT NULL DEFAULT 'INDEX',
      underlyingPrice REAL NOT NULL DEFAULT 0,
      expiryDate DATETIME NOT NULL,
      expiryType TEXT NOT NULL DEFAULT 'WEEKLY',
      strikePrice REAL NOT NULL,
      optionType TEXT NOT NULL,
      ltp REAL NOT NULL DEFAULT 0,
      previousClose REAL,
      change REAL NOT NULL DEFAULT 0,
      changePercent REAL NOT NULL DEFAULT 0,
      openInterest REAL NOT NULL DEFAULT 0,
      oiChange REAL NOT NULL DEFAULT 0,
      oiChangePercent REAL NOT NULL DEFAULT 0,
      volume REAL NOT NULL DEFAULT 0,
      impliedVolatility REAL NOT NULL DEFAULT 0,
      delta REAL,
      gamma REAL,
      theta REAL,
      vega REAL,
      inTheMoney BOOLEAN NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(underlying, expiryDate, strikePrice, optionType)
    )`);

    // ──── ORDERS ────
    await createTableIfNotExists('orders', `CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      orderType TEXT NOT NULL,
      tradeDirection TEXT NOT NULL,
      segment TEXT NOT NULL,
      productType TEXT NOT NULL,
      symbol TEXT NOT NULL,
      instrumentId TEXT,
      optionType TEXT,
      strikePrice REAL,
      expiryDate DATETIME,
      lotSize INTEGER NOT NULL DEFAULT 1,
      lots INTEGER NOT NULL DEFAULT 1,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      triggerPrice REAL,
      fillPrice REAL,
      totalValue REAL NOT NULL DEFAULT 0,
      brokerage REAL NOT NULL DEFAULT 0,
      marginRequired REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      rejectReason TEXT,
      placedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      filledAt DATETIME,
      cancelledAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ──── TRADES ────
    await createTableIfNotExists('trades', `CREATE TABLE trades (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      orderId TEXT UNIQUE,
      segment TEXT NOT NULL,
      productType TEXT NOT NULL,
      tradeDirection TEXT NOT NULL,
      symbol TEXT NOT NULL,
      instrumentId TEXT,
      optionType TEXT,
      strikePrice REAL,
      expiryDate DATETIME,
      quantity INTEGER NOT NULL,
      fillPrice REAL NOT NULL,
      totalValue REAL NOT NULL,
      brokerage REAL NOT NULL DEFAULT 0,
      pnl REAL,
      pnlPercent REAL,
      executedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      squaredOffAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ──── POSITIONS ────
    await createTableIfNotExists('positions', `CREATE TABLE positions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      segment TEXT NOT NULL,
      productType TEXT NOT NULL,
      tradeDirection TEXT NOT NULL,
      symbol TEXT NOT NULL,
      instrumentId TEXT,
      optionType TEXT,
      strikePrice REAL,
      expiryDate DATETIME,
      lotSize INTEGER NOT NULL DEFAULT 1,
      lots INTEGER NOT NULL DEFAULT 1,
      quantity INTEGER NOT NULL,
      entryPrice REAL NOT NULL,
      currentPrice REAL NOT NULL DEFAULT 0,
      totalInvested REAL NOT NULL,
      currentValue REAL NOT NULL DEFAULT 0,
      unrealizedPnl REAL NOT NULL DEFAULT 0,
      realizedPnl REAL NOT NULL DEFAULT 0,
      marginUsed REAL NOT NULL DEFAULT 0,
      isOpen BOOLEAN NOT NULL DEFAULT 1,
      squaredOffAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ──── PORTFOLIOS ────
    await createTableIfNotExists('portfolios', `CREATE TABLE portfolios (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      totalValue REAL NOT NULL DEFAULT 0,
      equityValue REAL NOT NULL DEFAULT 0,
      futuresValue REAL NOT NULL DEFAULT 0,
      optionsValue REAL NOT NULL DEFAULT 0,
      cashBalance REAL NOT NULL DEFAULT 0,
      dayPnl REAL NOT NULL DEFAULT 0,
      totalPnl REAL NOT NULL DEFAULT 0,
      dayReturn REAL NOT NULL DEFAULT 0,
      totalReturn REAL NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, date)
    )`);

    // ════════════════════════════════════════════════════════════════
    // MARKET METADATA TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('sectors', `CREATE TABLE sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      indexSymbol TEXT,
      todayChange REAL NOT NULL DEFAULT 0,
      topStockSymbol TEXT,
      topStockChange REAL,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('market_holidays', `CREATE TABLE market_holidays (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date DATETIME NOT NULL UNIQUE,
      isMuhurat BOOLEAN NOT NULL DEFAULT 0,
      muhuratStart TEXT,
      muhuratEnd TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('fno_ban_entries', `CREATE TABLE fno_ban_entries (
      id TEXT PRIMARY KEY,
      stockSymbol TEXT NOT NULL,
      stockName TEXT NOT NULL,
      banStartDate DATETIME NOT NULL,
      banEndDate DATETIME,
      reason TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('market_breadth', `CREATE TABLE market_breadth (
      id TEXT PRIMARY KEY,
      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      advances INTEGER NOT NULL DEFAULT 0,
      declines INTEGER NOT NULL DEFAULT 0,
      unchanged INTEGER NOT NULL DEFAULT 0,
      week52Highs INTEGER NOT NULL DEFAULT 0,
      week52Lows INTEGER NOT NULL DEFAULT 0,
      upperCircuit INTEGER NOT NULL DEFAULT 0,
      lowerCircuit INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ════════════════════════════════════════════════════════════════
    // LEARNING TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('learning_paths', `CREATE TABLE learning_paths (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      totalModules INTEGER NOT NULL DEFAULT 0,
      estimatedHours INTEGER NOT NULL DEFAULT 0,
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      accentColor TEXT NOT NULL DEFAULT '#0058be',
      "order" INTEGER NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('learning_modules', `CREATE TABLE learning_modules (
      id TEXT PRIMARY KEY,
      pathId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT,
      videoUrl TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('user_progress', `CREATE TABLE user_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      moduleId TEXT NOT NULL,
      isCompleted BOOLEAN NOT NULL DEFAULT 0,
      completedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, moduleId)
    )`);

    // ════════════════════════════════════════════════════════════════
    // CHALLENGES TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('challenges', `CREATE TABLE challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      challengeType TEXT NOT NULL,
      targetMetric TEXT NOT NULL,
      targetValue REAL NOT NULL,
      prize TEXT NOT NULL,
      prizeValue REAL,
      startDate DATETIME NOT NULL,
      endDate DATETIME NOT NULL,
      maxParticipants INTEGER,
      currentParticipants INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'UPCOMING',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('challenge_participations', `CREATE TABLE challenge_participations (
      id TEXT PRIMARY KEY,
      challengeId TEXT NOT NULL,
      userId TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      result TEXT,
      reward TEXT,
      joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completedAt DATETIME,
      UNIQUE(challengeId, userId)
    )`);

    // ════════════════════════════════════════════════════════════════
    // ADMIN TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('admins', `CREATE TABLE admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      isActive BOOLEAN NOT NULL DEFAULT 1,
      lastLoginAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('activity_logs', `CREATE TABLE activity_logs (
      id TEXT PRIMARY KEY,
      adminId TEXT NOT NULL,
      action TEXT NOT NULL,
      targetId TEXT,
      details TEXT,
      ipAddress TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('platform_settings', `CREATE TABLE platform_settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ════════════════════════════════════════════════════════════════
    // NOTIFICATION TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('notifications', `CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      icon TEXT,
      type TEXT NOT NULL DEFAULT 'INFO',
      category TEXT NOT NULL DEFAULT 'general',
      link TEXT,
      isRead BOOLEAN NOT NULL DEFAULT 0,
      readAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('push_subscriptions', `CREATE TABLE push_subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      userAgent TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, endpoint)
    )`);

    // ════════════════════════════════════════════════════════════════
    // SUPPORT TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('support_tickets', `CREATE TABLE support_tickets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GENERAL',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      assignedTo TEXT,
      adminResponse TEXT,
      resolvedAt DATETIME,
      closedAt DATETIME,
      userAgent TEXT,
      pageUrl TEXT,
      attachments TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('ticket_replies', `CREATE TABLE ticket_replies (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      senderType TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderName TEXT NOT NULL,
      message TEXT NOT NULL,
      isInternal BOOLEAN NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ════════════════════════════════════════════════════════════════
    // SUBSCRIPTION TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('subscription_transactions', `CREATE TABLE subscription_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      razorpayOrderId TEXT NOT NULL UNIQUE,
      razorpayPaymentId TEXT,
      razorpaySignature TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      startDate DATETIME NOT NULL,
      endDate DATETIME NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ════════════════════════════════════════════════════════════════
    // WATCHLIST TABLES
    // ════════════════════════════════════════════════════════════════

    await createTableIfNotExists('watchlists', `CREATE TABLE watchlists (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'My Watchlist',
      symbols TEXT NOT NULL DEFAULT '',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    await createTableIfNotExists('watchlist_items', `CREATE TABLE watchlist_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT,
      segment TEXT NOT NULL DEFAULT 'EQUITY',
      addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, symbol)
    )`);

    await createTableIfNotExists('price_alerts', `CREATE TABLE price_alerts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      symbol TEXT NOT NULL,
      targetPrice REAL NOT NULL,
      condition TEXT NOT NULL DEFAULT 'above',
      isTriggered BOOLEAN NOT NULL DEFAULT 0,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);

    // ════════════════════════════════════════════════════════════════
    // ALTER TABLE: Add missing columns to existing tables
    // ════════════════════════════════════════════════════════════════

    const userAlterations = [
      { col: 'subscriptionId', sql: 'ALTER TABLE users ADD COLUMN subscriptionId TEXT' },
      { col: 'subscriptionEnd', sql: 'ALTER TABLE users ADD COLUMN subscriptionEnd DATETIME' },
      { col: 'dailyTrades', sql: "ALTER TABLE users ADD COLUMN dailyTrades INTEGER NOT NULL DEFAULT 0" },
      { col: 'dailyPositions', sql: "ALTER TABLE users ADD COLUMN dailyPositions INTEGER NOT NULL DEFAULT 0" },
      { col: 'lastResetDate', sql: 'ALTER TABLE users ADD COLUMN lastResetDate DATETIME' },
      { col: 'twoFactorSecret', sql: 'ALTER TABLE users ADD COLUMN twoFactorSecret TEXT' },
      { col: 'twoFactorEnabled', sql: "ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN NOT NULL DEFAULT 0" },
      { col: 'notificationsEnabled', sql: "ALTER TABLE users ADD COLUMN notificationsEnabled BOOLEAN NOT NULL DEFAULT 0" },
      { col: 'pushSubscriptionId', sql: 'ALTER TABLE users ADD COLUMN pushSubscriptionId TEXT' },
    ];

    for (const alt of userAlterations) {
      await addColumnIfMissing('users', alt.col, alt.sql);
    }

    const sessionAlterations = [
      { col: 'browser', sql: 'ALTER TABLE sessions ADD COLUMN browser TEXT' },
      { col: 'os', sql: 'ALTER TABLE sessions ADD COLUMN os TEXT' },
      { col: 'deviceType', sql: 'ALTER TABLE sessions ADD COLUMN deviceType TEXT' },
      { col: 'location', sql: 'ALTER TABLE sessions ADD COLUMN location TEXT' },
    ];

    for (const alt of sessionAlterations) {
      await addColumnIfMissing('sessions', alt.col, alt.sql);
    }

    // ════════════════════════════════════════════════════════════════
    // CREATE INDEXES
    // ════════════════════════════════════════════════════════════════

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_orders_userId_status ON orders(userId, status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_userId_placedAt ON orders(userId, placedAt)',
      'CREATE INDEX IF NOT EXISTS idx_trades_userId_executedAt ON trades(userId, executedAt)',
      'CREATE INDEX IF NOT EXISTS idx_positions_userId_isOpen ON positions(userId, isOpen)',
      'CREATE INDEX IF NOT EXISTS idx_positions_userId_segment_isOpen ON positions(userId, segment, isOpen)',
      'CREATE INDEX IF NOT EXISTS idx_positions_userId_symbol_isOpen ON positions(userId, symbol, isOpen)',
      'CREATE INDEX IF NOT EXISTS idx_portfolios_userId_date ON portfolios(userId, date)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_userId_isRead ON notifications(userId, isRead)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_userId_createdAt ON notifications(userId, createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol)',
      'CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector)',
      'CREATE INDEX IF NOT EXISTS idx_indices_symbol ON indices(symbol)',
      'CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets(userId)',
      'CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)',
      'CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticketId ON ticket_replies(ticketId)',
      'CREATE INDEX IF NOT EXISTS idx_subscription_transactions_userId ON subscription_transactions(userId)',
      'CREATE INDEX IF NOT EXISTS idx_watchlists_userId ON watchlists(userId)',
      'CREATE INDEX IF NOT EXISTS idx_watchlist_items_userId ON watchlist_items(userId)',
      'CREATE INDEX IF NOT EXISTS idx_price_alerts_userId ON price_alerts(userId)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_adminId ON activity_logs(adminId)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_createdAt ON activity_logs(createdAt)',
    ];

    for (const idx of indexes) {
      try {
        await client.execute(idx);
      } catch (e) {
        // Silent — index may already exist
      }
    }

    console.log('✅ Turso migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.close();
  }
}

migrate().catch(e => {
  console.error('❌ Migration error:', e.message);
  process.exit(0);
});

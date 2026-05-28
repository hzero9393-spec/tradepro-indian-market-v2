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

    // Get existing columns for users table
    let userColumns = new Set();
    if (existingTables.has('users')) {
      const cols = await client.execute("PRAGMA table_info(users)");
      userColumns = new Set(cols.rows.map(r => r.name));
      console.log('📋 Existing user columns:', [...userColumns].join(', '));
    }

    // ──── ALTER TABLE: Add missing columns to existing tables ────

    const userAlterations = [
      { col: 'subscriptionId', sql: 'ALTER TABLE users ADD COLUMN subscriptionId TEXT' },
      { col: 'subscriptionEnd', sql: 'ALTER TABLE users ADD COLUMN subscriptionEnd DATETIME' },
      { col: 'dailyTrades', sql: "ALTER TABLE users ADD COLUMN dailyTrades INTEGER NOT NULL DEFAULT 0" },
      { col: 'dailyPositions', sql: "ALTER TABLE users ADD COLUMN dailyPositions INTEGER NOT NULL DEFAULT 0" },
      { col: 'lastResetDate', sql: 'ALTER TABLE users ADD COLUMN lastResetDate DATETIME' },
      { col: 'twoFactorSecret', sql: 'ALTER TABLE users ADD COLUMN twoFactorSecret TEXT' },
      { col: 'twoFactorEnabled', sql: "ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN NOT NULL DEFAULT 0" },
    ];

    for (const alt of userAlterations) {
      if (!userColumns.has(alt.col)) {
        console.log(`  ➕ Adding column: users.${alt.col}`);
        try {
          await client.execute(alt.sql);
          console.log(`  ✅ Added: users.${alt.col}`);
        } catch (e) {
          console.log(`  ⚠️ Skipped users.${alt.col}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already exists: users.${alt.col}`);
      }
    }

    // Check sessions table for missing columns
    let sessionColumns = new Set();
    if (existingTables.has('sessions')) {
      const cols = await client.execute("PRAGMA table_info(sessions)");
      sessionColumns = new Set(cols.rows.map(r => r.name));
    }

    const sessionAlterations = [
      { col: 'browser', sql: 'ALTER TABLE sessions ADD COLUMN browser TEXT' },
      { col: 'os', sql: 'ALTER TABLE sessions ADD COLUMN os TEXT' },
      { col: 'deviceType', sql: 'ALTER TABLE sessions ADD COLUMN deviceType TEXT' },
      { col: 'location', sql: 'ALTER TABLE sessions ADD COLUMN location TEXT' },
    ];

    for (const alt of sessionAlterations) {
      if (!sessionColumns.has(alt.col)) {
        console.log(`  ➕ Adding column: sessions.${alt.col}`);
        try {
          await client.execute(alt.sql);
          console.log(`  ✅ Added: sessions.${alt.col}`);
        } catch (e) {
          console.log(`  ⚠️ Skipped sessions.${alt.col}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already exists: sessions.${alt.col}`);
      }
    }

    // ──── CREATE TABLE: Add new tables if they don't exist ────

    const newTables = [
      {
        name: 'support_tickets',
        sql: `CREATE TABLE IF NOT EXISTS support_tickets (
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
        )`,
      },
      {
        name: 'ticket_replies',
        sql: `CREATE TABLE IF NOT EXISTS ticket_replies (
          id TEXT PRIMARY KEY,
          ticketId TEXT NOT NULL,
          senderType TEXT NOT NULL,
          senderId TEXT NOT NULL,
          senderName TEXT NOT NULL,
          message TEXT NOT NULL,
          isInternal BOOLEAN NOT NULL DEFAULT 0,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'subscription_transactions',
        sql: `CREATE TABLE IF NOT EXISTS subscription_transactions (
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
        )`,
      },
      {
        name: 'watchlists',
        sql: `CREATE TABLE IF NOT EXISTS watchlists (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          name TEXT NOT NULL DEFAULT 'My Watchlist',
          symbols TEXT NOT NULL DEFAULT '',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
      {
        name: 'price_alerts',
        sql: `CREATE TABLE IF NOT EXISTS price_alerts (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          symbol TEXT NOT NULL,
          targetPrice REAL NOT NULL,
          condition TEXT NOT NULL DEFAULT 'above',
          isTriggered BOOLEAN NOT NULL DEFAULT 0,
          isActive BOOLEAN NOT NULL DEFAULT 1,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      },
    ];

    for (const table of newTables) {
      if (!existingTables.has(table.name)) {
        console.log(`  ➕ Creating table: ${table.name}`);
        try {
          await client.execute(table.sql);
          console.log(`  ✅ Created: ${table.name}`);
        } catch (e) {
          console.log(`  ⚠️ Skipped ${table.name}: ${e.message}`);
        }
      } else {
        console.log(`  ✓ Already exists: ${table.name}`);
      }
    }

    // ──── CREATE INDEXES ────
    const indexes = [
      { name: 'idx_support_tickets_userId', sql: 'CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets(userId)' },
      { name: 'idx_support_tickets_status', sql: 'CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)' },
      { name: 'idx_ticket_replies_ticketId', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticketId ON ticket_replies(ticketId)' },
      { name: 'idx_subscription_transactions_userId', sql: 'CREATE INDEX IF NOT EXISTS idx_subscription_transactions_userId ON subscription_transactions(userId)' },
      { name: 'idx_watchlists_userId', sql: 'CREATE INDEX IF NOT EXISTS idx_watchlists_userId ON watchlists(userId)' },
      { name: 'idx_price_alerts_userId', sql: 'CREATE INDEX IF NOT EXISTS idx_price_alerts_userId ON price_alerts(userId)' },
    ];

    for (const idx of indexes) {
      try {
        await client.execute(idx.sql);
      } catch (e) {
        // Silent
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

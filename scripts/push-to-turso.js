const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function pushSchemaToTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required');
    process.exit(1);
  }

  console.log('🔌 Connecting to Turso database...');
  console.log('  URL:', url);

  const client = createClient({
    url,
    authToken,
  });

  // Read the generated SQL
  const sqlPath = path.join('/tmp', 'turso-schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Remove comment lines and split SQL into individual statements
  const cleanedSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📋 Executing ${statements.length} SQL statements on Turso...`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      await client.execute(stmt);
      successCount++;

      // Log progress for CREATE TABLE statements
      if (stmt.includes('CREATE TABLE')) {
        const tableName = stmt.match(/CREATE TABLE\s+"?(\w+)"?/)?.[1];
        console.log(`  ✓ Created table: ${tableName}`);
      } else if (stmt.includes('CREATE UNIQUE INDEX')) {
        const idxName = stmt.match(/CREATE UNIQUE INDEX\s+"?(\w+)"?/)?.[1];
        console.log(`  ✓ Created unique index: ${idxName}`);
      } else if (stmt.includes('CREATE INDEX')) {
        const idxName = stmt.match(/CREATE INDEX\s+"?(\w+)"?/)?.[1];
        console.log(`  ✓ Created index: ${idxName}`);
      }
    } catch (error) {
      // Ignore "already exists" errors
      if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate column'))) {
        console.log(`  ⚠ Skipped (already exists): ${stmt.substring(0, 80)}...`);
      } else {
        errorCount++;
        console.error(`  ❌ Error executing statement ${i + 1}:`, error.message?.substring(0, 200));
        console.error(`     Statement: ${stmt.substring(0, 200)}...`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Schema push completed!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Verify by listing tables
  console.log('\n📊 Verifying tables in Turso...');
  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('  Tables found:');
    for (const row of tables.rows) {
      console.log(`    - ${row.name}`);
    }
  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
  }
}

pushSchemaToTurso().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

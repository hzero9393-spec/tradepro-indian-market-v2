const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const pgSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgresql://')) {
  console.log('🔧 PostgreSQL detected - using PostgreSQL schema with enums...');
  
  // Copy the PostgreSQL schema (with proper enums) as the active schema
  if (fs.existsSync(pgSchemaPath)) {
    fs.copyFileSync(pgSchemaPath, schemaPath);
    console.log('✅ Switched to PostgreSQL schema with enums');
  } else {
    console.log('⚠️ PostgreSQL schema file not found, keeping current schema');
  }
} else {
  console.log('🔧 SQLite/local detected - using SQLite schema...');
  
  // Copy the SQLite schema (with String types) as the active schema
  if (fs.existsSync(sqliteSchemaPath)) {
    fs.copyFileSync(sqliteSchemaPath, schemaPath);
    console.log('✅ Switched to SQLite schema');
  } else {
    // If no separate SQLite file, the current schema.prisma IS the SQLite version
    console.log('✅ Keeping current SQLite schema');
  }
}

// Generate Prisma client
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Prisma generate failed:', error.message);
  // Don't exit with error - let the build continue
}

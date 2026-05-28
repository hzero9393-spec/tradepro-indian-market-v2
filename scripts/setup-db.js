const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const pgSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const tursoSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.turso.prisma');

// Get DATABASE_URL from environment
const dbUrl = process.env.DATABASE_URL || '';
const isVercel = !!process.env.VERCEL;

console.log('🔍 Setup DB Script');
console.log('  DATABASE_URL prefix:', dbUrl ? dbUrl.substring(0, 35) + '...' : '(empty)');
console.log('  VERCEL:', isVercel);

// Detect database type from URL prefix
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const isTurso = dbUrl.startsWith('libsql://') || !!process.env.TURSO_DATABASE_URL;

if (isTurso) {
  console.log('🔧 Turso/libSQL detected - using Turso schema...');

  if (fs.existsSync(tursoSchemaPath)) {
    fs.copyFileSync(tursoSchemaPath, schemaPath);
    console.log('✅ Switched to Turso (SQLite) schema');
  } else if (fs.existsSync(sqliteSchemaPath)) {
    fs.copyFileSync(sqliteSchemaPath, schemaPath);
    console.log('✅ Switched to SQLite schema (Turso fallback)');
  } else {
    console.log('✅ Keeping current schema');
  }

  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated for Turso');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error.message);
  }

  // Push schema to Turso database using @libsql/client directly
  // (prisma db push doesn't work with libsql:// URLs in Prisma 7)
  if (isVercel || process.env.PUSH_SCHEMA === 'true') {
    try {
      console.log('🚀 Running Turso migration script...');
      execSync('node ' + path.join(__dirname, 'turso-migrate.js'), {
        stdio: 'inherit',
        timeout: 90000,
        env: { ...process.env }
      });
      console.log('✅ Turso migration completed');
    } catch (error) {
      console.error('⚠️ Turso migration failed:', error.message?.substring(0, 200));
    }
  }
} else if (isPostgres) {
  console.log('🔧 PostgreSQL detected - using PostgreSQL schema...');

  if (fs.existsSync(pgSchemaPath)) {
    fs.copyFileSync(pgSchemaPath, schemaPath);
    console.log('✅ Switched to PostgreSQL schema');
  } else {
    console.log('⚠️ PostgreSQL schema file not found, keeping current schema');
  }

  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated for PostgreSQL');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error.message);
  }

  // Push schema to database (only in CI/Vercel builds)
  if (isVercel) {
    try {
      console.log('🚀 Pushing schema to PostgreSQL database...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', timeout: 90000 });
      console.log('✅ Schema pushed to database');
    } catch (error) {
      console.error('⚠️ Schema push failed (tables may already exist):', error.message?.substring(0, 200));
    }
  }
} else {
  if (isVercel) {
    // On Vercel without DATABASE_URL - this should not happen
    console.log('⚠️ WARNING: Running on Vercel but no DATABASE_URL found!');
    console.log('📋 Please add DATABASE_URL to your Vercel project environment variables.');
    // Still try PostgreSQL schema on Vercel even without URL
    if (fs.existsSync(pgSchemaPath)) {
      fs.copyFileSync(pgSchemaPath, schemaPath);
      console.log('✅ Force-switched to PostgreSQL schema for Vercel');
    }
  } else {
    console.log('🔧 SQLite/local detected - using SQLite schema...');
    if (fs.existsSync(sqliteSchemaPath)) {
      fs.copyFileSync(sqliteSchemaPath, schemaPath);
      console.log('✅ Switched to SQLite schema');
    } else {
      console.log('✅ Keeping current schema');
    }
  }

  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error.message);
  }
}

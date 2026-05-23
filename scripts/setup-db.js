const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');
const pgSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');
const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgresql://')) {
  console.log('🔧 PostgreSQL detected - using PostgreSQL schema...');
  
  // Copy the PostgreSQL schema as the active schema
  if (fs.existsSync(pgSchemaPath)) {
    fs.copyFileSync(pgSchemaPath, schemaPath);
    console.log('✅ Switched to PostgreSQL schema');
  } else {
    console.log('⚠️ PostgreSQL schema file not found, keeping current schema');
  }

  // Generate Prisma client
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error.message);
  }

  // Push schema to database (only in production build, not during postinstall)
  if (process.env.VERCEL || process.env.CI) {
    try {
      console.log('🚀 Pushing schema to PostgreSQL database...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Schema pushed to database');
    } catch (error) {
      console.error('⚠️ Schema push failed (tables may already exist):', error.message);
      // Don't fail the build - tables may already exist
    }
  }
} else {
  console.log('🔧 SQLite/local detected - using SQLite schema...');
  
  // Copy the SQLite schema as the active schema
  if (fs.existsSync(sqliteSchemaPath)) {
    fs.copyFileSync(sqliteSchemaPath, schemaPath);
    console.log('✅ Switched to SQLite schema');
  } else {
    console.log('✅ Keeping current SQLite schema');
  }

  // Generate Prisma client
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error.message);
  }
}

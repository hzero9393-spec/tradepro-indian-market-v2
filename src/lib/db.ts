import { PrismaClient } from '@prisma/client'

// Prisma connection for Vercel serverless / Node.js runtime
// Uses DIRECT_URL (port 5432) for direct connection which works better in serverless.
// PgBouncer pooler (port 6543) requires prepared statements to be disabled.
function getDatabaseUrl(): string {
  // 1. Prefer DIRECT_URL for direct database connection (better for serverless)
  if (process.env.DIRECT_URL?.startsWith('postgresql://')) {
    return process.env.DIRECT_URL
  }

  // 2. Check DATABASE_URL
  if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.DATABASE_URL
  }

  // 3. Check APP_DATABASE_URL
  if (process.env.APP_DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.APP_DATABASE_URL
  }

  throw new Error('No PostgreSQL DATABASE_URL found. Check environment variables.')
}

const datasourceUrl = getDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

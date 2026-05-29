import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if we're using Turso/libSQL (production on Vercel)
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl) {
    // Use Turso with libSQL adapter (Prisma v7 factory pattern)
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    })

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  // Fallback for local dev: use libsql with local file
  const localDbPath = process.env.DATABASE_URL || 'file:./prisma/db/local.db'
  const adapter = new PrismaLibSql({
    url: localDbPath,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if we're using Turso/libSQL
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoAuthToken) {
    // Use Turso with libSQL adapter (Prisma v7 factory pattern)
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoAuthToken,
    })

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  // Fallback to local SQLite via libSQL adapter
  // Prisma v7 with engine type "client" requires an adapter
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const adapter = new PrismaLibSql({
    url: dbUrl,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

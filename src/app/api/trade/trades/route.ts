import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const { searchParams } = new URL(request.url)

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build where clause
    const where: Record<string, unknown> = { userId }

    // Date range filter on executedAt
    if (from || to) {
      where.executedAt = {}
      if (from) {
        where.executedAt.gte = new Date(from)
      }
      if (to) {
        where.executedAt.lte = new Date(to)
      }
    }

    // Get total count
    const total = await db.trade.count({ where })

    // Get trades
    const trades = await db.trade.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      success: true,
      data: trades,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + trades.length < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/trade/trades] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

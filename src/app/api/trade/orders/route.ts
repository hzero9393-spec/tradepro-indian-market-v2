import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build where clause
    const where: Record<string, unknown> = { userId }

    if (status) {
      const validStatuses = ['PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }

    // Date range filter on placedAt
    if (from || to) {
      where.placedAt = {}
      if (from) {
        where.placedAt.gte = new Date(from)
      }
      if (to) {
        where.placedAt.lte = new Date(to)
      }
    }

    // Get total count
    const total = await db.order.count({ where })

    // Get orders
    const orders = await db.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + orders.length < total,
      },
    })
  } catch (error) {
    console.error('[GET /api/trade/orders] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

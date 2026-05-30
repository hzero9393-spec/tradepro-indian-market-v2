import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

// GET /api/watchlist - Get user's watchlist with live prices
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId

    const items = await db.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    })

    // Enrich with live prices
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let currentPrice = 0
        let change = 0
        let changePercent = 0
        let sector = ''

        if (item.segment === 'INDEX') {
          const index = await db.index.findFirst({
            where: { symbol: item.symbol },
            select: { currentPrice: true, change: true, changePercent: true },
          })
          if (index) {
            currentPrice = index.currentPrice
            change = index.change
            changePercent = index.changePercent
          }
        } else {
          const stock = await db.stock.findFirst({
            where: { symbol: item.symbol, isActive: true },
            select: { currentPrice: true, change: true, changePercent: true, sector: true },
          })
          if (stock) {
            currentPrice = stock.currentPrice
            change = stock.change
            changePercent = stock.changePercent
            sector = stock.sector
          }
        }

        return {
          ...item,
          currentPrice,
          change,
          changePercent,
          sector,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedItems,
    })
  } catch (error) {
    console.error('[GET /api/watchlist] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

// POST /api/watchlist - Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const body = await request.json()
    const { symbol, name, segment } = body

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // Check if already in watchlist
    const existing = await db.watchlistItem.findFirst({
      where: { userId, symbol },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already in watchlist', data: existing },
        { status: 409 }
      )
    }

    const item = await db.watchlistItem.create({
      data: {
        userId,
        symbol,
        name: name || symbol,
        segment: segment || 'EQUITY',
      },
    })

    return NextResponse.json({
      success: true,
      message: `${symbol} added to watchlist`,
      data: item,
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/watchlist] Error:', error)
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/watchlist - Remove item from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const id = searchParams.get('id')

    if (!symbol && !id) {
      return NextResponse.json(
        { error: 'Provide symbol or id to remove' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { userId }
    if (id) {
      where.id = id
    } else {
      where.symbol = symbol
    }

    const deleted = await db.watchlistItem.deleteMany({ where })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Item not found in watchlist' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Removed from watchlist`,
    })
  } catch (error) {
    console.error('[DELETE /api/watchlist] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    )
  }
}

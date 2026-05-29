import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'open', 'closed', or 'all' (default: 'all')

    // ─── Build where clause based on status filter ─────────────────
    const where: { userId: string; isOpen?: boolean } = { userId }
    if (status === 'open') {
      where.isOpen = true
    } else if (status === 'closed') {
      where.isOpen = false
    }
    // 'all' or no filter → no isOpen filter, return everything

    // ─── Fetch positions ───────────────────────────────────────────
    const positions = await db.position.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    if (positions.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    // ─── Batch: Collect all unique symbols for price lookup ─────
    const equitySymbols = new Set<string>()
    const futureSymbols = new Set<string>()
    const optionKeys: { underlying: string; optionType: string; strikePrice: number }[] = []

    for (const pos of positions) {
      if (pos.segment === 'EQUITY') {
        equitySymbols.add(pos.symbol.toUpperCase())
      } else if (pos.segment === 'FUTURES') {
        futureSymbols.add(pos.symbol.toUpperCase())
      } else if (pos.segment === 'OPTIONS' && pos.optionType && pos.strikePrice) {
        optionKeys.push({
          underlying: pos.symbol.toUpperCase(),
          optionType: pos.optionType,
          strikePrice: pos.strikePrice,
        })
      }
    }

    // ─── Batch price lookups: 3 parallel queries instead of N ───
    const [stockPrices, futurePrices, optionPrices] = await Promise.all([
      equitySymbols.size > 0
        ? db.stock.findMany({
            where: {
              symbol: { in: Array.from(equitySymbols) },
              isActive: true,
            },
            select: { symbol: true, currentPrice: true, change: true, changePercent: true, name: true },
          })
        : Promise.resolve([]),
      futureSymbols.size > 0
        ? db.future.findMany({
            where: {
              underlying: { in: Array.from(futureSymbols) },
              isActive: true,
            },
            orderBy: { expiryDate: 'asc' },
            select: { underlying: true, ltp: true, change: true, changePercent: true },
          })
        : Promise.resolve([]),
      optionKeys.length > 0
        ? db.option.findMany({
            where: {
              OR: optionKeys.map(ok => ({
                underlying: ok.underlying,
                optionType: ok.optionType,
                strikePrice: ok.strikePrice,
                isActive: true,
              })),
            },
            orderBy: { expiryDate: 'asc' },
            select: { underlying: true, optionType: true, strikePrice: true, ltp: true, change: true, changePercent: true },
          })
        : Promise.resolve([]),
    ])

    // ─── Build lookup maps for O(1) price access ───────────────
    const stockPriceMap = new Map(
      stockPrices.map(s => [s.symbol.toUpperCase(), s])
    )
    const futurePriceMap = new Map(
      futurePrices.map(f => [f.underlying.toUpperCase(), f])
    )
    const optionPriceMap = new Map(
      optionPrices.map(o => [`${o.underlying.toUpperCase()}:${o.optionType}:${o.strikePrice}`, o])
    )

    // ─── Enrich positions with prices ──────────────────────────
    const enrichedPositions = positions.map(position => {
      let currentPrice = position.currentPrice

      // Only fetch live prices for open positions
      if (position.isOpen) {
        if (position.segment === 'EQUITY') {
          const stockData = stockPriceMap.get(position.symbol.toUpperCase())
          if (stockData) currentPrice = stockData.currentPrice
        } else if (position.segment === 'FUTURES') {
          const futureData = futurePriceMap.get(position.symbol.toUpperCase())
          if (futureData) currentPrice = futureData.ltp
        } else if (position.segment === 'OPTIONS' && position.optionType && position.strikePrice) {
          const optKey = `${position.symbol.toUpperCase()}:${position.optionType}:${position.strikePrice}`
          const optionData = optionPriceMap.get(optKey)
          if (optionData) currentPrice = optionData.ltp
        }
      }

      // Calculate P&L based on direction
      let unrealizedPnl: number
      if (position.tradeDirection === 'BUY') {
        unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity
      } else {
        unrealizedPnl = (position.entryPrice - currentPrice) * position.quantity
      }

      const currentValue = position.isOpen ? position.quantity * currentPrice : 0

      // For closed positions, exit price is the squaredOffAt price (stored in currentPrice at close time)
      const exitPrice = !position.isOpen ? position.currentPrice : currentPrice

      return {
        ...position,
        currentPrice: position.isOpen ? currentPrice : position.currentPrice,
        currentValue,
        unrealizedPnl: position.isOpen ? Math.round(unrealizedPnl * 100) / 100 : 0,
        unrealizedPnlPercent: position.isOpen && position.entryPrice > 0
          ? Math.round((unrealizedPnl / position.totalInvested) * 10000) / 100
          : 0,
        exitPrice,
        closedAt: position.squaredOffAt?.toISOString() || null,
        realizedPnl: position.realizedPnl,
      }
    })

    // ─── Cache prices for other API calls ───────────────────────
    for (const s of stockPrices) {
      cache.set(CacheKeys.stockPrice(s.symbol), s, CacheTTL.STOCK_PRICE)
    }
    for (const f of futurePrices) {
      cache.set(CacheKeys.futurePrice(f.underlying), f, CacheTTL.FUTURE_PRICE)
    }

    return NextResponse.json({
      success: true,
      data: enrichedPositions,
      count: enrichedPositions.length,
    })
  } catch (error) {
    console.error('[GET /api/trade/positions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}

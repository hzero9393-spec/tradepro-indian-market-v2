import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId

    // Fetch all open positions for the user
    const positions = await db.position.findMany({
      where: {
        userId,
        isOpen: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich positions with current prices and unrealized P&L
    const enrichedPositions = await Promise.all(
      positions.map(async (position) => {
        let currentPrice = position.currentPrice

        if (position.segment === 'EQUITY') {
          const stock = await db.stock.findFirst({
            where: { symbol: { equals: position.symbol, mode: 'insensitive' }, isActive: true },
            select: { currentPrice: true, change: true, changePercent: true, name: true },
          })
          if (stock) {
            currentPrice = stock.currentPrice
          }
        } else if (position.segment === 'FUTURES') {
          const future = await db.future.findFirst({
            where: {
              underlying: { equals: position.symbol, mode: 'insensitive' },
              isActive: true,
            },
            orderBy: { expiryDate: 'asc' },
            select: { ltp: true, change: true, changePercent: true },
          })
          if (future) {
            currentPrice = future.ltp
          }
        } else if (position.segment === 'OPTIONS') {
          const option = await db.option.findFirst({
            where: {
              underlying: { equals: position.symbol, mode: 'insensitive' },
              optionType: position.optionType,
              strikePrice: position.strikePrice,
              isActive: true,
            },
            orderBy: { expiryDate: 'asc' },
            select: { ltp: true, change: true, changePercent: true },
          })
          if (option) {
            currentPrice = option.ltp
          }
        }

        // Calculate unrealized P&L based on direction
        let unrealizedPnl: number
        if (position.tradeDirection === 'BUY') {
          unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity
        } else {
          // Short position: profit when price drops
          unrealizedPnl = (position.entryPrice - currentPrice) * position.quantity
        }

        const currentValue = position.quantity * currentPrice

        // Update the position in the database with latest prices
        await db.position.update({
          where: { id: position.id },
          data: {
            currentPrice,
            currentValue,
            unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
          }
        })

        return {
          ...position,
          currentPrice,
          currentValue,
          unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
          unrealizedPnlPercent: position.entryPrice > 0
            ? Math.round((unrealizedPnl / position.totalInvested) * 10000) / 100
            : 0,
        }
      })
    )

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

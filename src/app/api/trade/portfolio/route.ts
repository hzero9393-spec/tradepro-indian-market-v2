import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId

    // Get user with current balance
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        virtualBalance: true,
        marginUsed: true,
        totalPnl: true,
        totalTrades: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all open positions
    const positions = await db.position.findMany({
      where: {
        userId,
        isOpen: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich each position with current price and calculate values
    let totalInvested = 0
    let totalCurrentValue = 0
    let totalUnrealizedPnl = 0
    const equityPositions = []
    const futuresPositions = []
    const optionsPositions = []

    for (const position of positions) {
      let currentPrice = position.currentPrice

      // Get latest price from the market data
      if (position.segment === 'EQUITY') {
        const stock = await db.stock.findFirst({
          where: { symbol: { equals: position.symbol, mode: 'insensitive' }, isActive: true },
          select: { currentPrice: true, change: true, changePercent: true, name: true },
        })
        if (stock) currentPrice = stock.currentPrice
      } else if (position.segment === 'FUTURES') {
        const future = await db.future.findFirst({
          where: {
            underlying: { equals: position.symbol, mode: 'insensitive' },
            isActive: true,
          },
          orderBy: { expiryDate: 'asc' },
          select: { ltp: true },
        })
        if (future) currentPrice = future.ltp
      } else if (position.segment === 'OPTIONS') {
        const option = await db.option.findFirst({
          where: {
            underlying: { equals: position.symbol, mode: 'insensitive' },
            optionType: position.optionType,
            strikePrice: position.strikePrice,
            isActive: true,
          },
          orderBy: { expiryDate: 'asc' },
          select: { ltp: true },
        })
        if (option) currentPrice = option.ltp
      }

      // Calculate unrealized P&L based on direction
      let unrealizedPnl: number
      if (position.tradeDirection === 'BUY') {
        unrealizedPnl = (currentPrice - position.entryPrice) * position.quantity
      } else {
        unrealizedPnl = (position.entryPrice - currentPrice) * position.quantity
      }
      unrealizedPnl = Math.round(unrealizedPnl * 100) / 100

      const currentValue = Math.round(position.quantity * currentPrice * 100) / 100

      totalInvested += position.totalInvested
      totalCurrentValue += currentValue
      totalUnrealizedPnl += unrealizedPnl

      const enrichedPosition = {
        ...position,
        currentPrice,
        currentValue,
        unrealizedPnl,
        unrealizedPnlPercent: position.totalInvested > 0
          ? Math.round((unrealizedPnl / position.totalInvested) * 10000) / 100
          : 0,
      }

      if (position.segment === 'EQUITY') {
        equityPositions.push(enrichedPosition)
      } else if (position.segment === 'FUTURES') {
        futuresPositions.push(enrichedPosition)
      } else {
        optionsPositions.push(enrichedPosition)
      }

      // Update position with latest values
      await db.position.update({
        where: { id: position.id },
        data: {
          currentPrice,
          currentValue,
          unrealizedPnl,
        }
      })
    }

    // Calculate portfolio metrics
    const totalPortfolioValue = user.virtualBalance + totalCurrentValue
    const availableMargin = user.virtualBalance - user.marginUsed
    const initialCapital = 100000 // Default starting capital
    const totalReturn = Math.round(((totalPortfolioValue - initialCapital) / initialCapital) * 10000) / 100

    // Get closed positions count and total realized P&L
    const closedPositions = await db.position.findMany({
      where: {
        userId,
        isOpen: false,
      },
      select: { realizedPnl: true },
    })

    const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0)

    return NextResponse.json({
      success: true,
      data: {
        // Balance
        virtualBalance: user.virtualBalance,
        marginUsed: user.marginUsed,
        availableMargin: Math.max(0, availableMargin),

        // Position values
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
        totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,

        // Portfolio
        totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
        totalPnl: user.totalPnl,
        totalReturn,
        totalTrades: user.totalTrades,
        initialCapital,

        // Segments
        segments: {
          equity: {
            count: equityPositions.length,
            invested: equityPositions.reduce((s, p) => s + p.totalInvested, 0),
            currentValue: equityPositions.reduce((s, p) => s + p.currentValue, 0),
            unrealizedPnl: equityPositions.reduce((s, p) => s + p.unrealizedPnl, 0),
            positions: equityPositions,
          },
          futures: {
            count: futuresPositions.length,
            invested: futuresPositions.reduce((s, p) => s + p.totalInvested, 0),
            currentValue: futuresPositions.reduce((s, p) => s + p.currentValue, 0),
            unrealizedPnl: futuresPositions.reduce((s, p) => s + p.unrealizedPnl, 0),
            marginUsed: futuresPositions.reduce((s, p) => s + p.marginUsed, 0),
            positions: futuresPositions,
          },
          options: {
            count: optionsPositions.length,
            invested: optionsPositions.reduce((s, p) => s + p.totalInvested, 0),
            currentValue: optionsPositions.reduce((s, p) => s + p.currentValue, 0),
            unrealizedPnl: optionsPositions.reduce((s, p) => s + p.unrealizedPnl, 0),
            marginUsed: optionsPositions.reduce((s, p) => s + p.marginUsed, 0),
            positions: optionsPositions,
          },
        },

        // Open positions count
        openPositionsCount: positions.length,
      }
    })
  } catch (error) {
    console.error('[GET /api/trade/portfolio] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}

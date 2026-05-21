import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest, calculateBrokerage } from '@/lib/trade-auth'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const userId = auth.userId
    const body = await request.json()
    const { positionId } = body

    if (!positionId) {
      return NextResponse.json(
        { error: 'positionId is required' },
        { status: 400 }
      )
    }

    // Find the position
    const position = await db.position.findFirst({
      where: {
        id: positionId,
        userId,
        isOpen: true,
      }
    })

    if (!position) {
      return NextResponse.json(
        { error: 'Open position not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Get current price based on segment
    let currentPrice = position.currentPrice

    if (position.segment === 'EQUITY') {
      const stock = await db.stock.findFirst({
        where: { symbol: { equals: position.symbol, mode: 'insensitive' }, isActive: true },
        select: { currentPrice: true, symbol: true },
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
        select: { ltp: true },
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
        select: { ltp: true },
      })
      if (option) {
        currentPrice = option.ltp
      }
    }

    // Determine the closing direction (opposite of position direction)
    const closeDirection = position.tradeDirection === 'BUY' ? 'SELL' : 'BUY'
    const totalValue = Math.round(position.quantity * currentPrice * 100) / 100
    const brokerage = calculateBrokerage(totalValue)

    // Calculate realized P&L
    let realizedPnl: number
    if (position.tradeDirection === 'BUY') {
      // Long position: profit = (exit - entry) * qty - brokerage
      realizedPnl = (currentPrice - position.entryPrice) * position.quantity - brokerage
    } else {
      // Short position: profit = (entry - exit) * qty - brokerage
      realizedPnl = (position.entryPrice - currentPrice) * position.quantity - brokerage
    }
    realizedPnl = Math.round(realizedPnl * 100) / 100

    const pnlPercent = position.entryPrice > 0
      ? Math.round((realizedPnl / position.totalInvested) * 10000) / 100
      : 0

    // Execute the square-off in a transaction
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create closing order
      const order = await tx.order.create({
        data: {
          userId,
          orderType: 'MARKET',
          tradeDirection: closeDirection as 'BUY' | 'SELL',
          segment: position.segment,
          productType: position.productType,
          symbol: position.symbol,
          instrumentId: position.instrumentId,
          optionType: position.optionType,
          strikePrice: position.strikePrice,
          expiryDate: position.expiryDate,
          lotSize: position.lotSize,
          lots: position.lots,
          quantity: position.quantity,
          price: currentPrice,
          fillPrice: currentPrice,
          totalValue,
          brokerage,
          marginRequired: position.marginUsed,
          status: 'FILLED',
          filledAt: new Date(),
        }
      })

      // Create trade
      const trade = await tx.trade.create({
        data: {
          userId,
          orderId: order.id,
          segment: position.segment,
          productType: position.productType,
          tradeDirection: closeDirection as 'BUY' | 'SELL',
          symbol: position.symbol,
          instrumentId: position.instrumentId,
          optionType: position.optionType,
          strikePrice: position.strikePrice,
          quantity: position.quantity,
          fillPrice: currentPrice,
          totalValue,
          brokerage,
          pnl: realizedPnl,
          pnlPercent,
          expiryDate: position.expiryDate,
          squaredOffAt: new Date(),
        }
      })

      // Update position - close it
      await tx.position.update({
        where: { id: position.id },
        data: {
          isOpen: false,
          currentPrice,
          currentValue: 0,
          unrealizedPnl: 0,
          realizedPnl: { increment: realizedPnl },
          squaredOffAt: new Date(),
        }
      })

      // Update user balance and P&L
      if (position.tradeDirection === 'BUY') {
        // Closing long position: add proceeds to balance
        const proceeds = totalValue - brokerage
        await tx.user.update({
          where: { id: userId },
          data: {
            virtualBalance: { increment: proceeds },
            totalTrades: { increment: 1 },
            totalPnl: { increment: realizedPnl },
            marginUsed: { decrement: position.marginUsed },
          }
        })
      } else {
        // Closing short position: margin was blocked, return it +/- P&L
        const marginReturn = position.marginUsed + realizedPnl
        await tx.user.update({
          where: { id: userId },
          data: {
            virtualBalance: { increment: marginReturn },
            totalTrades: { increment: 1 },
            totalPnl: { increment: realizedPnl },
            marginUsed: { decrement: position.marginUsed },
          }
        })
      }

      // Get updated user
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { virtualBalance: true, totalPnl: true, totalTrades: true },
      })

      return { order, trade, updatedUser }
    })

    return NextResponse.json({
      success: true,
      message: `Position squared off: ${position.quantity} ${position.symbol} @ ₹${currentPrice}`,
      order: result.order,
      trade: result.trade,
      closedPosition: {
        id: position.id,
        symbol: position.symbol,
        segment: position.segment,
        tradeDirection: position.tradeDirection,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        exitPrice: currentPrice,
        realizedPnl,
        pnlPercent,
        brokerage,
      },
      balance: result.updatedUser?.virtualBalance,
      totalPnl: result.updatedUser?.totalPnl,
    })
  } catch (error) {
    console.error('[POST /api/trade/square-off] Error:', error)
    return NextResponse.json(
      { error: 'Failed to square off position' },
      { status: 500 }
    )
  }
}

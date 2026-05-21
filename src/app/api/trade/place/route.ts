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
    const { symbol, direction, orderType, segment, productType, quantity, price } = body

    // Validation
    if (!symbol || !direction || !orderType || !segment || !productType || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!['BUY', 'SELL'].includes(direction)) {
      return NextResponse.json({ error: 'Direction must be BUY or SELL' }, { status: 400 })
    }
    if (!['MARKET', 'LIMIT', 'SL', 'SL_M'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid orderType' }, { status: 400 })
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Quantity must be positive integer' }, { status: 400 })
    }

    // Get user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Only handle EQUITY for now (most common)
    if (segment !== 'EQUITY') {
      return NextResponse.json({ error: 'Only EQUITY segment is supported in this version' }, { status: 400 })
    }

    // Find the stock
    const stock = await db.stock.findFirst({
      where: { symbol: { equals: symbol, mode: 'insensitive' }, isActive: true }
    })
    if (!stock) return NextResponse.json({ error: `Stock not found: ${symbol}` }, { status: 404 })

    // Determine fill price
    const fillPrice = orderType === 'MARKET' ? stock.currentPrice : (price || stock.currentPrice)
    const totalValue = Math.round(quantity * fillPrice * 100) / 100
    const brokerage = calculateBrokerage(totalValue)

    // ─── BUY ────────────────────────────────────────────────
    if (direction === 'BUY') {
      const requiredAmount = totalValue + brokerage
      if (user.virtualBalance < requiredAmount) {
        return NextResponse.json({
          error: `Insufficient balance. Required: ₹${requiredAmount.toLocaleString('en-IN')}, Available: ₹${user.virtualBalance.toLocaleString('en-IN')}`
        }, { status: 400 })
      }

      const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            virtualBalance: { decrement: requiredAmount },
            totalTrades: { increment: 1 },
            totalPnl: { decrement: brokerage },
          }
        })

        const order = await tx.order.create({
          data: {
            userId: user.id,
            orderType: orderType as 'MARKET' | 'LIMIT' | 'SL' | 'SL_M',
            tradeDirection: 'BUY',
            segment: 'EQUITY',
            productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
            symbol: stock.symbol,
            quantity,
            price: price || stock.currentPrice,
            fillPrice,
            totalValue,
            brokerage,
            status: 'FILLED',
            filledAt: new Date(),
          }
        })

        const trade = await tx.trade.create({
          data: {
            userId: user.id,
            orderId: order.id,
            segment: 'EQUITY',
            productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
            tradeDirection: 'BUY',
            symbol: stock.symbol,
            quantity,
            fillPrice,
            totalValue,
            brokerage,
          }
        })

        // Create or update position
        const existingPosition = await tx.position.findFirst({
          where: {
            userId: user.id, symbol: stock.symbol, segment: 'EQUITY',
            productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
            tradeDirection: 'BUY', isOpen: true,
          }
        })

        if (existingPosition) {
          const newQty = existingPosition.quantity + quantity
          const newInvested = existingPosition.totalInvested + totalValue
          const newEntry = newInvested / newQty
          const newCurrent = newQty * stock.currentPrice
          await tx.position.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQty,
              entryPrice: Math.round(newEntry * 100) / 100,
              totalInvested: newInvested,
              currentValue: newCurrent,
              currentPrice: stock.currentPrice,
              unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
            }
          })
        } else {
          const currentValue = quantity * stock.currentPrice
          await tx.position.create({
            data: {
              userId: user.id, segment: 'EQUITY',
              productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
              tradeDirection: 'BUY', symbol: stock.symbol, quantity,
              entryPrice: fillPrice, currentPrice: stock.currentPrice,
              totalInvested: totalValue, currentValue,
              unrealizedPnl: Math.round((currentValue - totalValue) * 100) / 100,
              isOpen: true,
            }
          })
        }

        return { order, trade, updatedUser }
      })

      return NextResponse.json({
        success: true,
        message: `BUY ${quantity} ${stock.symbol} @ ₹${fillPrice}`,
        order: result.order,
        trade: result.trade,
        balance: result.updatedUser.virtualBalance,
        totalPnl: result.updatedUser.totalPnl,
      }, { status: 201 })
    }

    // ─── SELL ───────────────────────────────────────────────
    if (direction === 'SELL') {
      const position = await db.position.findFirst({
        where: {
          userId: user.id, symbol: stock.symbol, segment: 'EQUITY',
          isOpen: true, tradeDirection: 'BUY',
        }
      })

      if (!position) {
        return NextResponse.json({
          error: `No open position for ${stock.symbol}. You can only sell stocks you own.`
        }, { status: 400 })
      }

      if (position.quantity < quantity) {
        return NextResponse.json({
          error: `Insufficient quantity. You hold ${position.quantity} shares, trying to sell ${quantity}.`
        }, { status: 400 })
      }

      const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const proceeds = totalValue - brokerage
        const realizedPnl = Math.round(((fillPrice - position.entryPrice) * quantity - brokerage) * 100) / 100

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            virtualBalance: { increment: proceeds },
            totalTrades: { increment: 1 },
            totalPnl: { increment: realizedPnl },
          }
        })

        const order = await tx.order.create({
          data: {
            userId: user.id,
            orderType: orderType as 'MARKET' | 'LIMIT' | 'SL' | 'SL_M',
            tradeDirection: 'SELL',
            segment: 'EQUITY',
            productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
            symbol: stock.symbol,
            quantity,
            price: price || stock.currentPrice,
            fillPrice,
            totalValue,
            brokerage,
            status: 'FILLED',
            filledAt: new Date(),
          }
        })

        const trade = await tx.trade.create({
          data: {
            userId: user.id, orderId: order.id, segment: 'EQUITY',
            productType: productType as 'INTRADAY' | 'DELIVERY' | 'CARRY_FORWARD',
            tradeDirection: 'SELL', symbol: stock.symbol, quantity,
            fillPrice, totalValue, brokerage, pnl: realizedPnl,
            pnlPercent: position.entryPrice > 0 ? Math.round((realizedPnl / (position.entryPrice * quantity)) * 10000) / 100 : 0,
          }
        })

        const remainingQty = position.quantity - quantity
        if (remainingQty === 0) {
          await tx.position.update({
            where: { id: position.id },
            data: {
              isOpen: false, realizedPnl: { increment: realizedPnl },
              squaredOffAt: new Date(), currentValue: 0, unrealizedPnl: 0,
            }
          })
        } else {
          const newInvested = position.totalInvested - (position.entryPrice * quantity)
          const newCurrent = remainingQty * stock.currentPrice
          await tx.position.update({
            where: { id: position.id },
            data: {
              quantity: remainingQty, totalInvested: newInvested,
              currentValue: newCurrent, currentPrice: stock.currentPrice,
              unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
              realizedPnl: { increment: realizedPnl },
            }
          })
        }

        return { order, trade, realizedPnl, updatedUser }
      })

      return NextResponse.json({
        success: true,
        message: `SELL ${quantity} ${stock.symbol} @ ₹${fillPrice}`,
        order: result.order,
        trade: result.trade,
        realizedPnl: result.realizedPnl,
        balance: result.updatedUser.virtualBalance,
        totalPnl: result.updatedUser.totalPnl,
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/trade/place] Error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBrokerage } from '@/lib/trade-auth'

export async function POST() {
  try {
    // 1. Check PENDING LIMIT orders
    const pendingOrders = await db.order.findMany({
      where: { status: 'PENDING' },
      take: 50,
    })

    const triggeredOrders: { orderId: string; currentPrice: number }[] = []
    const slTpTriggers: { positionId: string; currentPrice: number; exitReason: string }[] = []

    for (const order of pendingOrders) {
      // Get current price
      let currentPrice = 0
      if (order.segment === 'EQUITY') {
        const stock = await db.stock.findFirst({ where: { symbol: order.symbol } })
        currentPrice = stock?.currentPrice || 0
      } else if (order.segment === 'FUTURES') {
        const future = await db.future.findFirst({ where: { underlying: order.symbol }, orderBy: { expiryDate: 'asc' } })
        currentPrice = future?.ltp || 0
      } else if (order.segment === 'OPTIONS') {
        const option = await db.option.findFirst({
          where: { underlying: order.symbol, optionType: order.optionType as 'CE' | 'PE', strikePrice: order.strikePrice || 0 },
          orderBy: { expiryDate: 'asc' }
        })
        currentPrice = option?.ltp || 0
      }

      if (!currentPrice) continue

      // Check if LIMIT order should trigger
      let shouldTrigger = false
      if (order.orderType === 'LIMIT') {
        if (order.tradeDirection === 'BUY' && currentPrice <= order.price) shouldTrigger = true
        if (order.tradeDirection === 'SELL' && currentPrice >= order.price) shouldTrigger = true
      }
      if (order.orderType === 'SL' || order.orderType === 'SL_M') {
        if (order.tradeDirection === 'BUY' && currentPrice >= (order.triggerPrice || order.price)) shouldTrigger = true
        if (order.tradeDirection === 'SELL' && currentPrice <= (order.triggerPrice || order.price)) shouldTrigger = true
      }

      if (shouldTrigger) {
        triggeredOrders.push({ orderId: order.id, currentPrice })
      }
    }

    // 2. Check SL/TP on open positions
    const openPositions = await db.position.findMany({
      where: {
        isOpen: true,
        OR: [
          { stopLoss: { not: null } },
          { target: { not: null } },
        ],
      },
      take: 50,
    })

    for (const position of openPositions) {
      let currentPrice = 0
      if (position.segment === 'EQUITY') {
        const stock = await db.stock.findFirst({ where: { symbol: position.symbol } })
        currentPrice = stock?.currentPrice || 0
      } else if (position.segment === 'FUTURES') {
        const future = await db.future.findFirst({ where: { underlying: position.symbol }, orderBy: { expiryDate: 'asc' } })
        currentPrice = future?.ltp || 0
      } else if (position.segment === 'OPTIONS') {
        const option = await db.option.findFirst({
          where: { underlying: position.symbol, optionType: position.optionType as 'CE' | 'PE', strikePrice: position.strikePrice || 0 },
          orderBy: { expiryDate: 'asc' }
        })
        currentPrice = option?.ltp || 0
      }

      if (!currentPrice) continue

      let shouldExit = false
      let exitReason = ''

      // Check Stop Loss
      if (position.stopLoss) {
        if (position.tradeDirection === 'BUY' && currentPrice <= position.stopLoss) {
          shouldExit = true
          exitReason = 'STOP_LOSS'
        }
        if (position.tradeDirection === 'SELL' && currentPrice >= position.stopLoss) {
          shouldExit = true
          exitReason = 'STOP_LOSS'
        }
      }

      // Check Target
      if (!shouldExit && position.target) {
        if (position.tradeDirection === 'BUY' && currentPrice >= position.target) {
          shouldExit = true
          exitReason = 'TARGET'
        }
        if (position.tradeDirection === 'SELL' && currentPrice <= position.target) {
          shouldExit = true
          exitReason = 'TARGET'
        }
      }

      if (shouldExit) {
        slTpTriggers.push({ positionId: position.id, currentPrice, exitReason })
      }
    }

    return NextResponse.json({
      success: true,
      triggeredOrders,
      slTpTriggers,
    })
  } catch (error) {
    console.error('[Check Triggers] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

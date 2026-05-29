import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateBrokerage } from '@/lib/trade-auth'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { Prisma } from '@prisma/client'

// Helper: batch-fetch prices for a list of items (orders or positions) by segment
async function batchFetchPrices(
  items: { symbol: string; segment: string; optionType?: string | null; strikePrice?: number | null }[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>()

  const equitySymbols = new Set<string>()
  const futureSymbols = new Set<string>()
  const optionKeys = new Set<string>()

  for (const item of items) {
    if (item.segment === 'EQUITY') equitySymbols.add(item.symbol)
    else if (item.segment === 'FUTURES') futureSymbols.add(item.symbol)
    else if (item.segment === 'OPTIONS') optionKeys.add(`${item.symbol}:${item.optionType}:${item.strikePrice}`)
  }

  // Batch fetch equity prices
  if (equitySymbols.size > 0) {
    try {
      const stocks = await db.stock.findMany({
        where: { symbol: { in: [...equitySymbols] } },
        select: { symbol: true, currentPrice: true },
      })
      for (const s of stocks) priceMap.set(`EQUITY:${s.symbol}`, s.currentPrice)
    } catch (err) {
      console.error('[Check Triggers] Batch equity price fetch error:', err)
    }
  }

  // Batch fetch future prices
  if (futureSymbols.size > 0) {
    try {
      const futures = await db.future.findMany({
        where: { underlying: { in: [...futureSymbols] } },
        select: { underlying: true, ltp: true, expiryDate: true },
        orderBy: { expiryDate: 'asc' },
      })
      for (const f of futures) {
        if (!priceMap.has(`FUTURES:${f.underlying}`)) priceMap.set(`FUTURES:${f.underlying}`, f.ltp)
      }
    } catch (err) {
      console.error('[Check Triggers] Batch future price fetch error:', err)
    }
  }

  // Batch fetch option prices
  if (optionKeys.size > 0) {
    try {
      const optionWhere: { underlying: string; optionType: 'CE' | 'PE'; strikePrice: number }[] = []
      for (const key of optionKeys) {
        const [symbol, optType, strike] = key.split(':')
        if (symbol && optType && strike) {
          optionWhere.push({ underlying: symbol, optionType: optType as 'CE' | 'PE', strikePrice: parseFloat(strike) })
        }
      }
      if (optionWhere.length > 0) {
        const options = await db.option.findMany({
          where: { OR: optionWhere, isActive: true },
          select: { underlying: true, optionType: true, strikePrice: true, ltp: true, expiryDate: true },
          orderBy: { expiryDate: 'asc' },
        })
        for (const o of options) {
          const key = `OPTIONS:${o.underlying}:${o.optionType}:${o.strikePrice}`
          if (!priceMap.has(key)) priceMap.set(key, o.ltp)
        }
      }
    } catch (err) {
      console.error('[Check Triggers] Batch option price fetch error:', err)
    }
  }

  return priceMap
}

function getItemPrice(
  item: { symbol: string; segment: string; optionType?: string | null; strikePrice?: number | null },
  priceMap: Map<string, number>
): number {
  if (item.segment === 'EQUITY') return priceMap.get(`EQUITY:${item.symbol}`) || 0
  if (item.segment === 'FUTURES') return priceMap.get(`FUTURES:${item.symbol}`) || 0
  if (item.segment === 'OPTIONS') return priceMap.get(`OPTIONS:${item.symbol}:${item.optionType}:${item.strikePrice}`) || 0
  return 0
}

export async function POST() {
  try {
    console.log('[Check Triggers] Starting trigger check...')
    const startTime = Date.now()

    const triggeredOrders: { orderId: string; currentPrice: number; executed: boolean }[] = []
    const slTpTriggers: { positionId: string; currentPrice: number; exitReason: string; executed: boolean }[] = []

    // ═══════════════════════════════════════════════════════════════
    // 1. Check PENDING LIMIT orders and auto-fill them
    // ═══════════════════════════════════════════════════════════════
    const pendingOrders = await db.order.findMany({
      where: { status: 'PENDING' },
      take: 50,
    })

    console.log(`[Check Triggers] Found ${pendingOrders.length} pending orders`)

    // Batch fetch all prices for pending orders
    const orderPriceMap = await batchFetchPrices(pendingOrders)

    for (const order of pendingOrders) {
      // Get current price from batch-fetched map
      let currentPrice = getItemPrice(order, orderPriceMap)

      // Fallback: try cache for equity (in case batch missed due to timing)
      if (!currentPrice && order.segment === 'EQUITY') {
        const cached = cache.get<{ currentPrice: number }>(CacheKeys.stockPrice(order.symbol))
        if (cached) currentPrice = cached.currentPrice
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

      if (!shouldTrigger) continue

      console.log(`[Check Triggers] Order ${order.id} triggered at price ${currentPrice}`)

      // ═══ AUTO-EXECUTE the triggered LIMIT order ═══
      try {
        const fillPrice = currentPrice
        const totalValue = Math.round(order.quantity * fillPrice * 100) / 100
        const brokerage = calculateBrokerage(totalValue)

        const user = await db.user.findUnique({ where: { id: order.userId } })
        if (!user) continue

        // For EQUITY BUY - check balance
        if (order.segment === 'EQUITY' && order.tradeDirection === 'BUY') {
          const requiredAmount = totalValue + brokerage
          if (user.virtualBalance < requiredAmount) {
            // Insufficient balance - reject the order
            await db.order.update({
              where: { id: order.id },
              data: { status: 'REJECTED', rejectReason: 'Insufficient balance at trigger time', cancelledAt: new Date() }
            })
            triggeredOrders.push({ orderId: order.id, currentPrice, executed: false })
            continue
          }
        }

        // For EQUITY SELL - check position
        if (order.segment === 'EQUITY' && order.tradeDirection === 'SELL') {
          const position = await db.position.findFirst({
            where: { userId: user.id, symbol: order.symbol, segment: 'EQUITY', productType: order.productType, isOpen: true, tradeDirection: 'BUY' }
          })
          if (!position || position.quantity < order.quantity) {
            await db.order.update({
              where: { id: order.id },
              data: { status: 'REJECTED', rejectReason: 'No open position at trigger time', cancelledAt: new Date() }
            })
            triggeredOrders.push({ orderId: order.id, currentPrice, executed: false })
            continue
          }
        }

        // For FUTURES/OPTIONS - check margin
        if ((order.segment === 'FUTURES' || (order.segment === 'OPTIONS' && order.tradeDirection === 'SELL'))) {
          const marginRequired = order.marginRequired || totalValue * 0.12
          if (user.virtualBalance < marginRequired) {
            await db.order.update({
              where: { id: order.id },
              data: { status: 'REJECTED', rejectReason: 'Insufficient margin at trigger time', cancelledAt: new Date() }
            })
            triggeredOrders.push({ orderId: order.id, currentPrice, executed: false })
            continue
          }
        }

        // For OPTIONS BUY - check balance
        if (order.segment === 'OPTIONS' && order.tradeDirection === 'BUY') {
          const requiredAmount = totalValue + brokerage
          if (user.virtualBalance < requiredAmount) {
            await db.order.update({
              where: { id: order.id },
              data: { status: 'REJECTED', rejectReason: 'Insufficient balance at trigger time', cancelledAt: new Date() }
            })
            triggeredOrders.push({ orderId: order.id, currentPrice, executed: false })
            continue
          }
        }

        // Execute in transaction
        await db.$transaction(async (tx: Prisma.TransactionClient) => {
          // Update order to FILLED
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'FILLED',
              fillPrice,
              totalValue,
              brokerage,
              filledAt: new Date(),
            }
          })

          // Create trade
          await tx.trade.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              segment: order.segment,
              productType: order.productType,
              tradeDirection: order.tradeDirection,
              symbol: order.symbol,
              instrumentId: order.instrumentId,
              optionType: order.optionType,
              strikePrice: order.strikePrice,
              expiryDate: order.expiryDate,
              quantity: order.quantity,
              fillPrice,
              totalValue,
              brokerage,
            }
          })

          // Update/create position based on segment
          if (order.segment === 'EQUITY' && order.tradeDirection === 'BUY') {
            const requiredAmount = totalValue + brokerage
            await tx.user.update({
              where: { id: order.userId },
              data: { virtualBalance: { decrement: requiredAmount }, totalTrades: { increment: 1 }, totalPnl: { decrement: brokerage } }
            })

            const existingPos = await tx.position.findFirst({
              where: { userId: order.userId, symbol: order.symbol, segment: 'EQUITY', productType: order.productType, tradeDirection: 'BUY', isOpen: true }
            })
            if (existingPos) {
              const newQty = existingPos.quantity + order.quantity
              const newInvested = existingPos.totalInvested + totalValue
              const newCurrent = newQty * currentPrice
              await tx.position.update({
                where: { id: existingPos.id },
                data: {
                  quantity: newQty, entryPrice: Math.round((newInvested / newQty) * 100) / 100,
                  totalInvested: newInvested, currentValue: newCurrent, currentPrice,
                  unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
                  stopLoss: order.stopLoss || existingPos.stopLoss, target: order.target || existingPos.target,
                }
              })
            } else {
              await tx.position.create({
                data: {
                  userId: order.userId, segment: 'EQUITY', productType: order.productType,
                  tradeDirection: 'BUY', symbol: order.symbol, quantity: order.quantity,
                  entryPrice: fillPrice, currentPrice, totalInvested: totalValue,
                  currentValue: order.quantity * currentPrice,
                  unrealizedPnl: Math.round((order.quantity * currentPrice - totalValue) * 100) / 100,
                  stopLoss: order.stopLoss, target: order.target, isOpen: true,
                }
              })
            }
          } else if (order.segment === 'EQUITY' && order.tradeDirection === 'SELL') {
            const position = await tx.position.findFirst({
              where: { userId: order.userId, symbol: order.symbol, segment: 'EQUITY', productType: order.productType, isOpen: true, tradeDirection: 'BUY' }
            })
            if (position) {
              const proceeds = totalValue - brokerage
              const realizedPnl = Math.round(((fillPrice - position.entryPrice) * order.quantity - brokerage) * 100) / 100
              await tx.user.update({
                where: { id: order.userId },
                data: { virtualBalance: { increment: proceeds }, totalTrades: { increment: 1 }, totalPnl: { increment: realizedPnl } }
              })
              const remainingQty = position.quantity - order.quantity
              if (remainingQty <= 0) {
                await tx.position.update({
                  where: { id: position.id },
                  data: { isOpen: false, realizedPnl: { increment: realizedPnl }, squaredOffAt: new Date(), currentValue: 0, unrealizedPnl: 0, exitReason: 'MANUAL' }
                })
              } else {
                const newInvested = position.totalInvested - (position.entryPrice * order.quantity)
                const newCurrent = remainingQty * currentPrice
                await tx.position.update({
                  where: { id: position.id },
                  data: { quantity: remainingQty, totalInvested: newInvested, currentValue: newCurrent, currentPrice, unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100, realizedPnl: { increment: realizedPnl } }
                })
              }
            }
          } else if (order.segment === 'FUTURES') {
            const marginRequired = order.marginRequired || totalValue * 0.12
            if (order.tradeDirection === 'BUY' || order.tradeDirection === 'SELL') {
              await tx.user.update({
                where: { id: order.userId },
                data: { virtualBalance: { decrement: marginRequired }, marginUsed: { increment: marginRequired }, totalTrades: { increment: 1 } }
              })
              const existingPos = await tx.position.findFirst({
                where: { userId: order.userId, symbol: order.symbol, segment: 'FUTURES', productType: order.productType, tradeDirection: order.tradeDirection, isOpen: true, expiryDate: order.expiryDate }
              })
              if (existingPos) {
                const newQty = existingPos.quantity + order.quantity
                const newInvested = existingPos.totalInvested + totalValue
                const newCurrent = newQty * currentPrice
                await tx.position.update({
                  where: { id: existingPos.id },
                  data: {
                    quantity: newQty, lots: existingPos.lots + (order.lots || 1),
                    entryPrice: Math.round((newInvested / newQty) * 100) / 100,
                    totalInvested: newInvested, currentValue: newCurrent, currentPrice,
                    unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
                    marginUsed: existingPos.marginUsed + marginRequired,
                    stopLoss: order.stopLoss || existingPos.stopLoss, target: order.target || existingPos.target,
                  }
                })
              } else {
                await tx.position.create({
                  data: {
                    userId: order.userId, segment: 'FUTURES', productType: order.productType,
                    tradeDirection: order.tradeDirection, symbol: order.symbol, quantity: order.quantity,
                    lotSize: order.lotSize, lots: order.lots, entryPrice: fillPrice, currentPrice,
                    totalInvested: totalValue, currentValue: order.quantity * currentPrice,
                    unrealizedPnl: Math.round((order.quantity * currentPrice - totalValue) * 100) / 100,
                    marginUsed: marginRequired, instrumentId: order.instrumentId, expiryDate: order.expiryDate,
                    stopLoss: order.stopLoss, target: order.target, isOpen: true,
                  }
                })
              }
            }
          } else if (order.segment === 'OPTIONS') {
            if (order.tradeDirection === 'BUY') {
              const requiredAmount = totalValue + brokerage
              await tx.user.update({
                where: { id: order.userId },
                data: { virtualBalance: { decrement: requiredAmount }, totalTrades: { increment: 1 }, totalPnl: { decrement: brokerage } }
              })
              const existingPos = await tx.position.findFirst({
                where: { userId: order.userId, symbol: order.symbol, segment: 'OPTIONS', optionType: order.optionType, strikePrice: order.strikePrice, productType: order.productType, tradeDirection: 'BUY', isOpen: true, expiryDate: order.expiryDate }
              })
              if (existingPos) {
                const newQty = existingPos.quantity + order.quantity
                const newInvested = existingPos.totalInvested + totalValue
                const newCurrent = newQty * currentPrice
                await tx.position.update({
                  where: { id: existingPos.id },
                  data: {
                    quantity: newQty, lots: existingPos.lots + (order.lots || 1),
                    entryPrice: Math.round((newInvested / newQty) * 100) / 100,
                    totalInvested: newInvested, currentValue: newCurrent, currentPrice,
                    unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
                    stopLoss: order.stopLoss || existingPos.stopLoss, target: order.target || existingPos.target,
                  }
                })
              } else {
                await tx.position.create({
                  data: {
                    userId: order.userId, segment: 'OPTIONS', productType: order.productType,
                    tradeDirection: 'BUY', symbol: order.symbol, quantity: order.quantity,
                    optionType: order.optionType, strikePrice: order.strikePrice,
                    lotSize: order.lotSize, lots: order.lots, entryPrice: fillPrice, currentPrice,
                    totalInvested: totalValue, currentValue: order.quantity * currentPrice,
                    unrealizedPnl: Math.round((order.quantity * currentPrice - totalValue) * 100) / 100,
                    instrumentId: order.instrumentId, expiryDate: order.expiryDate,
                    stopLoss: order.stopLoss, target: order.target, isOpen: true,
                  }
                })
              }
            } else if (order.tradeDirection === 'SELL') {
              const marginRequired = order.marginRequired || totalValue * 0.12
              await tx.user.update({
                where: { id: order.userId },
                data: { virtualBalance: { decrement: marginRequired }, marginUsed: { increment: marginRequired }, totalTrades: { increment: 1 } }
              })
              const existingPos = await tx.position.findFirst({
                where: { userId: order.userId, symbol: order.symbol, segment: 'OPTIONS', optionType: order.optionType, strikePrice: order.strikePrice, productType: order.productType, tradeDirection: 'SELL', isOpen: true, expiryDate: order.expiryDate }
              })
              if (existingPos) {
                const newQty = existingPos.quantity + order.quantity
                const newInvested = existingPos.totalInvested + totalValue
                const newCurrent = newQty * currentPrice
                await tx.position.update({
                  where: { id: existingPos.id },
                  data: {
                    quantity: newQty, lots: existingPos.lots + (order.lots || 1),
                    entryPrice: Math.round((newInvested / newQty) * 100) / 100,
                    totalInvested: newInvested, currentValue: newCurrent, currentPrice,
                    unrealizedPnl: Math.round((newCurrent - newInvested) * 100) / 100,
                    marginUsed: existingPos.marginUsed + marginRequired,
                    stopLoss: order.stopLoss || existingPos.stopLoss, target: order.target || existingPos.target,
                  }
                })
              } else {
                await tx.position.create({
                  data: {
                    userId: order.userId, segment: 'OPTIONS', productType: order.productType,
                    tradeDirection: 'SELL', symbol: order.symbol, quantity: order.quantity,
                    optionType: order.optionType, strikePrice: order.strikePrice,
                    lotSize: order.lotSize, lots: order.lots, entryPrice: fillPrice, currentPrice,
                    totalInvested: totalValue, currentValue: order.quantity * currentPrice,
                    unrealizedPnl: Math.round((order.quantity * currentPrice - totalValue) * 100) / 100,
                    marginUsed: marginRequired, instrumentId: order.instrumentId, expiryDate: order.expiryDate,
                    stopLoss: order.stopLoss, target: order.target, isOpen: true,
                  }
                })
              }
            }
          }

          // Invalidate caches
          cache.deleteByPrefix(`ubal:${order.userId}`)
        })

        triggeredOrders.push({ orderId: order.id, currentPrice, executed: true })
        console.log(`[Check Triggers] Order ${order.id} executed successfully at ${currentPrice}`)
      } catch (execError) {
        console.error('[Check Triggers] Failed to execute order:', order.id, execError)
        triggeredOrders.push({ orderId: order.id, currentPrice, executed: false })
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. Check SL/TP on open positions and auto square-off
    // ═══════════════════════════════════════════════════════════════
    // Fetch ALL open positions and filter in JS (more reliable with SQLite/Turso)
    // The Prisma `not: null` filter doesn't work reliably with SQLite for nullable Float fields
    const allOpenPositions = await db.position.findMany({
      where: { isOpen: true },
      take: 100,
    })
    // Filter to only those with SL or TP set
    const openPositions = allOpenPositions.filter(p =>
      (p.stopLoss !== null && p.stopLoss !== undefined && p.stopLoss > 0) ||
      (p.target !== null && p.target !== undefined && p.target > 0)
    )

    console.log(`[Check Triggers] Found ${allOpenPositions.length} open positions, ${openPositions.length} with SL/TP`)

    // Batch fetch prices for open positions
    const positionPriceMap = await batchFetchPrices(openPositions)

    for (const position of openPositions) {
      // Get current price from batch-fetched map
      let currentPrice = getItemPrice(position, positionPriceMap)

      // Fallback: try cache for equity
      if (!currentPrice && position.segment === 'EQUITY') {
        const cached = cache.get<{ currentPrice: number }>(CacheKeys.stockPrice(position.symbol))
        if (cached) currentPrice = cached.currentPrice
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

      if (!shouldExit) continue

      console.log(`[Check Triggers] Position ${position.id} triggered ${exitReason} at price ${currentPrice} (SL: ${position.stopLoss}, TP: ${position.target})`)

      // ═══ AUTO-SQUARE-OFF the position ═══
      try {
        const closeDirection = position.tradeDirection === 'BUY' ? 'SELL' : 'BUY'
        const totalValue = Math.round(position.quantity * currentPrice * 100) / 100
        const brokerage = calculateBrokerage(totalValue)

        let realizedPnl: number
        if (position.tradeDirection === 'BUY') {
          realizedPnl = (currentPrice - position.entryPrice) * position.quantity - brokerage
        } else {
          realizedPnl = (position.entryPrice - currentPrice) * position.quantity - brokerage
        }
        realizedPnl = Math.round(realizedPnl * 100) / 100

        const pnlPercent = position.entryPrice > 0
          ? Math.round((realizedPnl / position.totalInvested) * 10000) / 100
          : 0

        await db.$transaction(async (tx: Prisma.TransactionClient) => {
          // Create exit order
          await tx.order.create({
            data: {
              userId: position.userId,
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
              placedAt: new Date(),
              filledAt: new Date(),
            }
          })

          // Create exit trade
          await tx.trade.create({
            data: {
              userId: position.userId,
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

          // Close position
          await tx.position.update({
            where: { id: position.id },
            data: {
              isOpen: false,
              currentPrice,
              currentValue: 0,
              unrealizedPnl: 0,
              realizedPnl: { increment: realizedPnl },
              squaredOffAt: new Date(),
              exitReason: exitReason as 'STOP_LOSS' | 'TARGET',
            }
          })

          // Update user balance
          if (position.tradeDirection === 'BUY') {
            const proceeds = totalValue - brokerage
            await tx.user.update({
              where: { id: position.userId },
              data: {
                virtualBalance: { increment: proceeds },
                totalTrades: { increment: 1 },
                totalPnl: { increment: realizedPnl },
                marginUsed: { decrement: position.marginUsed },
              },
            })
          } else {
            const marginReturn = position.marginUsed + realizedPnl
            await tx.user.update({
              where: { id: position.userId },
              data: {
                virtualBalance: { increment: marginReturn },
                totalTrades: { increment: 1 },
                totalPnl: { increment: realizedPnl },
                marginUsed: { decrement: position.marginUsed },
              },
            })
          }

          // Invalidate caches
          cache.deleteByPrefix(`ubal:${position.userId}`)
        })

        slTpTriggers.push({ positionId: position.id, currentPrice, exitReason, executed: true })
        console.log(`[Check Triggers] Position ${position.id} squared off (${exitReason}) at ${currentPrice}`)
      } catch (execError) {
        console.error('[Check Triggers] Failed to square-off position:', position.id, execError)
        slTpTriggers.push({ positionId: position.id, currentPrice, exitReason, executed: false })
      }
    }

    const elapsed = Date.now() - startTime
    console.log(`[Check Triggers] Completed in ${elapsed}ms. Orders triggered: ${triggeredOrders.filter(o => o.executed).length}, SL/TP triggered: ${slTpTriggers.filter(t => t.executed).length}`)

    return NextResponse.json({
      success: true,
      triggeredOrders,
      slTpTriggers,
      summary: {
        ordersTriggered: triggeredOrders.filter(o => o.executed).length,
        ordersRejected: triggeredOrders.filter(o => !o.executed).length,
        positionsSquaredOff: slTpTriggers.filter(t => t.executed).length,
        squareOffFailed: slTpTriggers.filter(t => !t.executed).length,
      }
    })
  } catch (error) {
    console.error('[Check Triggers] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

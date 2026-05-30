import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const { positionId, orderId, stopLoss, target, price } = await request.json()

    // Modify position SL/TP
    if (positionId) {
      const position = await db.position.findFirst({
        where: { id: positionId, userId: auth.userId, isOpen: true }
      })

      if (!position) {
        return NextResponse.json({ error: 'Open position not found' }, { status: 404 })
      }

      // Validate SL/TP values
      if (stopLoss !== undefined && stopLoss !== null && stopLoss <= 0) {
        return NextResponse.json({ error: 'Stop Loss must be greater than 0' }, { status: 400 })
      }
      if (target !== undefined && target !== null && target <= 0) {
        return NextResponse.json({ error: 'Target must be greater than 0' }, { status: 400 })
      }

      await db.position.update({
        where: { id: positionId },
        data: {
          ...(stopLoss !== undefined && { stopLoss: stopLoss || null }),
          ...(target !== undefined && { target: target || null }),
        }
      })

      return NextResponse.json({ success: true, message: 'Position modified successfully' })
    }

    // Modify pending order price/SL/TP
    if (orderId) {
      const order = await db.order.findFirst({
        where: { id: orderId, userId: auth.userId, status: 'PENDING' }
      })

      if (!order) {
        return NextResponse.json({ error: 'Pending order not found' }, { status: 404 })
      }

      // Validate values
      if (price !== undefined && price <= 0) {
        return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
      }
      if (stopLoss !== undefined && stopLoss !== null && stopLoss <= 0) {
        return NextResponse.json({ error: 'Stop Loss must be greater than 0' }, { status: 400 })
      }
      if (target !== undefined && target !== null && target <= 0) {
        return NextResponse.json({ error: 'Target must be greater than 0' }, { status: 400 })
      }

      const updateData: Record<string, unknown> = {}
      if (price !== undefined) updateData.price = price
      if (stopLoss !== undefined) updateData.stopLoss = stopLoss || null
      if (target !== undefined) updateData.target = target || null

      await db.order.update({
        where: { id: orderId },
        data: updateData,
      })

      return NextResponse.json({ success: true, message: 'Order modified successfully' })
    }

    return NextResponse.json({ error: 'Provide positionId or orderId' }, { status: 400 })
  } catch (error) {
    console.error('[Modify Order/Position] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

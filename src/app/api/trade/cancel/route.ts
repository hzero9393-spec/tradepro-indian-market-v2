import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateRequest } from '@/lib/trade-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (auth.error) return auth.error

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: { id: orderId, userId: auth.userId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING orders can be cancelled' }, { status: 400 })
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', cancelledAt: new Date() }
    })

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' })
  } catch (error) {
    console.error('[Cancel Order] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

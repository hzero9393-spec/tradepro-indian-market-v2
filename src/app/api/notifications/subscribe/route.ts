import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromHeaders } from '@/lib/auth'

// POST /api/notifications/subscribe - Save a push subscription
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeaders(request.headers)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Missing subscription details: endpoint, keys.p256dh, keys.auth' },
        { status: 400 }
      )
    }

    // Upsert the push subscription
    const subscription = await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: payload.userId,
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || null,
      },
      create: {
        userId: payload.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Update user's notification preference
    await db.user.update({
      where: { id: payload.userId },
      data: {
        notificationsEnabled: true,
        pushSubscriptionId: subscription.id,
      },
    })

    return NextResponse.json({ subscription: { id: subscription.id, endpoint: subscription.endpoint } }, { status: 201 })
  } catch (error) {
    console.error('[Push Subscribe API] POST error:', error)
    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 })
  }
}

// DELETE /api/notifications/subscribe - Remove a push subscription
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromHeaders(request.headers)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

    // Delete the subscription
    await db.pushSubscription.deleteMany({
      where: {
        userId: payload.userId,
        endpoint,
      },
    })

    // Check if user has any remaining subscriptions
    const remainingSubs = await db.pushSubscription.count({
      where: { userId: payload.userId },
    })

    // If no more subscriptions, disable notifications
    if (remainingSubs === 0) {
      await db.user.update({
        where: { id: payload.userId },
        data: {
          notificationsEnabled: false,
          pushSubscriptionId: null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push Subscribe API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 })
  }
}

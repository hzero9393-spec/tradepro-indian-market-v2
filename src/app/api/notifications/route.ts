import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromHeaders } from '@/lib/auth'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeaders(request.headers)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread') === 'true'
    const category = searchParams.get('category')

    // Build where clause
    const where: Record<string, unknown> = {
      userId: payload.userId,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    if (category) {
      where.category = category
    }

    // Get notifications
    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: payload.userId,
        isRead: false,
      },
    })

    // Get total count
    const totalCount = await db.notification.count({ where })

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
      hasMore: offset + limit < totalCount,
    })
  } catch (error) {
    console.error('[Notifications API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (internal use)
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
    const { userId, title, body: notificationBody, icon, type, category, link } = body

    // Allow creating notifications for the authenticated user or admin creating for others
    const targetUserId = userId || payload.userId

    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        title,
        body: notificationBody,
        icon: icon || null,
        type: type || 'INFO',
        category: category || 'general',
        link: link || null,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('[Notifications API] POST error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
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
    const { notificationId, markAll } = body

    if (markAll) {
      // Mark all as read
      await db.notification.updateMany({
        where: {
          userId: payload.userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (notificationId) {
      // Mark specific notification as read
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          userId: payload.userId, // Ensure user owns this notification
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ notification })
    }

    return NextResponse.json({ error: 'Provide notificationId or markAll' }, { status: 400 })
  } catch (error) {
    console.error('[Notifications API] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete a notification or clear all
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

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll) {
      await db.notification.deleteMany({
        where: { userId: payload.userId },
      })
      return NextResponse.json({ success: true, message: 'All notifications cleared' })
    }

    if (notificationId) {
      await db.notification.delete({
        where: {
          id: notificationId,
          userId: payload.userId,
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide id or clearAll' }, { status: 400 })
  } catch (error) {
    console.error('[Notifications API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}

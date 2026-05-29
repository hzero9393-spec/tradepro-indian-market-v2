// TradePro - Server-side Notification Utilities
// Creates in-app notifications and optionally sends push notifications

import { db } from '@/lib/db'

export type NotificationType =
  | 'TRADE_EXECUTED'
  | 'POSITION_CLOSED'
  | 'ORDER_FILLED'
  | 'ORDER_CANCELLED'
  | 'PRICE_ALERT'
  | 'CHALLENGE'
  | 'SYSTEM'
  | 'INFO'

export type NotificationCategory = 'general' | 'trade' | 'market' | 'system' | 'challenge'

interface CreateNotificationParams {
  userId: string
  title: string
  body: string
  icon?: string
  type?: NotificationType
  category?: NotificationCategory
  link?: string
}

// Create a notification in the database
export async function createNotification(params: CreateNotificationParams) {
  const { userId, title, body, icon, type = 'INFO', category = 'general', link } = params

  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        body,
        icon: icon || null,
        type,
        category,
        link: link || null,
      },
    })

    // Try to send push notification if user has subscriptions
    await sendPushNotificationForUser(userId, {
      title,
      body,
      icon: icon || '/logo.svg',
      type,
      data: {
        link: link || '/',
        notificationId: notification.id,
      },
    })

    return notification
  } catch (error) {
    console.error('[Send Notification] Failed to create notification:', error)
    return null
  }
}

// Create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const results = []

  for (const userId of userIds) {
    const notification = await createNotification({ ...params, userId })
    results.push(notification)
  }

  return results
}

// Send push notification to all subscriptions for a user
async function sendPushNotificationForUser(
  userId: string,
  payload: {
    title: string
    body: string
    icon?: string
    type?: string
    data?: Record<string, unknown>
  }
) {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) return

    // Since we don't have VAPID keys configured for server-side push,
    // we rely on the service worker polling approach or direct Notification API.
    // The notification is stored in the DB and will be shown when the user opens the app.
    // For real push notifications, you would need to implement web-push with VAPID here.

    // For now, we just log that push would be sent
    console.log(
      `[Push Notification] Would send to ${subscriptions.length} subscription(s) for user ${userId}: ${payload.title}`
    )
  } catch (error) {
    console.error('[Push Notification] Failed to send push:', error)
  }
}

// ============================================================
// Trade-specific notification helpers
// ============================================================

export async function notifyTradeExecuted(
  userId: string,
  symbol: string,
  direction: string,
  quantity: number,
  price: number
) {
  return createNotification({
    userId,
    title: `Trade Executed: ${symbol}`,
    body: `${direction} ${quantity} x ${symbol} at ₹${price.toLocaleString('en-IN')}`,
    type: 'TRADE_EXECUTED',
    category: 'trade',
    link: '/positions',
  })
}

export async function notifyOrderFilled(
  userId: string,
  symbol: string,
  orderType: string,
  price: number
) {
  return createNotification({
    userId,
    title: `Order Filled: ${symbol}`,
    body: `Your ${orderType.toLowerCase()} order for ${symbol} has been filled at ₹${price.toLocaleString('en-IN')}`,
    type: 'ORDER_FILLED',
    category: 'trade',
    link: '/orders',
  })
}

export async function notifyPositionClosed(
  userId: string,
  symbol: string,
  pnl: number
) {
  const pnlStr = pnl >= 0 ? `+₹${pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(pnl).toLocaleString('en-IN')}`

  return createNotification({
    userId,
    title: `Position Closed: ${symbol}`,
    body: `${symbol} position closed with P&L: ${pnlStr}`,
    type: 'POSITION_CLOSED',
    category: 'trade',
    link: '/portfolio',
  })
}

export async function notifyOrderCancelled(
  userId: string,
  symbol: string,
  reason?: string
) {
  return createNotification({
    userId,
    title: `Order Cancelled: ${symbol}`,
    body: reason
      ? `Your order for ${symbol} was cancelled: ${reason}`
      : `Your order for ${symbol} has been cancelled`,
    type: 'ORDER_CANCELLED',
    category: 'trade',
    link: '/orders',
  })
}

export async function notifySystemMessage(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  return createNotification({
    userId,
    title,
    body,
    type: 'SYSTEM',
    category: 'system',
    link,
  })
}

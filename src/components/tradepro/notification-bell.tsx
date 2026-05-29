'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Check, CheckCheck, Trash2, ExternalLink, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuthStore } from '@/lib/auth-store'
import { useAppStore } from '@/lib/store'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  showBrowserNotification,
  type TradeProNotification,
} from '@/lib/notifications'

// Notification type icon mapping
function getNotificationIcon(type: string) {
  switch (type) {
    case 'TRADE_EXECUTED':
    case 'ORDER_FILLED':
      return '📊'
    case 'POSITION_CLOSED':
      return '📈'
    case 'ORDER_CANCELLED':
      return '❌'
    case 'PRICE_ALERT':
      return '🔔'
    case 'CHALLENGE':
      return '🏆'
    case 'SYSTEM':
      return '⚙️'
    default:
      return '💡'
  }
}

// Time ago formatter
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function NotificationBell() {
  const { token, user } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [notifications, setNotifications] = useState<TradeProNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>(() => {
    if (typeof window === 'undefined') return 'default'
    return isNotificationSupported() ? getNotificationPermission() : 'denied'
  })
  const [isEnabling, setIsEnabling] = useState(false)
  const [supported] = useState(isNotificationSupported())

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('[NotificationBell] Fetch failed:', error)
    }
  }, [token])

  // Initialize - fetch notifications and set up polling
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Register SW on mount
  useEffect(() => {
    if (supported) {
      registerServiceWorker()
    }
  }, [supported])

  // Enable browser notifications
  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    try {
      // Register service worker first
      await registerServiceWorker()

      // Request permission
      const permission = await requestNotificationPermission()
      setPermissionStatus(permission)

      if (permission === 'granted') {
        // Show a test notification
        await showBrowserNotification({
          title: 'TradePro Notifications Enabled',
          body: 'You will now receive browser notifications for trades, orders, and market alerts.',
          type: 'SYSTEM',
          category: 'system',
          link: '/dashboard',
          tag: 'notification-enabled',
        })

        // Update user preferences on server
        if (token) {
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              endpoint: `browser-${user?.id}-${Date.now()}`,
              keys: {
                p256dh: 'browser-notification',
                auth: 'direct-api',
              },
            }),
          })
        }

        // Refresh notifications
        fetchNotifications()
      }
    } catch (error) {
      console.error('[NotificationBell] Enable failed:', error)
    } finally {
      setIsEnabling(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!token) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      })

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[NotificationBell] Mark as read failed:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('[NotificationBell] Mark all as read failed:', error)
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    if (!token) return

    try {
      await fetch('/api/notifications?clearAll=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('[NotificationBell] Clear all failed:', error)
    }
  }

  // Handle notification click - navigate to link
  const handleNotificationClick = (notification: TradeProNotification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Navigate if there's a link
    if (notification.link) {
      const link = notification.link
      // Map links to page IDs
      const linkToPage: Record<string, string> = {
        '/positions': 'positions',
        '/orders': 'orders',
        '/portfolio': 'portfolio',
        '/stocks': 'trading',
        '/dashboard': 'dashboard',
        '/reports': 'reports',
      }
      const page = linkToPage[link]
      if (page) {
        setCurrentPage(page as any)
      }
    }

    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0 text-[#9ca3af] hover:text-[#111827] hover:bg-[#f4f6f8] h-9 w-9 rounded-xl"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          {supported && permissionStatus === 'granted' ? (
            <Bell className="size-[18px]" />
          ) : (
            <Bell className="size-[18px]" />
          )}
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{
                background: unreadCount > 9 ? '#ef4444' : '#00D09C',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0"
        style={{
          background: '#ffffff',
          border: '1px solid #e8ecf0',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5"
                style={{ background: '#f0fdf4', color: '#00A67E' }}
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-[#00A67E] hover:text-[#00D09C] hover:bg-[#f0fdf4]"
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-[#9ca3af] hover:text-[#ef4444] hover:bg-red-50"
                onClick={clearAll}
              >
                <Trash2 className="size-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <Separator style={{ background: '#e8ecf0' }} />

        {/* Enable Notifications Banner */}
        {supported && permissionStatus !== 'granted' && (
          <div
            className="mx-3 mt-3 rounded-lg p-3"
            style={{ background: '#f0fdf4', border: '1px solid #dcfce7' }}
          >
            <div className="flex items-start gap-2.5">
              {permissionStatus === 'denied' ? (
                <VolumeX className="size-4 text-[#ef4444] mt-0.5 shrink-0" />
              ) : (
                <Bell className="size-4 text-[#00A67E] mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: '#111827' }}>
                  {permissionStatus === 'denied'
                    ? 'Notifications blocked'
                    : 'Enable browser notifications'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
                  {permissionStatus === 'denied'
                    ? 'Please enable notifications in your browser settings to receive trade alerts.'
                    : 'Get instant alerts for trades, orders, and market events on your device.'}
                </p>
                {permissionStatus !== 'denied' && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 text-[11px] px-3"
                    style={{
                      background: '#00D09C',
                      color: '#fff',
                    }}
                    onClick={handleEnableNotifications}
                    disabled={isEnabling}
                  >
                    {isEnabling ? (
                      <>
                        <Loader2 className="size-3 mr-1 animate-spin" />
                        Enabling...
                      </>
                    ) : (
                      <>
                        <Volume2 className="size-3 mr-1" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-[#9ca3af]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div
                className="size-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: '#f4f6f8' }}
              >
                <Bell className="size-5 text-[#9ca3af]" />
              </div>
              <p className="text-sm font-medium" style={{ color: '#374151' }}>
                No notifications yet
              </p>
              <p className="text-xs mt-1 text-center" style={{ color: '#9ca3af' }}>
                You&apos;ll see trade confirmations, order updates, and market alerts here.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className="w-full text-left px-4 py-3 hover:bg-[#f4f6f8] transition-colors cursor-pointer outline-none focus-visible:bg-[#f4f6f8]"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread indicator */}
                    <div className="mt-1.5 shrink-0">
                      {!notification.isRead ? (
                        <div
                          className="size-2 rounded-full"
                          style={{ background: '#00D09C' }}
                        />
                      ) : (
                        <div className="size-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                        <span
                          className={`text-[13px] ${notification.isRead ? 'font-medium' : 'font-semibold'}`}
                          style={{ color: notification.isRead ? '#6b7280' : '#111827' }}
                        >
                          {notification.title}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: '#6b7280' }}
                      >
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.category && notification.category !== 'general' && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4"
                            style={{ borderColor: '#e8ecf0', color: '#9ca3af' }}
                          >
                            {notification.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-6 w-6 text-[#9ca3af] hover:text-[#00D09C] hover:bg-[#f0fdf4]"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        aria-label="Mark as read"
                      >
                        <Check className="size-3" />
                      </Button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator style={{ background: '#e8ecf0' }} />
            <div className="px-4 py-2.5">
              <button
                className="text-xs font-medium w-full text-center hover:underline"
                style={{ color: '#00A67E' }}
                onClick={() => {
                  setCurrentPage('dashboard')
                  setIsOpen(false)
                }}
              >
                View all activity
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

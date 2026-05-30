'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission as requestPermissionUtil,
  registerServiceWorker,
  showBrowserNotification,
  subscribeToPush,
  type NotificationPermissionStatus,
} from '@/lib/notifications'

export type NotificationPermission = NotificationPermissionStatus

interface UseNotificationsReturn {
  permission: NotificationPermission
  requestPermission: () => Promise<boolean>
  notify: (title: string, options?: NotificationOptions) => void
  isSupported: boolean
  isSubscribed: boolean
}

/**
 * React hook for managing browser push notifications.
 *
 * - Wraps the plain utility functions from `@/lib/notifications` in React state
 * - Keeps `permission` in sync so UI can react to it
 * - Provides a simple `notify(title, options?)` helper that any component can call
 * - Handles service-worker registration & push subscription internally
 *
 * Permission is initialised lazily via `useState(() => ...)` to avoid the
 * `react-hooks/set-state-in-effect` lint rule.
 */
export function useNotifications(): UseNotificationsReturn {
  // Lazy initialiser reads the real browser permission on first render
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined') return 'default'
    return isNotificationSupported() ? getNotificationPermission() : 'default'
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const isSupported = isNotificationSupported()

  // One-time SW registration + push-subscription check (side-effect only, no setState)
  useEffect(() => {
    if (!isSupported) return

    let cancelled = false

    registerServiceWorker().catch(() => {})

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (cancelled) return
        return reg.pushManager.getSubscription()
      }).then((sub) => {
        if (cancelled || !sub) return
        setIsSubscribed(true)
      }).catch(() => {})
    }

    return () => { cancelled = true }
  }, [isSupported])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    // Register SW first (needed for SW-based notifications)
    await registerServiceWorker().catch(() => {})

    const result = await requestPermissionUtil()
    setPermission(result)

    if (result === 'granted') {
      // Try to create a push subscription so we can receive push messages
      try {
        const sub = await subscribeToPush()
        setIsSubscribed(!!sub)
      } catch {
        // Non-critical – local notifications still work without push subscription
      }
    }

    return result === 'granted'
  }, [isSupported])

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return

      showBrowserNotification({
        title,
        body: options?.body || '',
        icon: options?.icon,
        tag: options?.tag,
        type: options?.data?.type as string | undefined,
        link: options?.data?.link as string | undefined,
        requireInteraction: options?.requireInteraction,
      }).catch(() => {
        // Silently ignore – the in-app notification bell already covers this
      })
    },
    [isSupported, permission],
  )

  return { permission, requestPermission, notify, isSupported, isSubscribed }
}

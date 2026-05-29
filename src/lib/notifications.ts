// TradePro - Client-side Notification Utilities
// Handles service worker registration, notification permissions, and browser notifications

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export interface TradeProNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: string;
  category: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  type?: string;
  link?: string;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

// ============================================================
// Service Worker Registration
// ============================================================

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.warn('[TradePro Notifications] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    swRegistration = registration;
    console.log('[TradePro Notifications] Service worker registered');
    return registration;
  } catch (error) {
    console.error('[TradePro Notifications] Service worker registration failed:', error);
    return null;
  }
}

export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (swRegistration) return swRegistration;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      swRegistration = registration;
      return registration;
    }
  }

  return null;
}

// ============================================================
// Notification Permission
// ============================================================

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';

  const currentPermission = Notification.permission;
  if (currentPermission === 'granted') return 'granted';
  if (currentPermission === 'denied') return 'denied';

  const permission = await Notification.requestPermission();
  return permission as NotificationPermissionStatus;
}

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// ============================================================
// Show Browser Notifications (Direct Notification API)
// ============================================================

export async function showBrowserNotification(options: ShowNotificationOptions): Promise<boolean> {
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[TradePro Notifications] Notification permission not granted');
    return false;
  }

  try {
    // Try using service worker notification first (works when app is in background)
    const registration = await getSWRegistration();
    if (registration) {
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.svg',
        badge: '/logo.svg',
        tag: options.tag || `tradepro-${Date.now()}`,
        data: {
          link: options.link || '/',
          type: options.type,
          ...options.data,
        },
        actions: options.actions || [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        vibrate: [100, 50, 100],
        renotify: true,
        requireInteraction: options.requireInteraction || false,
      });
      return true;
    }

    // Fallback to direct Notification API
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.svg',
      tag: options.tag || `tradepro-${Date.now()}`,
      data: {
        link: options.link || '/',
        type: options.type,
        ...options.data,
      },
    });

    notification.onclick = () => {
      window.focus();
      if (options.link) {
        window.location.href = options.link;
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('[TradePro Notifications] Failed to show notification:', error);
    return false;
  }
}

// ============================================================
// Trade-specific Notification Helpers
// ============================================================

export async function notifyTradeExecuted(symbol: string, direction: string, quantity: number, price: number): Promise<boolean> {
  return showBrowserNotification({
    title: `Trade Executed: ${symbol}`,
    body: `${direction} ${quantity} x ${symbol} at ₹${price.toLocaleString('en-IN')}`,
    type: 'TRADE_EXECUTED',
    category: 'trade',
    link: '/positions',
    tag: `trade-${symbol}-${Date.now()}`,
    actions: [
      { action: 'view_trade', title: 'View Trade' },
      { action: 'view_positions', title: 'View Positions' },
    ],
  });
}

export async function notifyOrderFilled(symbol: string, orderType: string, price: number): Promise<boolean> {
  return showBrowserNotification({
    title: `Order Filled: ${symbol}`,
    body: `Your ${orderType.toLowerCase()} order for ${symbol} has been filled at ₹${price.toLocaleString('en-IN')}`,
    type: 'ORDER_FILLED',
    category: 'trade',
    link: '/orders',
    tag: `order-${symbol}-${Date.now()}`,
    actions: [
      { action: 'view_trade', title: 'View Order' },
      { action: 'view_positions', title: 'View Positions' },
    ],
  });
}

export async function notifyPositionClosed(symbol: string, pnl: number): Promise<boolean> {
  const pnlStr = pnl >= 0 ? `+₹${pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(pnl).toLocaleString('en-IN')}`;
  const pnlEmoji = pnl >= 0 ? '📈' : '📉';

  return showBrowserNotification({
    title: `${pnlEmoji} Position Closed: ${symbol}`,
    body: `${symbol} position closed with P&L: ${pnlStr}`,
    type: 'POSITION_CLOSED',
    category: 'trade',
    link: '/portfolio',
    tag: `position-${symbol}-${Date.now()}`,
    actions: [
      { action: 'view_positions', title: 'View Positions' },
      { action: 'view_portfolio', title: 'View Portfolio' },
    ],
  });
}

export async function notifyPriceAlert(symbol: string, price: number, change: number): Promise<boolean> {
  const direction = change >= 0 ? 'up' : 'down';
  const changeStr = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

  return showBrowserNotification({
    title: `Price Alert: ${symbol}`,
    body: `${symbol} is ${direction} ${changeStr} at ₹${price.toLocaleString('en-IN')}`,
    type: 'PRICE_ALERT',
    category: 'market',
    link: '/stocks',
    tag: `price-${symbol}-${Date.now()}`,
  });
}

export async function notifySystem(title: string, body: string, link?: string): Promise<boolean> {
  return showBrowserNotification({
    title,
    body,
    type: 'SYSTEM',
    category: 'system',
    link: link || '/dashboard',
    tag: `system-${Date.now()}`,
  });
}

// ============================================================
// Push Subscription Management
// ============================================================

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null;

  const registration = await getSWRegistration();
  if (!registration) {
    console.warn('[TradePro Notifications] No service worker registration');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[TradePro Notifications] No VAPID public key configured. Using basic subscription.');
  }

  try {
    let subscription: PushSubscription;

    if (VAPID_PUBLIC_KEY) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } else {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });
    }

    // Send subscription to backend
    await sendSubscriptionToServer(subscription);
    return subscription;
  } catch (error) {
    console.error('[TradePro Notifications] Push subscription failed:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const registration = await getSWRegistration();
  if (!registration) return false;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await removeSubscriptionFromServer(subscription);
      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error('[TradePro Notifications] Push unsubscribe failed:', error);
    return false;
  }
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null;

  const registration = await getSWRegistration();
  if (!registration) return null;

  return registration.pushManager.getSubscription();
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('tradepro_token');
  if (!token) return;

  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    }),
  });
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('tradepro_token');
  if (!token) return;

  await fetch('/api/notifications/subscribe', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });
}

// ============================================================
// Initialize Notifications
// ============================================================

export async function initializeNotifications(): Promise<{
  supported: boolean;
  permission: NotificationPermissionStatus;
  subscribed: boolean;
}> {
  const supported = isNotificationSupported();

  if (!supported) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  // Register service worker
  await registerServiceWorker();

  const permission = getNotificationPermission();
  const pushSub = await getPushSubscription();

  return {
    supported,
    permission,
    subscribed: !!pushSub,
  };
}

// TradePro Service Worker - Push Notifications
// Handles push events and notification interactions

const NOTIFICATION_ICON = '/logo.svg';
const NOTIFICATION_BADGE = '/logo.svg';

// Listen for push events
self.addEventListener('push', (event) => {
  let data = {
    title: 'TradePro Alert',
    body: 'You have a new notification',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    tag: 'tradepro-notification',
    data: {},
    actions: [],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || NOTIFICATION_ICON,
    badge: data.badge || NOTIFICATION_BADGE,
    tag: data.tag || 'tradepro-notification',
    data: data.data || {},
    actions: data.actions || getDefaultActions(data.type),
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get default notification actions based on type
function getDefaultActions(type) {
  switch (type) {
    case 'TRADE_EXECUTED':
    case 'ORDER_FILLED':
      return [
        { action: 'view_trade', title: 'View Trade' },
        { action: 'view_positions', title: 'View Positions' },
      ];
    case 'POSITION_CLOSED':
      return [
        { action: 'view_positions', title: 'View Positions' },
        { action: 'view_portfolio', title: 'View Portfolio' },
      ];
    case 'PRICE_ALERT':
      return [
        { action: 'view_chart', title: 'View Chart' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'CHALLENGE':
      return [
        { action: 'view_challenge', title: 'View Challenge' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};
  const link = notificationData.link || '/';

  // If dismiss action, just close
  if (action === 'dismiss') return;

  // Determine URL based on action or notification data
  let targetUrl = link;

  if (action === 'view_trade') {
    targetUrl = notificationData.tradeId ? `/positions` : '/positions';
  } else if (action === 'view_positions') {
    targetUrl = '/positions';
  } else if (action === 'view_portfolio') {
    targetUrl = '/portfolio';
  } else if (action === 'view_chart') {
    targetUrl = notificationData.symbol ? `/stocks` : '/dashboard';
  } else if (action === 'view_challenge') {
    targetUrl = '/dashboard';
  } else if (action === 'view') {
    targetUrl = link;
  }

  // Focus or open window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // No existing window, open new one
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Could track analytics here
});

// Service worker activation - claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

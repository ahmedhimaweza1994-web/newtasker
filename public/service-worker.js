self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let notification;
  try {
    notification = event.data.json();
  } catch (e) {
    console.error('Failed to parse notification data:', e);
    return;
  }

  const title = notification.title || 'GWT Notification';
  const options = {
    body: notification.message || notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: notification.id || Date.now().toString(),
    data: notification,
    requireInteraction: notification.category === 'call',
    vibrate: notification.category === 'call' ? [200, 100, 200, 100, 200] : [200, 100, 200],
    actions: notification.category === 'call' ? [
      { action: 'answer', title: 'Answer' },
      { action: 'decline', title: 'Decline' }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();

  const notification = event.notification.data;
  const action = event.action;

  let url = '/';

  if (action === 'answer' || action === 'decline') {
    url = '/call-history';
  } else if (notification) {
    if (notification.category === 'message' && notification.metadata?.roomId) {
      const metadata = notification.metadata;
      const messageId = metadata?.messageId || '';
      url = `/chat?roomId=${metadata.roomId}${messageId ? `&messageId=${messageId}` : ''}`;
    } else if (notification.category === 'task' && notification.metadata?.taskId) {
      url = `/tasks?taskId=${notification.metadata.taskId}`;
    } else if (notification.category === 'call') {
      url = '/call-history';
    } else if (notification.category === 'leave_request') {
      url = '/hr';
    } else {
      url = '/dashboard';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === new URL(url, self.location.origin).href && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification);
});

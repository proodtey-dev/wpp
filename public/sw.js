// Service Worker for WPP Prospector PWA & Push Notifications

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[SW] Recebeu evento de push:', event);

  let data = {
    title: '💬 Nova Mensagem WhatsApp',
    body: 'Você recebeu uma nova mensagem no WPP Prospector.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/chat',
    tag: 'wpp-msg-' + Date.now()
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'wpp-msg',
    renotify: true,
    data: {
      url: data.url || '/chat'
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Ver Mensagem' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

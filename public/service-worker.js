self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const url = event.notification?.data?.url || '/';
  event.notification.close();

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of windowClients) {
      if ('focus' in client) {
        if (client.url.includes(url)) {
          return client.focus();
        }
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(url);
    }
  })());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: 'Уведомление', body: event.data.text() };
  }

  const title = payload.title || 'DOMIO Ops';
  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    data: { url: payload.url || '/' },
    actions: payload.actions || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

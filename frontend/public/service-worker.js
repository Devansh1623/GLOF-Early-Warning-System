self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[Service Worker] Push event received with data:', data);
    } catch (e) {
      console.error('[Service Worker] Error parsing push data as JSON:', e);
      data = { body: event.data.text() };
    }
  } else {
    console.log('[Service Worker] Push event received with no data.');
  }

  const title = data.title || 'GLOFWatch Alert';
  const options = {
    body: data.body || 'A new alert has been received.',
    icon: data.icon || '/logo192.png',
    badge: '/logo192.png',
    data: data.data || {},
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true // Keeps the notification open until the user clicks or dismisses it
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    const data = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200]
      })
    );
  }
});

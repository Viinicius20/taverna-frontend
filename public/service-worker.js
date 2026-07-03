/* eslint-disable no-restricted-globals */

// Esse é o service worker principal gerado pelo CRA
// O workbox cuida do cache automático das páginas

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Cache das páginas visitadas pra funcionar offline
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'document',
  new workbox.strategies.NetworkFirst()
);

workbox.routing.registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst()
);

// Recebe notificações push do servidor
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: 'sussurro',
    })
  );
});

// Quando clica na notificação, abre o app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('taverna') && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'BUSCAR_MENSAGENS' });
          return;
        }
      }
      // Abre na ficha — o service worker não acessa localStorage
      // mas passa uma mensagem pra página redirecionar
      return clients.openWindow('/personagens?abrir_ficha=1');
    })
  );
});
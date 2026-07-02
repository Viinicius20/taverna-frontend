// Esse arquivo roda em segundo plano, separado da página
// É ele que recebe as notificações push mesmo com o app fechado

self.addEventListener('push', event => {
  // 'push' é o evento que dispara quando chega uma notificação do servidor
  if (!event.data) return;

  const data = event.data.json();
  // data contém { title, body, icon } que o backend mandou

  // waitUntil garante que o service worker não fecha antes de mostrar a notificação
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200], // padrão de vibração no celular
      tag: 'sussurro', // evita spam — substitui notificação anterior com mesmo tag
    })
  );
});

self.addEventListener('notificationclick', event => {
  // Quando o usuário clica na notificação
  event.notification.close();
  
  // Abre o app ou foca a aba já aberta
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('taverna') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
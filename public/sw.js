// Service Worker for Push Notifications - Samel Telemedicina

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    // Try to use text if JSON parsing fails
    data = {
      title: 'Samel Telemedicina',
      body: event.data.text() || 'Você tem uma nova notificação'
    };
  }

  // Sanitize received data
  const title = (data.title || 'Samel Telemedicina').substring(0, 100);
  const body = (data.body || '').substring(0, 200);
  const tag = data.tag || `notification-${Date.now()}`;
  
  const options = {
    body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag, // Prevents duplicate notifications with same tag
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    data: {
      url: data.data?.url || '/online-consultation-details',
      nrAtendimento: data.data?.nrAtendimento,
      timestamp: data.data?.timestamp || Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }

  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/online-consultation-details';
  const nrAtendimento = event.notification.data?.nrAtendimento;
  
  // Build full URL with params if needed
  let targetUrl = urlToOpen;
  if (nrAtendimento && urlToOpen.includes('video-consultation')) {
    targetUrl = `${urlToOpen}?nr_atendimento=${nrAtendimento}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        // Check if there's already a window with the app open
        if (client.url.includes('/online-consultation') || client.url.includes('/video-consultation')) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close (for analytics/cleanup if needed)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed by user');
});

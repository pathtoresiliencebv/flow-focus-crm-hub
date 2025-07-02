// Service Worker for push notifications and offline support
const CACHE_NAME = 'flow-focus-crm-v1';
const STATIC_CACHE = 'static-v1';

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico'
        ]);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Take control of all pages
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If we're offline, return a basic offline page
            if (event.request.destination === 'document') {
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>Offline - Flow Focus CRM</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: system-ui, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      color: #333;
                    }
                    .offline-icon { 
                      font-size: 48px; 
                      margin-bottom: 20px; 
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-icon">📡</div>
                  <h1>Je bent offline</h1>
                  <p>Check je internetverbinding en probeer opnieuw.</p>
                  <button onclick="window.location.reload()">Opnieuw proberen</button>
                </body>
                </html>`,
                {
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                  },
                }
              );
            }
            
            // For other requests, just fail
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let notificationData = {
    title: 'Flow Focus CRM',
    body: 'Je hebt een nieuwe melding',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Openen'
      },
      {
        action: 'close',
        title: 'Sluiten'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync functions
async function syncMessages() {
  console.log('Syncing offline messages...');
  
  try {
    // Open IndexedDB to get pending messages
    const db = await openOfflineDB();
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const allMessages = await getAllFromStore(store);
    const pendingMessages = allMessages.filter(msg => !msg.synced);
    
    if (pendingMessages.length === 0) {
      console.log('No pending messages to sync');
      return;
    }
    
    console.log(`Found ${pendingMessages.length} pending messages to sync`);
    
    // Send to message-sync edge function
    const response = await fetch('/functions/v1/message-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getStoredAuthToken()}`
      },
      body: JSON.stringify({ messages: pendingMessages })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`Sync complete: ${result.synced_count} synced, ${result.failed_count} failed`);
      
      // Update local database
      const updateTransaction = db.transaction(['messages'], 'readwrite');
      const updateStore = updateTransaction.objectStore('messages');
      
      for (const syncResult of result.results) {
        if (syncResult.success) {
          const msg = pendingMessages.find(m => m.temp_id === syncResult.temp_id);
          if (msg) {
            msg.synced = true;
            await putInStore(updateStore, msg);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error syncing messages:', error);
  }
}

async function syncNotifications() {
  console.log('Syncing notifications...');
  // Implementation for syncing notifications
}

// Helper functions for IndexedDB
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-chat', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function putInStore(store, data) {
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getStoredAuthToken() {
  // Get auth token from localStorage or cache
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.token);
      };
      clients[0].postMessage({ type: 'GET_AUTH_TOKEN' }, [channel.port2]);
    });
  }
  return null;
}

// Message event - communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

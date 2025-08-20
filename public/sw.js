// Enhanced Service Worker for Flow Focus CRM
const CACHE_NAME = 'flow-focus-crm-v3-no-old-chat';
const STATIC_CACHE = 'static-v3';
const CHAT_MEDIA_CACHE = 'chat-media-v2';
const API_CACHE = 'api-cache-v2';

// Install event - cache static resources and initialize chat media cache
self.addEventListener('install', (event) => {
  console.log('Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico',
          '/icon-192.png',
          '/icon-512.png'
        ]);
      }),
      caches.open(CHAT_MEDIA_CACHE),
      caches.open(API_CACHE)
    ]).then(() => {
      console.log('Enhanced Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches and register for background sync
self.addEventListener('activate', (event) => {
  console.log('Enhanced Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Take control of all pages
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!['flow-focus-crm-v3-no-old-chat', 'static-v3', 'chat-media-v2', 'api-cache-v2'].includes(cacheName)) {
              console.log('Deleting old cache including old chat components:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initialize notification system
      initializeNotificationSystem()
    ])
  );
});

// Enhanced fetch event with smart caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (except Supabase)
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(handleFetchWithCaching(event.request));
});

async function handleFetchWithCaching(request) {
  const url = new URL(request.url);
  
  try {
    // Chat media files (images, videos, audio)
    if (isChatMediaRequest(request)) {
      return handleChatMediaRequest(request);
    }
    
    // API requests
    if (isAPIRequest(request)) {
      return handleAPIRequest(request);
    }
    
    // Static assets
    if (isStaticAssetRequest(request)) {
      return handleStaticAssetRequest(request);
    }
    
    // Default handling for other requests
    return handleDefaultRequest(request);
  } catch (error) {
    console.error('Fetch error:', error);
    return handleOfflineResponse(request);
  }
}

function isChatMediaRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/storage/v1/object/') || 
         request.url.includes('chat-files') ||
         /\.(jpg|jpeg|png|gif|webp|mp4|webm|mp3|wav|ogg)$/i.test(url.pathname);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/rest/v1/') || 
         url.pathname.startsWith('/functions/v1/') ||
         url.hostname.includes('supabase.co');
}

function isStaticAssetRequest(request) {
  const url = new URL(request.url);
  return /\.(js|css|html|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf)$/i.test(url.pathname);
}

async function handleChatMediaRequest(request) {
  const cache = await caches.open(CHAT_MEDIA_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still fresh (7 days for media)
    const cacheDate = new Date(cachedResponse.headers.get('date'));
    const now = new Date();
    const daysSinceCached = (now - cacheDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCached < 7) {
      return cachedResponse;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Only cache successful GET requests for specific endpoints
    if (response.ok && shouldCacheAPIResponse(request)) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

function shouldCacheAPIResponse(request) {
  const url = new URL(request.url);
  // Cache profile data and static configuration
  return url.pathname.includes('/profiles') || 
         url.pathname.includes('/notification_templates') ||
         url.pathname.includes('/quote_settings');
}

async function handleStaticAssetRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const responseToCache = response.clone();
    await cache.put(request, responseToCache);
  }
  
  return response;
}

function handleOfflineResponse(request) {
  if (request.destination === 'document') {
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
            background: #f5f5f5;
          }
          .offline-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            margin: 0 auto;
          }
          .offline-icon { 
            font-size: 48px; 
            margin-bottom: 20px; 
          }
          button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>Je bent offline</h1>
          <p>Geen internetverbinding beschikbaar. Chat berichten worden gesynchroniseerd zodra je weer online bent.</p>
          <button onclick="window.location.reload()">Opnieuw proberen</button>
        </div>
      </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
  
  return new Response('Service tijdelijk niet beschikbaar', { 
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    }
  });
}

// Enhanced push event - handle push notifications with smart routing
self.addEventListener('push', (event) => {
  console.log('Enhanced push notification received:', event);

  let notificationData = {
    title: 'Flow Focus CRM',
    body: 'Je hebt een nieuwe melding',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Bekijken',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Sluiten'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      
      // Enhanced notification data based on message type
      if (pushData.type === 'chat_message') {
        notificationData = {
          ...notificationData,
          title: `Nieuw bericht van ${pushData.sender_name || 'Onbekend'}`,
          body: pushData.content || 'Nieuw bericht ontvangen',
          tag: `chat-${pushData.channel_id}`,
          data: {
            url: `/chat?channel=${pushData.channel_id}`,
            type: 'chat_message',
            channel_id: pushData.channel_id,
            message_id: pushData.message_id,
            timestamp: Date.now()
          },
          actions: [
            {
              action: 'open_chat',
              title: 'Chat openen',
              icon: '/icon-192.png'
            },
            {
              action: 'mark_read',
              title: 'Markeer gelezen'
            },
            {
              action: 'dismiss',
              title: 'Sluiten'
            }
          ]
        };
      } else if (pushData.type === 'project_update') {
        notificationData = {
          ...notificationData,
          title: 'Project Update',
          body: pushData.content || 'Project is bijgewerkt',
          tag: `project-${pushData.project_id}`,
          data: {
            url: `/projects/${pushData.project_id}`,
            type: 'project_update',
            project_id: pushData.project_id,
            timestamp: Date.now()
          }
        };
      } else {
        // General notification
        notificationData = { 
          ...notificationData, 
          ...pushData,
          data: {
            ...notificationData.data,
            ...pushData.data
          }
        };
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || 'Nieuwe melding ontvangen';
    }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, notificationData),
      updateNotificationBadge(),
      logNotificationReceived(notificationData)
    ])
  );
});

// Initialize notification system
async function initializeNotificationSystem() {
  console.log('Initializing enhanced notification system...');
  
  // Set up periodic badge update
  if ('setAppBadge' in navigator) {
    try {
      await updateNotificationBadge();
    } catch (error) {
      console.log('App badge not supported:', error);
    }
  }
}

// Update app badge with unread count
async function updateNotificationBadge() {
  try {
    if ('setAppBadge' in navigator) {
      // Get unread count from local storage or default to 0
      const unreadCount = await getUnreadMessageCount();
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount);
      } else {
        navigator.clearAppBadge();
      }
    }
  } catch (error) {
    console.error('Error updating app badge:', error);
  }
}

// Get unread message count
async function getUnreadMessageCount() {
  try {
    // Try to get from IndexedDB first
    const db = await openOfflineDB();
    if (db) {
      // Implementation would count unread messages
      return 0; // Placeholder
    }
    return 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Log notification for analytics
async function logNotificationReceived(notificationData) {
  try {
    console.log('Notification logged:', {
      type: notificationData.data?.type || 'unknown',
      timestamp: Date.now(),
      title: notificationData.title
    });
    
    // Could store in IndexedDB for analytics
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

// Enhanced notification click event with smart routing
self.addEventListener('notificationclick', (event) => {
  console.log('Enhanced notification clicked:', event);

  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return;
  }

  if (event.action === 'mark_read') {
    event.waitUntil(markNotificationAsRead(event.notification.data));
    return;
  }

  // Determine target URL based on notification data
  const targetUrl = event.notification.data?.url || '/';
  
  // Handle notification click
  event.waitUntil(
    handleNotificationNavigation(targetUrl, event.notification.data)
  );
});

async function handleNotificationNavigation(targetUrl, notificationData) {
  try {
    const clientList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    // If a window is already open, navigate it to the target URL
    for (const client of clientList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        
        // Send message to navigate to specific URL
        client.postMessage({
          type: 'NAVIGATE_TO_URL',
          url: targetUrl,
          notificationData: notificationData
        });
        
        await updateNotificationBadge();
        return;
      }
    }
    
    // Otherwise, open a new window with the target URL
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
      await updateNotificationBadge();
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
    // Fallback to opening root
    if (self.clients.openWindow) {
      await self.clients.openWindow('/');
    }
  }
}

async function markNotificationAsRead(notificationData) {
  try {
    console.log('Marking notification as read:', notificationData);
    
    if (notificationData?.type === 'chat_message' && notificationData?.message_id) {
      // Send message to main app to mark as read
      const clientList = await self.clients.matchAll({ type: 'window' });
      clientList.forEach(client => {
        client.postMessage({
          type: 'MARK_MESSAGE_READ',
          messageId: notificationData.message_id,
          channelId: notificationData.channel_id
        });
      });
    }
    
    await updateNotificationBadge();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

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

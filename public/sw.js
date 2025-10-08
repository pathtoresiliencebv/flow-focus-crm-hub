// Minimal Service Worker - No aggressive caching
const CACHE_NAME = 'flow-focus-crm-minimal-v1';

// Install event - just skip waiting
self.addEventListener('install', (event) => {
  console.log('Minimal Service Worker installing...');
  self.skipWaiting();
});

// Activate event - cleanup and take control
self.addEventListener('activate', (event) => {
  console.log('Minimal Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});

// Fetch event - NO caching, just pass through
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Just fetch, no caching
  event.respondWith(fetch(event.request));
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

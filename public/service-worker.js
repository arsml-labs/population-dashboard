// Service Worker for Cache Busting
// This automatically clears old cached files when new version is deployed

const CACHE_VERSION = 'v20260909-1'; // Update this when deploying new code
const CACHE_NAME = `dashboard-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// Install: Cache assets
self.addEventListener('install', event => {
  console.log(`[Service Worker] Installing ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('[Service Worker] Cache add error:', err);
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating and cleaning old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch: Always try network first, fall back to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls - let them go through normally
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For HTML and assets: network-first strategy with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Don't cache if not successful
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone and cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] Serving from cache:', request.url);
            return cachedResponse;
          }

          // Return offline page if both fail
          if (request.destination === 'document') {
            return new Response('No internet connection and no cached version available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          }
        });
      })
  );
});

// Message handler for cache clearing
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Received clear cache message');
    caches.delete(CACHE_NAME).then(() => {
      console.log(`[Service Worker] Cleared cache: ${CACHE_NAME}`);
      // Tell all clients to reload
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      });
    });
  }
});

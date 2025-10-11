// SERVICE WORKER TEMPORARILY DISABLED TO FIX DEMO USER CACHING ISSUE
console.log('🚫 Service Worker loaded - DISABLED for debugging');

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🚫 Service Worker install - DISABLED');
  // Skip waiting to prevent caching
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('🚫 Service Worker activate - DISABLED');
  // Clear all caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch from network only (no caching)
self.addEventListener('fetch', (event) => {
  // Always fetch from network, never from cache
  console.log('🌐 Service Worker fetch - bypassing cache for:', event.request.url);
  event.respondWith(
    fetch(event.request)
  );
});
// Service Worker for Word Clash PWA
const CACHE_NAME = 'word-clash-v2';
const DICTIONARY_CACHE = 'word-clash-dictionary-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
            .catch((error) => {
              console.log('Cache addAll error:', error);
            });
        }),
      // Don't cache dictionary during install - it will be cached on demand
    ])
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Special handling for dictionary endpoint
  if (url.pathname === '/api/dictionary') {
    event.respondWith(
      caches.open(DICTIONARY_CACHE).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Normal caching strategy for other resources
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DICTIONARY_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle messages from client for dictionary operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_DICTIONARY') {
    // Check if dictionary is cached
    caches.open(DICTIONARY_CACHE).then((cache) => {
      const dictionaryUrl = event.data.url || `${self.location.origin}/api/dictionary`;
      cache.match(dictionaryUrl).then((response) => {
        event.ports[0].postMessage({
          cached: !!response
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'LOAD_DICTIONARY') {
    // Force load and cache dictionary
    const dictionaryUrl = event.data.url || `${self.location.origin}/api/dictionary`;
    
    caches.open(DICTIONARY_CACHE).then((cache) => {
      fetch(dictionaryUrl).then((response) => {
        if (response.ok) {
          cache.put(dictionaryUrl, response.clone());
          event.ports[0].postMessage({
            success: true,
            message: 'Dictionary cached successfully'
          });
        } else {
          event.ports[0].postMessage({
            success: false,
            message: 'Failed to fetch dictionary'
          });
        }
      }).catch((error) => {
        event.ports[0].postMessage({
          success: false,
          message: error.message
        });
      });
    });
  }
});

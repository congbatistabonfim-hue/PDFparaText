const CACHE_NAME = 'pdf-extractor-pro-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(err => {
        console.error('Failed to pre-cache app shell:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // We only want to handle GET requests.
  if (request.method !== 'GET') {
    return;
  }
  
  const url = new URL(request.url);

  // Don't try to cache non-local assets (e.g., APIs, CDNs)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Don't cache blob URLs from file generation
  if (request.url.startsWith('blob:')) {
      return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get the response from the cache first.
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If it's not in the cache, fetch it from the network.
      try {
        const networkResponse = await fetch(request);

        // If the fetch was successful, clone the response and store it in the cache.
        if (networkResponse && networkResponse.ok) {
          // Make sure to not cache Chrome extension requests.
          if (!request.url.startsWith('chrome-extension://')) {
            cache.put(request, networkResponse.clone());
          }
        }
        
        return networkResponse;
      } catch (error) {
        console.error('Fetch failed; returning offline fallback or error', error);
        // This will happen if the network request fails, e.g., the user is offline.
        // Let the default browser error occur.
        throw error;
      }
    })
  );
});


self.addEventListener('activate', event => {
  // This event fires when the new service worker takes control.
  // It's a good place to clean up old caches.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not on the whitelist, delete it.
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
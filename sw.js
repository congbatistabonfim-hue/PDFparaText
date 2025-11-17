const CACHE_NAME = 'pdf-extractor-pro-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/icon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Pre-caching the app shell and main assets.
        // Network requests for other assets will be cached on the fly.
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(err => {
        console.error('Failed to pre-cache app shell:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get the response from the cache first.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // If it's not in the cache, fetch it from the network.
      try {
        const networkResponse = await fetch(event.request);

        // If the fetch was successful, clone the response and store it in the cache.
        // We only cache successful responses to avoid caching errors.
        if (networkResponse && networkResponse.ok) {
          // Make sure to not cache Chrome extension requests.
          if (!event.request.url.startsWith('chrome-extension://')) {
            cache.put(event.request, networkResponse.clone());
          }
        }
        
        return networkResponse;
      } catch (error) {
        // This will happen if the network request fails, e.g., the user is offline.
        // Since we already checked the cache, this means the resource is not available.
        console.error('Fetch failed; returning offline fallback or error', error);
        // You could return a custom offline page here if you had one cached.
        // For example: return caches.match('/offline.html');
        // For now, we'll just let the default browser error occur.
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

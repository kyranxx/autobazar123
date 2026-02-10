const CACHE_VERSION = 'v2';
const CACHE_NAME = `autobazar123-${CACHE_VERSION}`;

const URLS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - network only
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Assets - cache first
  if (
    request.url.includes('/_next/') ||
    request.url.includes('/fonts/') ||
    request.url.match(/\.(js|css|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // HTML pages - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache or offline page
        return caches.match(request).then((response) => {
          return response || caches.match('/offline.html');
        });
      })
  );
});

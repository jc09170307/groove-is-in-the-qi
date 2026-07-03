// Groove Is in the Qi — Service Worker v2
const CACHE = 'groove-qi-v2';

// Install — skip precaching, just activate
self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Last resort for navigation
          if (e.request.mode === 'navigate') {
            return caches.match('/groove-is-in-the-qi/index.html');
          }
        });
      })
  );
});

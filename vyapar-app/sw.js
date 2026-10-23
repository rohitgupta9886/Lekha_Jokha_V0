// ==============================================================================
// LekhaJokha - Production Service Worker & Offline-First Cache Engine
// Enables Instant Sub-100ms Boot Time, Offline Billing, and Background Sync
// ==============================================================================

const CACHE_NAME = 'lekha-jokha-cache-v18';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/mobile.css',
  '/assets/app-logo.png',
  '/assets/logo.svg',
  '/assets/logo-icon.svg',
  '/assets/favicon.svg',
  '/js/data.js',
  '/js/i18n.js',
  '/js/storage/indexed_db.js',
  '/js/modules/invoice_print.js',
  '/js/modules/barcode.js',
  '/js/modules/eway.js',
  '/js/modules/users.js',
  '/js/modules/ai_copilot.js',
  '/js/modules/dashboard.js',
  '/js/modules/sales.js',
  '/js/modules/purchases.js',
  '/js/modules/parties.js',
  '/js/modules/items.js',
  '/js/modules/cashbank.js',
  '/js/modules/expenses.js',
  '/js/modules/reports.js',
  '/js/modules/settings.js',
  '/js/modules/app_settings.js',
  '/js/modules/subscription.js',
  '/js/modules/migration.js',
  '/js/modules/utilities.js',
  '/js/modules/orders.js',
  '/js/modules/salesmen_management.js',
  '/js/modules/salesman_app.js',
  '/js/app.js',
  '/manifest.json'
];

// Install: Pre-cache core application shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated cache versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate Strategy for maximum speed and freshest content
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Bypass API calls from cache (always fetch fresh or handle offline in IndexedDB)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, message: 'Offline mode active' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For CSS, JS, and HTML: Network-First (with cache fallback) so UI updates appear immediately
  const isCodeAsset = url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname === '/';
  
  if (isCodeAsset) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Other Static Assets (Images, Fonts): Cache First, fallback to Network
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        return networkResponse;
      });
    })
  );
});

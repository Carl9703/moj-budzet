const CACHE_NAME = 'moj-budzet-v1.0.0';
const urlsToCache = [
  '/',
  '/analytics',
  '/history',
  '/config',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    event.waitUntil(
      // Sync offline transactions when back online
      syncOfflineTransactions()
    );
  }
});

async function syncOfflineTransactions() {
  try {
    // Get offline transactions from IndexedDB
    const offlineTransactions = await getOfflineTransactions();
    
    for (const transaction of offlineTransactions) {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${transaction.token}`
          },
          body: JSON.stringify(transaction.data)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineTransaction(transaction.id);
      } catch (error) {
        console.log('Service Worker: Failed to sync transaction', error);
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}

// Helper functions for offline storage
async function getOfflineTransactions() {
  // This would integrate with IndexedDB
  return [];
}

async function removeOfflineTransaction(id) {
  // This would remove from IndexedDB
  return true;
}

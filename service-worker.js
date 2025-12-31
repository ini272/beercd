const CACHE_NAME = 'beercd-v4';
const urlsToCache = [
  'https://ini272.github.io/beercd/',
  'https://ini272.github.io/beercd/index.html',
  'https://ini272.github.io/beercd/style.css',
  'https://ini272.github.io/beercd/script.js',
  'https://ini272.github.io/beercd/manifest.json',
  'https://ini272.github.io/beercd/icons/icon-192x192.png',
  'https://ini272.github.io/beercd/icons/icon-512x512.png'
];

// Install event - cache app files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Store scheduled notification end time
let scheduledEndTime = null;

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduledEndTime = event.data.endTime;
    const now = Date.now();
    const delay = event.data.endTime - now;
    
    if (delay > 0) {
      // Schedule notification for when timer expires
      // Use a reasonable timeout (max 24 hours for setTimeout reliability)
      const maxDelay = 24 * 60 * 60 * 1000; // 24 hours
      const actualDelay = Math.min(delay, maxDelay);
      
      setTimeout(() => {
        checkAndShowNotification();
      }, actualDelay);
    }
  }
});

// Check if timer has expired and show notification
function checkAndShowNotification() {
  if (!scheduledEndTime) return;
  
  const now = Date.now();
  if (now >= scheduledEndTime) {
    self.registration.showNotification('🍺 BeerCD - Cooldown Complete!', {
      body: 'Your cooldown timer has finished.',
      icon: 'https://ini272.github.io/beercd/icons/icon-192x192.png',
      badge: 'https://ini272.github.io/beercd/icons/icon-192x192.png',
      tag: 'beercd-cooldown-complete',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
    scheduledEndTime = null; // Clear after showing
  }
}

// Periodic check (every 5 minutes) as backup
setInterval(() => {
  checkAndShowNotification();
}, 5 * 60 * 1000);

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('beercd') && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('https://ini272.github.io/beercd/');
        }
      })
  );
});


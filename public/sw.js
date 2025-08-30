// Enhanced service worker with improved notification handling and caching strategies
// This service worker ensures notifications are delivered reliably without requiring site reloads

// Import Firebase libraries for messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Cache name for app shell and dynamic content
const CACHE_NAME = 'fund-flow-cache-v1-30082025-02';
const DYNAMIC_CACHE = 'fund-flow-dynamic-cache-v1-30082025-02';

// Resources to cache immediately (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-512x512.png',
  '/logo.png',
  '/favicon.ico'
];

// Initialize Firebase with your config only if it's not already initialized
let messaging;
try {
  // Try to get the existing Firebase app
  messaging = firebase.messaging();
} catch (e) {
  // If it fails, initialize Firebase with the complete config
  const firebaseConfig = {
    apiKey: "AIzaSyAQM_Tb6Ihjf6nJzKbiuE0RQglUOkvSHuA",
    authDomain: "jadeg-money.firebaseapp.com",
    projectId: "jadeg-money",
    storageBucket: "jadeg-money.firebasestorage.app",
    messagingSenderId: "851428868473",
    appId: "1:851428868473:web:cb6fb3fd76aae79eb1efa8"
  };
  
  console.log('Initializing Firebase in service worker with config:', firebaseConfig);
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();
}

// Handle background messages from FCM with improved reliability
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  // Extract notification data with fallbacks for all properties
  const notificationTitle = payload.notification?.title || 'Để Tui Trả Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification from Để Tui Trả',
    icon: payload.notification?.icon || '/pwa-512x512.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    tag: payload.data?.notificationId || `notification-${Date.now()}`, // Use tag to prevent duplicate notifications
    renotify: true, // Always notify the user even if a notification with the same tag exists
    requireInteraction: true, // Keep the notification visible until the user interacts with it
    data: {
      url: payload.data?.url || '/',
      notificationId: payload.data?.notificationId,
      fundId: payload.data?.fundId,
      transactionId: payload.data?.transactionId,
      timestamp: payload.data?.timestamp || Date.now(),
      ...payload.data
    }
  };
  
  // Show the notification and ensure it's delivered
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('Notification shown successfully');
      // Broadcast message to client to update UI if app is open
      self.clients.matchAll({type: 'window', includeUncontrolled: true})
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NEW_NOTIFICATION',
              payload: payload
            });
          });
        });
    })
    .catch(error => {
      console.error('Error showing notification:', error);
    });
});

// Handle regular push notifications (Web Push API) with improved reliability
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const notificationId = data.notificationId || `push-${Date.now()}`;
      
      const options = {
        body: data.body || 'New notification from Để Tui Trả',
        icon: data.icon || '/pwa-512x512.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        tag: notificationId, // Use tag to prevent duplicate notifications
        renotify: true, // Always notify the user even if a notification with the same tag exists
        requireInteraction: true, // Keep the notification visible until the user interacts with it
        data: {
          url: data.url || '/',
          notificationId: notificationId,
          fundId: data.fundId,
          transactionId: data.transactionId,
          timestamp: data.timestamp || Date.now(),
          ...data
        }
      };

      event.waitUntil(
        Promise.all([
          // Show the notification
          self.registration.showNotification(data.title || 'Để Tui Trả Notification', options),
          
          // Broadcast message to client to update UI if app is open
          self.clients.matchAll({type: 'window', includeUncontrolled: true})
            .then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'NEW_NOTIFICATION',
                  payload: data
                });
              });
            })
        ])
      );
    } catch (error) {
      console.error('Error processing push notification:', error);
      // Fallback for text messages
      const options = {
        body: event.data.text() || 'New notification from Để Tui Trả',
        icon: '/pwa-512x512.png',
        badge: '/logo.png',
        tag: `fallback-${Date.now()}`,
        requireInteraction: true
      };
      
      event.waitUntil(
        self.registration.showNotification('Để Tui Trả Notification', options)
      );
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  // Add fund and transaction IDs to URL if available
  const fundId = data.fundId || '';
  const transactionId = data.transactionId || '';
  
  let targetUrl = url;
  if (fundId && !url.includes(fundId)) {
    targetUrl = `/funds/${fundId}`;
    if (transactionId) {
      targetUrl += `?transaction=${transactionId}`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Install event - cache app shell for offline use and faster loading
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] App Shell Cached');
        return self.skipWaiting(); // Ensure the new service worker activates immediately
      })
      .catch(error => {
        console.error('[Service Worker] Cache Error:', error);
      })
  );
});

// Activate event - clean up old caches and take control of all clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then(keyList => {
          return Promise.all(keyList.map(key => {
            if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
              console.log('[Service Worker] Removing old cache', key);
              return caches.delete(key);
            }
          }));
        }),
      // Take control of all clients
      self.clients.claim(),
      // Broadcast activation message
      self.clients.matchAll({type: 'window', includeUncontrolled: true})
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_ACTIVATED',
              timestamp: Date.now()
            });
          });
        })
    ])
  );
});

// Fetch event - implement cache-first strategy for assets and network-first for API calls
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and Firebase API calls
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  // For HTML pages, use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of the response
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the response for future use
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, clonedResponse));
            return response;
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_FOR_NOTIFICATIONS') {
    // Broadcast to client that service worker is ready to receive notifications
    event.ports[0].postMessage({
      type: 'NOTIFICATION_READY',
      timestamp: Date.now()
    });
  }
});

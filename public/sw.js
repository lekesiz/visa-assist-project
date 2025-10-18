/**
 * Service Worker for Visa Assist Application
 * Implements caching strategies for improved performance
 */

const CACHE_NAME = 'visa-assist-v1';
const STATIC_CACHE_NAME = 'visa-assist-static-v1';
const API_CACHE_NAME = 'visa-assist-api-v1';
const IMAGE_CACHE_NAME = 'visa-assist-images-v1';

// Cache configuration
const CACHE_CONFIG = {
  static: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    maxEntries: 100
  },
  api: {
    maxAge: 60 * 5, // 5 minutes
    maxEntries: 50,
    staleWhileRevalidate: 60 * 30 // 30 minutes
  },
  images: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    maxEntries: 200
  }
};

// Files to precache
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/about',
  '/contact',
  '/faq',
  '/pricing',
  '/privacy',
  '/terms',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// API endpoints to cache
const API_PATTERNS = [
  /^\/api\/countries/,
  /^\/api\/health/,
  /^\/api\/applications$/,
  /^\/api\/appointments\/available-slots/
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  /^\/images\//,
  /^\/icons\//,
  /^\/logos\//
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        
        // Cache static assets with error handling
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(`Failed to cache ${url}:`, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('Static assets cached successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('Failed to install service worker:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('visa-assist-') && 
          !name.includes('v1')
        );
        
        await Promise.all(
          oldCaches.map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
        );
        
        // Claim all clients
        await clients.claim();
        console.log('Service Worker activated successfully');
      } catch (error) {
        console.error('Failed to activate service worker:', error);
      }
    })()
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip caching for certain requests
  if (shouldSkipCaching(request)) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Determine caching strategy based on request type
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API requests - stale-while-revalidate
    if (isAPIRequest(url.pathname)) {
      return await handleAPIRequest(request);
    }
    
    // Image requests - cache first
    if (isImageRequest(url.pathname)) {
      return await handleImageRequest(request);
    }
    
    // Static assets - cache first with network fallback
    if (isStaticAsset(url.pathname)) {
      return await handleStaticRequest(request);
    }
    
    // Navigation requests - network first with cache fallback
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // Default - network first
    return await fetch(request);
    
  } catch (error) {
    console.error('Request handling failed:', error);
    return await handleErrorResponse(request);
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Network first for fresh data
  const networkPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      // Cache successful responses
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    return response;
  });
  
  try {
    // Try network first
    const networkResponse = await Promise.race([
      networkPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 3000)
      )
    ]);
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    if (cachedResponse) {
      console.log('Using cached API response due to network error');
      
      // Trigger background revalidation
      networkPromise.catch(() => {
        console.warn('Background revalidation failed for:', request.url);
      });
      
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch image:', request.url, error);
    return new Response('Image not available', { status: 404 });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url, error);
    return await handleErrorResponse(request);
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cached version
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    return await cache.match('/') || new Response('Page not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle error responses
async function handleErrorResponse(request) {
  // Try to serve from any cache
  const cacheNames = [STATIC_CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Return generic error response
  return new Response('Content not available', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Helper functions
function shouldSkipCaching(request) {
  const url = new URL(request.url);
  
  // Skip authentication endpoints
  if (url.pathname.includes('/auth/')) {
    return true;
  }
  
  // Skip POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return true;
  }
  
  // Skip requests with authentication headers
  if (request.headers.get('authorization')) {
    return true;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return true;
  }
  
  return false;
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/') && 
         API_PATTERNS.some(pattern => pattern.test(pathname));
}

function isImageRequest(pathname) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(pathname));
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/images/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.map');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('Performing background sync...');
  
  try {
    // Retry failed API requests stored in IndexedDB
    // This would be implemented with your specific retry logic
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag || 'default',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false
      })
    );
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(data.url || '/dashboard')) {
          client.focus();
          return;
        }
      }
      
      // Open new window
      clients.openWindow(data.url || '/dashboard');
    })()
  );
});

// Cache size management
async function manageCacheSize() {
  const caches = await caches.keys();
  
  for (const cacheName of caches) {
    if (cacheName.startsWith('visa-assist-')) {
      await trimCache(cacheName);
    }
  }
}

async function trimCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  let maxEntries;
  if (cacheName.includes('static')) {
    maxEntries = CACHE_CONFIG.static.maxEntries;
  } else if (cacheName.includes('api')) {
    maxEntries = CACHE_CONFIG.api.maxEntries;
  } else if (cacheName.includes('images')) {
    maxEntries = CACHE_CONFIG.images.maxEntries;
  } else {
    return;
  }
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Periodic cache cleanup
setInterval(manageCacheSize, 60 * 60 * 1000); // Every hour
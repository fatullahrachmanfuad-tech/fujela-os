const CACHE_NAME = 'fujela-os-v1';

// Event Install
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    self.skipWaiting();
});

// Event Activate
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});

// Event Fetch (Sederhana untuk memicu validitas PWA)
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request).catch(() => {
        return new Response('Koneksi internet terputus.', { status: 503 });
    }));
});
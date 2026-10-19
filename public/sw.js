// Minimal service worker: makes the app installable and shows an offline fallback for page loads.
// API calls and other cross-origin requests are never cached.
const CACHE = 'minibook-v1'
const SHELL = ['/', '/favicon.svg', '/pwa-192.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    // network first, fall back to cached shell when offline
    e.respondWith(fetch(req).catch(() => caches.match('/')))
  }
})

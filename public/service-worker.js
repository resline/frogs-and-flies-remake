const PWA_CACHE_NAME = 'frogs-and-flies-m26-v2'

const APP_SHELL_CACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.png',
  '/assets/home-pond-background.png',
  '/assets/lily-left.png',
  '/assets/lily-right.png',
  '/assets/frog-p1-idle.png',
  '/assets/frog-p1-crouch.png',
  '/assets/frog-p1-airborne.png',
  '/assets/frog-p1-tongue.png',
  '/assets/frog-p1-splash.png',
  '/assets/frog-p2-idle.png',
  '/assets/frog-p2-crouch.png',
  '/assets/frog-p2-airborne.png',
  '/assets/frog-p2-tongue.png',
  '/assets/frog-p2-splash.png',
  '/assets/fly-wing-a.png',
  '/assets/fly-wing-b.png',
  '/assets/firefly-end.png',
  '/assets/splash-ring.png',
  '/assets/catch-pop.png',
  '/assets/tongue-flash.png',
  '/assets/pond-arena.png',
  '/assets/frog.png',
  '/assets/fly.png',
  '/assets/power.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PWA_CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_CACHE_URLS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((cacheName) => cacheName !== PWA_CACHE_NAME).map((cacheName) => caches.delete(cacheName))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  if (isRuntimeCacheableRequest(request, url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(fetch(request).catch(() => caches.match(request).then((response) => response ?? caches.match('/'))))
})

function cacheFirst(request) {
  return caches.match(request, { ignoreVary: true }).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse
    }

    return fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone()
        caches.open(PWA_CACHE_NAME).then((cache) => cache.put(request, copy))
      }
      return response
    })
  })
}

function isImmutableAssetPath(pathname) {
  return pathname.startsWith('/assets/') || pathname === '/favicon.png'
}

function isRuntimeCacheableRequest(request, url) {
  if (url.origin !== self.location.origin) {
    return false
  }

  if (isImmutableAssetPath(url.pathname)) {
    return true
  }

  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    pathnameHasExtension(url.pathname, '.js') ||
    pathnameHasExtension(url.pathname, '.css')
  )
}

function pathnameHasExtension(pathname, extension) {
  return pathname.toLowerCase().endsWith(extension)
}

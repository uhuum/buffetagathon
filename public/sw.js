// Service Worker unico do Buffet Agathon: PWA + Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

const CACHE_NAME = 'agathon-static-v3'
const STATIC_ASSETS = ['/pwa-192.png', '/pwa-512.png', '/logo.png']
firebase.initializeApp({
  apiKey: 'AIzaSyBY_GavdUKo9XmMtK42c08NROTNEhfuQ7s',
  authDomain: 'buffet-agathonn.firebaseapp.com',
  projectId: 'buffet-agathonn',
  storageBucket: 'buffet-agathonn.firebasestorage.app',
  messagingSenderId: '190239501960',
  appId: '1:190239501960:web:4745a4749551e0c5e1b93d',
})
const messaging = firebase.messaging()

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {}))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
    self.clients.claim(),
  ]))
})
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// HTML, Next.js, APIs e Supabase: sempre rede. Cache somente de arquivos estaticos.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const dynamic = request.mode === 'navigate' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || url.hostname.includes('supabase')
  if (dynamic) return

  const isStatic = STATIC_ASSETS.includes(url.pathname) || /\.(png|jpg|jpeg|svg|ico|woff2?)$/i.test(url.pathname)
  if (!isStatic) return
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && url.origin === self.location.origin) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
    return response
  })))
})

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return
  self.registration.showNotification(payload.data?.title || 'Buffet Agathon', {
    body: payload.data?.body || 'Nova atualizacao disponivel',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: payload.data?.tag || payload.data?.type || 'agathon',
    renotify: true,
    data: payload.data || {},
  })
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const client = list.find((c) => new URL(c.url).origin === self.location.origin)
    if (client) { client.navigate?.(target); return client.focus() }
    return clients.openWindow(target)
  }))
})

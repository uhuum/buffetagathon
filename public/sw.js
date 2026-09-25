// Service Worker unico do Buffet Agathon: PWA + Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

const CACHE_NAME = 'agathon-cache-v2'
const APP_SHELL = ['/', '/manifest.webmanifest', '/pwa-192.png', '/pwa-512.png', '/logo.png']
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
    self.clients.claim(),
  ]))
})
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.hostname.includes('supabase')) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      return response
    }).catch(() => caches.match(request).then((cached) => cached || caches.match('/'))))
    return
  }
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response && response.status === 200 && url.origin === self.location.origin) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
      }
      return response
    }).catch(() => cached)
    return cached || network
  }))
})

messaging.onBackgroundMessage((payload) => {
  // Quando FCM envia "notification", o SDK ja pode exibi-la. So mostramos
  // manualmente mensagens data-only para impedir notificacoes duplicadas.
  if (payload.notification) return
  const title = payload.data?.title || 'Buffet Agathon'
  const options = {
    body: payload.data?.body || 'Nova atualizacao disponivel',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: payload.data?.tag || payload.data?.type || 'agathon',
    renotify: true,
    data: payload.data || {},
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const sameOrigin = list.find((client) => new URL(client.url).origin === self.location.origin)
    if (sameOrigin) {
      sameOrigin.navigate?.(target)
      return sameOrigin.focus()
    }
    return clients.openWindow(target)
  }))
})

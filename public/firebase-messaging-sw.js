// Firebase Messaging Service Worker
// Este arquivo é servido pelo Next.js e registrado automaticamente.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

// As variáveis de ambiente não estão disponíveis no service worker,
// então as configurações são injetadas em tempo de build via next.config.mjs
// ou lidas do self.__FIREBASE_CONFIG__ que é definido abaixo.
// Para simplificar, lemos a config do cabeçalho da página via postMessage
// ou carregamos diretamente as variáveis via query string no momento do registro.

// A configuração será injetada pelo componente FCMProvider via postMessage
let firebaseConfig = null

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    initFirebase()
  }
})

function initFirebase() {
  if (!firebaseConfig) return
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig)
  }

  const messaging = firebase.messaging()

  // Tratar mensagens em background (app fechado ou em segundo plano)
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Mensagem em background recebida:', payload)

    const notificationTitle = payload.notification?.title || 'Buffet Agathon'
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      data: payload.data || {},
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || 'buffet-agathon',
      renotify: true,
    }

    return self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

// Ao clicar na notificação, focar/abrir o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        return clients.openWindow('/')
      }),
  )
})

// Firebase Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')


firebase.initializeApp({
  apiKey: "AIzaSyBY_GavdUKo9XmMtK42c08NROTNEhfuQ7s",
  authDomain: "buffet-agathonn.firebaseapp.com",
  projectId: "buffet-agathonn",
  storageBucket: "buffet-agathonn.firebasestorage.app",
  messagingSenderId: "190239501960",
  appId: "1:190239501960:web:4745a4749551e0c5e1b93d"
})


const messaging = firebase.messaging()


messaging.onBackgroundMessage((payload) => {

  console.log(
    '[firebase-messaging-sw] Mensagem recebida:',
    payload
  )


  const notificationTitle =
    payload.notification?.title ||
    'Buffet Agathon'


  const notificationOptions = {

    body:
      payload.notification?.body ||
      'Nova notificação',

    icon: '/icon.svg',

    badge: '/icon.svg',

    data: payload.data || {},

    vibrate: [200,100,200],

    tag: 'buffet-agathon',

    renotify: true

  }


  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  )

})



self.addEventListener(
  'notificationclick',
  (event)=>{

    event.notification.close()

    event.waitUntil(

      clients.matchAll({
        type:'window',
        includeUncontrolled:true
      })
      .then((clientList)=>{

        if(clientList.length > 0){

          return clientList[0].focus()

        }

        return clients.openWindow('/')

      })

    )

  }
)
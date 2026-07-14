// Firebase Cloud Messaging Service Worker
// public/firebase-messaging-sw.js

importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js"
);


// Configuração PÚBLICA do Firebase
// Pode ficar no Service Worker.
// NÃO coloque aqui private_key, client_email ou qualquer chave de servidor.

const firebaseConfig = {
  apiKey: "AIzaSyBY_GavdUKo9XmMtK42c08NROTNEhfuQ7s",
  authDomain: "buffet-agathonn.firebaseapp.com",
  projectId: "buffet-agathonn",
  storageBucket: "buffet-agathonn.firebasestorage.app",
  messagingSenderId: "190239501960",
  appId: "1:190239501960:web:4745a4749551e0c5e1b93d"
};


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();


// Recebe notificações quando o site está em segundo plano
messaging.onBackgroundMessage((payload) => {

  console.log(
    "[firebase-messaging-sw] Mensagem recebida:",
    payload
  );


  const notificationTitle =
    payload.notification?.title || "Buffet Agathon";


  const notificationOptions = {

    body:
      payload.notification?.body ||
      "Nova atualização disponível",

    icon: "/pwa-192.png",

    badge: "/pwa-192.png",

    vibrate: [200, 100, 200],

    tag:
      payload.data?.tag ||
      "buffet-agathon",

    renotify: true,

    data:
      payload.data || {}

  };


  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );

});


// Clique na notificação
self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })

        .then((clientList) => {

          if (clientList.length > 0) {

            return clientList[0].focus();

          }


          return clients.openWindow("/");

        })

    );

  }
);
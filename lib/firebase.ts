import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicializa o Firebase uma única vez (evita duplicação em dev com HMR)
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

let messagingInstance: Messaging | null = null

/**
 * Retorna a instância do Firebase Messaging (apenas no browser).
 * Retorna null em SSR ou navegadores sem suporte.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null
  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp)
  }
  return messagingInstance
}

/**
 * Solicita permissão de notificação ao usuário e retorna o token FCM.
 * Retorna null se o usuário recusar ou se houver qualquer erro.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null
    if (!('Notification' in window)) {
      console.log('[FCM] Notificações não suportadas neste navegador.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[FCM] Permissão de notificação negada.')
      return null
    }

    const messaging = getFirebaseMessaging()
    if (!messaging) return null

    // Garantir que o Service Worker está registrado antes de pegar o token
    const registration = await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (token) {
      console.log('[FCM] Token FCM obtido com sucesso.')
      return token
    } else {
      console.log('[FCM] Nenhum token FCM disponível.')
      return null
    }
  } catch (error) {
    console.error('[FCM] Erro ao obter token FCM:', error)
    return null
  }
}

/**
 * Configura o listener para mensagens recebidas com o app em primeiro plano.
 */
export function setupForegroundMessageListener(
  callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void,
) {
  const messaging = getFirebaseMessaging()
  if (!messaging) return () => {}

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[FCM] Mensagem recebida em primeiro plano:', payload)
    const title = payload.notification?.title ?? 'Buffet Agathon'
    const body = payload.notification?.body ?? ''
    const data = payload.data as Record<string, string> | undefined
    callback({ title, body, data })
  })

  return unsubscribe
}

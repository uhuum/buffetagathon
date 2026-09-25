import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
let messagingInstance: Messaging | null = null

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!(await isSupported())) return null
  if (!messagingInstance) messagingInstance = getMessaging(firebaseApp)
  return messagingInstance
}

export async function ensureNotificationToken(registration: ServiceWorkerRegistration): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null
  const messaging = await getFirebaseMessaging()
  if (!messaging) return null
  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
}

export async function requestNotificationPermission(registration: ServiceWorkerRegistration): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted') return null
  return ensureNotificationToken(registration)
}

export async function setupForegroundMessageListener(callback: (payload: { title: string; body: string; data?: Record<string,string> }) => void) {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => callback({
    title: payload.notification?.title ?? payload.data?.title ?? 'Buffet Agathon',
    body: payload.notification?.body ?? payload.data?.body ?? '',
    data: payload.data as Record<string,string> | undefined,
  }))
}

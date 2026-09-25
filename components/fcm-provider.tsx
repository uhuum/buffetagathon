'use client'
import { useEffect, useRef } from 'react'
import { ensureNotificationToken, setupForegroundMessageListener } from '@/lib/firebase'
import { saveDeviceToken } from '@/lib/device-tokens-service'

export function FCMProvider() {
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    initialized.current = true
    let foregroundUnsubscribe: (() => void) | undefined

    const setup = async () => {
      try {
        // Um unico SW controla PWA e FCM. Remove o worker legado se ainda existir.
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const reg of registrations) {
          if (reg.active?.scriptURL.endsWith('/firebase-messaging-sw.js')) await reg.unregister()
        }
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        await registration.update().catch(() => {})
        await navigator.serviceWorker.ready

        // Nao abre popup de permissao automaticamente. Se o usuario ja autorizou,
        // renova/reativa silenciosamente o token em toda abertura.
        if ('Notification' in window && Notification.permission === 'granted') {
          const token = await ensureNotificationToken(registration)
          if (token) await saveDeviceToken(token)
        }

        foregroundUnsubscribe = await setupForegroundMessageListener(({ title, body }) => {
          // Evita duplicidade: em foreground usamos a notificacao local uma unica vez.
          if (Notification.permission === 'granted') {
            registration.showNotification(title, { body, icon: '/pwa-192.png', badge: '/pwa-192.png', tag: 'agathon-foreground' })
          }
        })
      } catch (err) {
        console.error('[Push] Falha na inicializacao:', err)
      }
    }
    setup()
    const onVisible = () => { if (document.visibilityState === 'visible') setup() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      foregroundUnsubscribe?.()
    }
  }, [])
  return null
}

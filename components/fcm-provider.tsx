'use client'

import { useEffect, useRef } from 'react'
import { requestNotificationPermission, setupForegroundMessageListener } from '@/lib/firebase'
import { saveDeviceToken } from '@/lib/device-tokens-service'

/**
 * FCMProvider registra o service worker do Firebase, solicita permissão
 * de notificação, obtém o token FCM e o salva no Supabase.
 * Deve ser montado uma única vez, dentro do AppProvider.
 */
export function FCMProvider() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const setup = async () => {
      try {
        // 1. Registrar o service worker do Firebase Messaging
        const swRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' },
        )
        console.log('[FCM] Service worker registrado:', swRegistration.scope)

        // 2. Enviar a configuração Firebase ao service worker via postMessage
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }

        const sendConfig = () => {
          if (swRegistration.active) {
            swRegistration.active.postMessage({ type: 'FIREBASE_CONFIG', config })
          }
        }

        if (swRegistration.active) {
          sendConfig()
        } else {
          swRegistration.addEventListener('updatefound', () => {
            const worker = swRegistration.installing
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'activated') sendConfig()
            })
          })
        }

        // 3. Solicitar permissão e obter token FCM
        const token = await requestNotificationPermission()
        if (token) {
          await saveDeviceToken(token)
        }

        // 4. Listener para mensagens em primeiro plano (exibe como notificação nativa)
        setupForegroundMessageListener(({ title, body }) => {
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/pwa-192.png',
              badge: '/pwa-192.png',
            })
          }
        })
      } catch (err) {
        console.error('[FCM] Erro na inicialização:', err)
      }
    }

    // Aguardar o app estar pronto
    if (document.readyState === 'complete') {
      setup()
    } else {
      window.addEventListener('load', setup, { once: true })
    }
  }, [])

  return null
}

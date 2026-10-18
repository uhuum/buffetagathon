'use client'
import { useEffect, useRef } from 'react'
import { useApp } from '@/lib/app-context'

type NativeWindow = Window & { __AGATHON_NATIVE_TOKEN?: string }

/** Registra o token FCM nativo no servidor apenas depois do login. */
export function NativePushProvider() {
  const { isLoggedIn } = useApp()
  const lastSaved = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !navigator.userAgent.includes('AgathonAndroid/')) return
    let cancelled = false

    const sync = async () => {
      const token = (window as NativeWindow).__AGATHON_NATIVE_TOKEN
      if (!token || lastSaved.current === token || cancelled) return
      try {
        const response = await fetch('/api/notifications/save-token', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            device_name: 'Agenda Agathon (Android)',
            browser: 'Android nativo',
            platform: 'android-native',
          }),
        })
        if (!response.ok) throw new Error('Falha no registro do token Android')
        if (!cancelled) lastSaved.current = token
      } catch (error) {
        console.error('[NativePush] Nao foi possivel registrar o dispositivo:', error)
      }
    }
    const onNative = () => { void sync() }
    window.addEventListener('agathon:native-token', onNative)
    window.addEventListener('focus', onNative)
    document.addEventListener('visibilitychange', onNative)
    void sync()

    return () => {
      cancelled = true
      window.removeEventListener('agathon:native-token', onNative)
      window.removeEventListener('focus', onNative)
      document.removeEventListener('visibilitychange', onNative)
    }
  }, [isLoggedIn])

  return null
}

'use client'
import { useEffect } from 'react'

// O registro do SW e feito pelo FCMProvider para garantir que PWA e push
// usem exatamente a mesma registration/scope.
export function ServiceWorkerRegister() {
  useEffect(() => {}, [])
  return null
}

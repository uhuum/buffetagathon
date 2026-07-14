import { createClient } from './supabase/client'

export interface DeviceToken {
  id: string
  created_at: string
  updated_at: string
  token: string
  user_id: string
  device_name: string | null
  browser: string | null
  platform: string | null
  last_seen: string
  is_active: boolean
}

/**
 * Detecta informações básicas do dispositivo/navegador atual.
 */
function detectDeviceInfo(): {
  device_name: string
  browser: string
  platform: string
} {
  const ua = navigator.userAgent
  const platform = navigator.platform || 'Desconhecido'

  let browser = 'Desconhecido'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  let device_name = 'Desktop'
  if (/Android/i.test(ua)) device_name = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) device_name = 'iOS'
  else if (/Windows/i.test(ua)) device_name = 'Windows'
  else if (/Mac/i.test(ua)) device_name = 'Mac'
  else if (/Linux/i.test(ua)) device_name = 'Linux'

  return { device_name, browser, platform }
}

/**
 * Salva ou atualiza o token FCM no Supabase via API Route (server-side).
 * Evita duplicação: se o token já existir, apenas atualiza o last_seen.
 */
export async function saveDeviceToken(token: string): Promise<void> {
  try {
    const deviceInfo = detectDeviceInfo()
    const response = await fetch('/api/notifications/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...deviceInfo }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao salvar token')
    }

    console.log('[DeviceToken] Token salvo/atualizado com sucesso.')
  } catch (err) {
    console.error('[DeviceToken] Erro ao salvar token FCM:', err)
  }
}

/**
 * Atualiza o last_seen do token atual (chamado no login/abertura do app).
 */
export async function updateTokenLastSeen(token: string): Promise<void> {
  try {
    await fetch('/api/notifications/update-last-seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  } catch (err) {
    console.error('[DeviceToken] Erro ao atualizar last_seen:', err)
  }
}

/**
 * Busca todos os device tokens (usado no painel admin).
 * Usa o cliente Supabase com service_role via API Route para não expor a service key.
 */
export async function fetchDeviceTokensAdmin(): Promise<DeviceToken[]> {
  const response = await fetch('/api/notifications/admin/tokens')
  if (!response.ok) throw new Error('Erro ao buscar tokens')
  return response.json()
}

/**
 * Remove um device token pelo ID.
 */
export async function removeDeviceToken(id: string): Promise<void> {
  const response = await fetch(`/api/notifications/admin/tokens/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Erro ao remover token')
}

/**
 * Envia uma notificação de teste para um token específico.
 */
export async function sendTestNotification(
  token: string,
  title: string,
  body: string,
): Promise<void> {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, title, body }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao enviar notificação')
  }
}

/**
 * Envia uma notificação para TODOS os tokens ativos.
 */
export async function sendNotificationToAll(title: string, body: string): Promise<void> {
  const response = await fetch('/api/notifications/send-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao enviar notificações')
  }
}

/**
 * Utilitário server-side para envio de notificações via Firebase Cloud Messaging
 * usando a HTTP v1 API (googleapis OAuth2).
 *
 * Requer as variáveis de ambiente:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

interface FCMMessage {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

interface FCMResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Gera um access token OAuth2 para a Firebase HTTP v1 API
 * usando JWT (sem dependências externas além do crypto nativo).
 */
async function getFirebaseAccessToken(): Promise<string> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Variáveis de ambiente Firebase ausentes: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  // Codificar JWT manualmente (header.payload.signature)
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const header = encode({ alg: 'RS256', typ: 'JWT' })
  const payloadB64 = encode(payload)
  const signingInput = `${header}.${payloadB64}`

  // Importar chave privada RSA
  const pemKey = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const keyBuffer = Buffer.from(pemKey, 'base64')
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    Buffer.from(signingInput),
  )

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`

  // Trocar JWT por access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text()
    throw new Error(`Erro ao obter access token Firebase: ${err}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token as string
}

/**
 * Envia uma notificação push para um único token FCM.
 */
export async function sendPushNotification({
  token,
  title,
  body,
  data,
  imageUrl,
}: FCMMessage): Promise<FCMResponse> {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID
    if (!projectId) throw new Error('FIREBASE_PROJECT_ID não configurado')

    const accessToken = await getFirebaseAccessToken()

    const message = {
      message: {
        token,
        notification: {
          title,
          body,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
        data: data ?? {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2d1154',
            sound: 'default',
          },
          priority: 'high' as const,
        },
        webpush: {
          notification: {
            icon: '/pwa-192.png',
            badge: '/pwa-192.png',
            vibrate: [200, 100, 200],
          },
          fcm_options: {
            link: '/',
          },
        },
      },
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorCode = errorData?.error?.details?.[0]?.errorCode
      console.error(`[FCM Server] Erro ao enviar para token ${token.slice(0, 20)}...:`, errorData)
      return { success: false, error: errorCode || errorData?.error?.message || 'Erro FCM' }
    }

    const result = await response.json()
    console.log(`[FCM Server] Notificação enviada: ${result.name}`)
    return { success: true, messageId: result.name }
  } catch (err) {
    console.error('[FCM Server] Erro inesperado:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Envia notificações para múltiplos tokens.
 * Retorna um resumo com quantidade de sucessos e falhas.
 */
export async function sendPushNotificationToMany(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ sent: number; failed: number; invalidTokens: string[] }> {
  let sent = 0
  let failed = 0
  const invalidTokens: string[] = []

  for (const token of tokens) {
    const result = await sendPushNotification({ token, title, body, data })
    if (result.success) {
      sent++
    } else {
      failed++
      // Tokens inválidos/expirados devem ser removidos do banco
      if (
        result.error === 'UNREGISTERED' ||
        result.error === 'INVALID_ARGUMENT' ||
        result.error === 'NOT_FOUND'
      ) {
        invalidTokens.push(token)
      }
    }
  }

  return { sent, failed, invalidTokens }
}

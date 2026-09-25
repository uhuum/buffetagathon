/**
 * Envio confiavel via Firebase Cloud Messaging HTTP v1.
 * - cache do OAuth para evitar gerar JWT por dispositivo
 * - retry exponencial para 429/5xx
 * - concorrencia controlada
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
  invalid?: boolean
  attempts: number
}
let cachedAccessToken: { token: string; expiresAt: number } | null = null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function getFirebaseAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) return cachedAccessToken.token
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!projectId || !clientEmail || !privateKey) throw new Error('Credenciais Firebase ausentes')

  const now = Math.floor(Date.now() / 1000)
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const signingInput = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })
  const pemKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '')
  const cryptoKey = await crypto.subtle.importKey('pkcs8', Buffer.from(pemKey, 'base64'), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(signingInput))
  const jwt = signingInput + '.' + Buffer.from(signature).toString('base64url')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!response.ok) throw new Error('Falha OAuth Firebase: ' + await response.text())
  const json = await response.json()
  cachedAccessToken = { token: json.access_token, expiresAt: Date.now() + (Number(json.expires_in || 3600) * 1000) }
  return cachedAccessToken.token
}

function parseError(payload: any): { code: string; invalid: boolean } {
  const detailCode = payload?.error?.details?.find?.((d: any) => d?.errorCode)?.errorCode
  const code = detailCode || payload?.error?.status || payload?.error?.message || 'FCM_ERROR'
  return { code, invalid: ['UNREGISTERED', 'INVALID_ARGUMENT', 'NOT_FOUND'].includes(code) }
}

export async function sendPushNotification({ token, title, body, data, imageUrl }: FCMMessage): Promise<FCMResponse> {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return { success: false, error: 'FIREBASE_PROJECT_ID ausente', attempts: 0 }
  let lastError = 'FCM_ERROR'
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const accessToken = await getFirebaseAccessToken()
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: {
          token,
          notification: { title, body, ...(imageUrl ? { image: imageUrl } : {}) },
          data: data ?? {},
          android: { priority: 'high', notification: { sound: 'default' } },
          webpush: {
            headers: { Urgency: 'high', TTL: '86400' },
            notification: { icon: '/pwa-192.png', badge: '/pwa-192.png', tag: data?.tag || data?.type || 'agathon', renotify: true },
            fcm_options: { link: data?.url || '/' },
          },
        }}),
      })
      if (response.ok) {
        const result = await response.json()
        return { success: true, messageId: result.name, attempts: attempt }
      }
      const payload = await response.json().catch(() => ({}))
      const parsed = parseError(payload)
      lastError = parsed.code
      if (parsed.invalid) return { success: false, error: parsed.code, invalid: true, attempts: attempt }
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) {
        return { success: false, error: parsed.code, attempts: attempt }
      }
      const retryAfter = Number(response.headers.get('retry-after'))
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** (attempt - 1), 8000))
    } catch (err) {
      lastError = String(err)
      if (attempt === 4) return { success: false, error: lastError, attempts: attempt }
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000))
    }
  }
  return { success: false, error: lastError, attempts: 4 }
}

export async function sendPushNotificationToMany(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  let sent = 0
  let failed = 0
  const invalidTokens: string[] = []
  const deliveries: Array<{ token: string; success: boolean; messageId?: string; error?: string; attempts: number }> = []
  const concurrency = 8
  for (let i = 0; i < tokens.length; i += concurrency) {
    const chunk = tokens.slice(i, i + concurrency)
    const results = await Promise.all(chunk.map(async (token) => ({ token, result: await sendPushNotification({ token, title, body, data }) })))
    for (const { token, result } of results) {
      if (result.success) sent++
      else {
        failed++
        if (result.invalid) invalidTokens.push(token)
      }
      deliveries.push({ token, success: result.success, messageId: result.messageId, error: result.error, attempts: result.attempts })
    }
  }
  return { sent, failed, invalidTokens, deliveries }
}

/**
 * Netlify Scheduled Function
 * Schedule: 0 21 * * *  (todos os dias às 18:00 BRT / 21:00 UTC)
 *
 * Delega para a API Route Next.js /api/cron/um-dia-antes.
 */
import type { Handler } from '@netlify/functions'

const handler: Handler = async () => {
  const baseUrl = process.env.URL
  if (!baseUrl) {
    console.error('[Netlify Cron] Variável URL não configurada.')
    return { statusCode: 500, body: 'Variável URL ausente.' }
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Netlify Cron] Variável CRON_SECRET não configurada.')
    return { statusCode: 500, body: 'Variável CRON_SECRET ausente.' }
  }

  const response = await fetch(`${baseUrl}/api/cron/um-dia-antes`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
  })

  const body = await response.text()
  console.log(`[Netlify Cron um-dia-antes] status=${response.status} body=${body}`)

  return { statusCode: response.status, body }
}

export { handler }

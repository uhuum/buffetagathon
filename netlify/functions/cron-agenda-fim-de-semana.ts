/**
 * Netlify Scheduled Function
 * Schedule: 0 12 * * 1  (toda segunda-feira às 09:00 BRT / 12:00 UTC)
 *
 * Delega para a API Route Next.js /api/cron/agenda-fim-de-semana, que contém
 * toda a lógica de negócio (busca de festas + envio FCM).
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

  const response = await fetch(`${baseUrl}/api/cron/agenda-fim-de-semana`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
  })

  const body = await response.text()
  console.log(`[Netlify Cron agenda-fim-de-semana] status=${response.status} body=${body}`)

  return { statusCode: response.status, body }
}

export { handler }

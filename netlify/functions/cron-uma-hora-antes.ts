/** Verifica a cada minuto; agendamento definido em netlify.toml. */
export default async () => {
  const baseUrl = Netlify.env.get('URL')
  const secret = Netlify.env.get('CRON_SECRET')
  if (!baseUrl || !secret) throw new Error('Configuração do cron ausente')
  const response = await fetch(`${baseUrl}/api/cron/uma-hora-antes`, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(25_000),
  })
  const body = await response.text()
  console.log(`[Netlify Cron uma-hora-antes] status=${response.status} body=${body}`)
  if (!response.ok) throw new Error(`Falha no cron: ${response.status}`)
}

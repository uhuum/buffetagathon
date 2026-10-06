/**
 * API Route chamada pela Netlify Scheduled Function `cron-agenda-fim-de-semana`.
 * Schedule: 0 12 * * 1  (toda segunda-feira às 09:00 BRT / 12:00 UTC)
 * Busca todas as festas cadastradas para o final de semana (sex, sáb, dom) e envia um resumo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

import { weekendRange } from '@/lib/notification-time'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { start, end } = weekendRange(new Date())

    // A agenda semanal deve contar TODAS as festas cadastradas para sex/sáb/dom.
    // Não filtramos por "concluida", pois esse status é operacional e não deve
    // fazer uma festa desaparecer do total da agenda do fim de semana.
    const { count, error: festasError } = await supabase
      .from('festas')
      .select('id', { count: 'exact', head: true })
      .gte('data', start)
      .lte('data', end)

    if (festasError) throw festasError
    if (count === null) throw new Error('Contagem de festas indisponível')
    if (request.nextUrl.searchParams.get('dry_run') === 'true' || count === 0) {
      return NextResponse.json({ success: true, festas: count, start, end, sent: 0 })
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    if (tokensError) throw tokensError
    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0, festas: count })

    const title = 'Agenda do final de semana'
    const body = `Esse final de semana tem ${count} festa${count === 1 ? '' : 's'}. Entre e confira!`

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'agenda_fim_de_semana',
      tag: `agenda_fim_de_semana:${start}`,
      ttl_seconds: '3600',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron agenda-fim-de-semana] ${count} festa(s), enviado para ${result.sent} dispositivos.`)
    return NextResponse.json({ success: true, sent: result.sent, festas: count, start, end })
  } catch (err) {
    console.error('[Cron agenda-fim-de-semana] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

/**
 * API Route chamada pela Netlify Scheduled Function `cron-agenda-fim-de-semana`.
 * Schedule: 0 12 * * 1  (toda segunda-feira às 09:00 BRT / 12:00 UTC)
 * Busca todas as festas cadastradas para o final de semana (sex, sáb, dom) e envia um resumo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

function getWeekendRange(): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date())

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const year = Number(get('year'))
  const month = Number(get('month'))
  const day = Number(get('day'))
  const weekday = get('weekday')
  const weekdayIndex: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }

  const currentDay = weekdayIndex[weekday]
  const daysUntilFriday = (5 - currentDay + 7) % 7
  const base = new Date(Date.UTC(year, month - 1, day))
  const friday = new Date(base)
  friday.setUTCDate(base.getUTCDate() + daysUntilFriday)
  const sunday = new Date(friday)
  sunday.setUTCDate(friday.getUTCDate() + 2)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(friday), end: fmt(sunday) }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const { start, end } = getWeekendRange()

    // A agenda semanal deve contar TODAS as festas cadastradas para sex/sáb/dom.
    // Não filtramos por "concluida", pois esse status é operacional e não deve
    // fazer uma festa desaparecer do total da agenda do fim de semana.
    const { data: festas, error: festasError } = await supabase
      .from('festas')
      .select('id, tema, data, horario')
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: true })

    if (festasError) throw festasError

    const count = new Set((festas ?? []).map((f: { id: string }) => f.id)).size
    if (count === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma festa no final de semana.' })
    }

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0, festas: count })

    const title = 'Agenda do final de semana'
    const body = `Esse final de semana tem ${count} festa${count === 1 ? '' : 's'}, não esqueça! Entre e confira mais detalhes.`

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'agenda_fim_de_semana',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron agenda-fim-de-semana] ${count} festa(s), enviado para ${result.sent} dispositivos.`)
    return NextResponse.json({ success: true, sent: result.sent, festas: count })
  } catch (err) {
    console.error('[Cron agenda-fim-de-semana] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

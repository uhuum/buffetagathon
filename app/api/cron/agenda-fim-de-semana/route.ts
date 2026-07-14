/**
 * API Route chamada pela Netlify Scheduled Function `cron-agenda-fim-de-semana`.
 * Schedule: 0 12 * * 1  (toda segunda-feira às 09:00 BRT / 12:00 UTC)
 * Busca as festas do final de semana (sex, sáb, dom) e envia um resumo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

function getWeekendDates(): string[] {
  const now = new Date()
  // Hoje é segunda-feira; calcular sexta (dia 5), sábado (6) e domingo (7)
  const day = now.getDay() // 1 = segunda
  const friday = new Date(now)
  friday.setDate(now.getDate() + (5 - day)) // próxima sexta
  const saturday = new Date(friday)
  saturday.setDate(friday.getDate() + 1)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return [fmt(friday), fmt(saturday), fmt(sunday)]
}

export async function GET(request: NextRequest) {
  // Validar secret do cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const dates = getWeekendDates()

    // Buscar festas do final de semana
    const { data: festas, error: festasError } = await supabase
      .from('festas')
      .select('id, tema, data, horario')
      .in('data', dates)
      .eq('concluida', false)
      .order('data', { ascending: true })

    if (festasError) throw festasError

    const count = (festas ?? []).length
    if (count === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma festa no final de semana.' })
    }

    // Buscar tokens ativos
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const title = 'Agenda do final de semana'
    const body = `Olá!\nNeste final de semana temos ${count} festa${count > 1 ? 's' : ''} agendada${count > 1 ? 's' : ''}.\nConfira sua agenda.`

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'agenda_fim_de_semana',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron agenda-fim-de-semana] Enviado para ${result.sent} dispositivos.`)
    return NextResponse.json({ success: true, sent: result.sent, festas: count })
  } catch (err) {
    console.error('[Cron agenda-fim-de-semana] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

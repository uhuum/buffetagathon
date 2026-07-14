/**
 * API Route chamada pela Netlify Scheduled Function `cron-uma-hora-antes`.
 * Schedule: 0 * * * *  (a cada hora exata)
 * Verifica festas que começam em aproximadamente 1 hora a partir de agora.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { addHours, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const targetTime = addHours(new Date(), 1)
    const targetDate = targetTime.toISOString().split('T')[0]
    // Janela de ±5 minutos para compensar imprecisão do cron
    const targetHour = format(targetTime, 'HH:mm')
    const [h, m] = targetHour.split(':').map(Number)
    const minMinus = `${String(h).padStart(2, '0')}:${String(Math.max(0, m - 5)).padStart(2, '0')}`
    const minPlus = `${String(h).padStart(2, '0')}:${String(Math.min(59, m + 5)).padStart(2, '0')}`

    const { data: festas, error } = await supabase
      .from('festas')
      .select('id, tema, data, horario')
      .eq('data', targetDate)
      .gte('horario', minMinus)
      .lte('horario', minPlus)
      .eq('concluida', false)

    if (error) throw error

    const count = (festas ?? []).length
    if (count === 0) return NextResponse.json({ success: true, message: 'Nenhuma festa em 1 hora.' })

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const title = 'Sua festa começa em 1 hora'
    const body = 'Confira endereço, horário e informações da festa.'

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'uma_hora_antes',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron uma-hora-antes] ${count} festas, ${result.sent} notificações enviadas.`)
    return NextResponse.json({ success: true, festas: count, sent: result.sent })
  } catch (err) {
    console.error('[Cron uma-hora-antes] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

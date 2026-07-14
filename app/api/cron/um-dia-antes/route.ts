/**
 * API Route chamada pela Netlify Scheduled Function `cron-um-dia-antes`.
 * Schedule: 0 21 * * *  (todos os dias às 18:00 BRT / 21:00 UTC)
 * Agrupa as festas do dia seguinte e envia lembrete.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const tomorrow = addDays(new Date(), 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: festas, error } = await supabase
      .from('festas')
      .select('id, tema, data, horario')
      .eq('data', tomorrowStr)
      .eq('concluida', false)

    if (error) throw error

    const count = (festas ?? []).length
    if (count === 0) return NextResponse.json({ success: true, message: 'Nenhuma festa amanhã.' })

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const title = 'Lembrete'
    const body = `Olá!\n\nAmanhã você possui ${count} festa${count > 1 ? 's' : ''}.\n\nConfira os horários na agenda.`

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'um_dia_antes',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron um-dia-antes] ${count} festas, ${result.sent} notificações enviadas.`)
    return NextResponse.json({ success: true, festas: count, sent: result.sent })
  } catch (err) {
    console.error('[Cron um-dia-antes] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

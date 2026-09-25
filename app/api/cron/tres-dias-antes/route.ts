/**
 * API Route chamada pela Netlify Scheduled Function `cron-tres-dias-antes`.
 * Schedule: 0 12 * * *  (todos os dias às 09:00 BRT / 12:00 UTC)
 * Envia notificação para festas que ocorrem daqui a 3 dias.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const targetDate = addDays(new Date(), 3)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    const { data: festas, error } = await supabase
      .from('festas')
      .select('id, tema, data, horario, responsavel')
      .eq('data', targetDateStr)
      .eq('concluida', false)

    if (error) throw error

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const count = festas?.length ?? 0
    if (count === 0) return NextResponse.json({ success: true, festas: 0, sent: 0 })

    const title = 'Agenda do final de semana'
    const body = `Esse final de semana tem ${count} festa${count > 1 ? 's' : ''}, não esqueça! Entre e confira mais detalhes.`
    const result = await sendPushNotificationToMany(tokenList, title, body, { type: 'tres_dias_antes' })

    if (result.invalidTokens.length > 0) {
      await supabase.from('device_tokens').update({ is_active: false }).in('token', result.invalidTokens)
    }

    console.log(`[Cron tres-dias-antes] ${count} festas, ${result.sent} notificações enviadas.`)
    return NextResponse.json({ success: true, festas: count, sent: result.sent })
  } catch (err) {
    console.error('[Cron tres-dias-antes] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

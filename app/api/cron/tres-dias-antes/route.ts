/**
 * API Route chamada pela Netlify Scheduled Function `cron-tres-dias-antes`.
 * Schedule: 0 12 * * *  (todos os dias às 09:00 BRT / 12:00 UTC)
 * Envia notificação para festas que ocorrem daqui a 3 dias.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { format, addDays } from 'date-fns'
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

    let totalSent = 0

    for (const festa of festas ?? []) {
      const dataFormatada = format(new Date(`${festa.data}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
      const title = 'Sua festa está chegando'
      const body = `Faltam apenas 3 dias para a festa!\n\nTema: ${festa.tema}\nData: ${dataFormatada}\nHorário: ${festa.horario}\nCliente: ${festa.responsavel}`

      const result = await sendPushNotificationToMany(tokenList, title, body, {
        type: 'tres_dias_antes',
        festa_id: festa.id,
      })

      totalSent += result.sent

      if (result.invalidTokens.length > 0) {
        await supabase
          .from('device_tokens')
          .update({ is_active: false })
          .in('token', result.invalidTokens)
      }
    }

    console.log(`[Cron tres-dias-antes] ${festas?.length ?? 0} festas, ${totalSent} notificações enviadas.`)
    return NextResponse.json({ success: true, festas: festas?.length ?? 0, sent: totalSent })
  } catch (err) {
    console.error('[Cron tres-dias-antes] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

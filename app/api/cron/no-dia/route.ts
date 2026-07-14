/**
 * API Route chamada pela Netlify Scheduled Function `cron-no-dia`.
 * Schedule: 0 11 * * *  (todos os dias às 08:00 BRT / 11:00 UTC)
 * Envia "Bom trabalho!" com a quantidade de festas do dia.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const todayStr = new Date().toISOString().split('T')[0]

    const { data: festas, error } = await supabase
      .from('festas')
      .select('id')
      .eq('data', todayStr)
      .eq('concluida', false)

    if (error) throw error

    const count = (festas ?? []).length
    if (count === 0) return NextResponse.json({ success: true, message: 'Nenhuma festa hoje.' })

    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const title = 'Bom trabalho!'
    const body = `Hoje você possui ${count} festa${count > 1 ? 's' : ''}.\n\nDesejamos um excelente evento!`

    const result = await sendPushNotificationToMany(tokenList, title, body, {
      type: 'no_dia',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    console.log(`[Cron no-dia] ${count} festas, ${result.sent} notificações enviadas.`)
    return NextResponse.json({ success: true, festas: count, sent: result.sent })
  } catch (err) {
    console.error('[Cron no-dia] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

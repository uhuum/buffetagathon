import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { localDate } from '@/lib/notification-time'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()
    const date = localDate(new Date())
    const { data: appointments, error } = await supabase.from('atendimentos')
      .select('id, cliente, horario').eq('data', date)
      .in('status', ['agendado', 'confirmado']).order('horario')
    if (error) throw error
    if (!appointments?.length) return NextResponse.json({ success: true, sent: 0 })

    const { data: devices, error: devicesError } = await supabase.from('device_tokens')
      .select('id, token').eq('is_active', true)
    if (devicesError) throw devicesError
    if (!devices?.length) return NextResponse.json({ success: true, atendimentos: appointments.length, sent: 0 })

    const tokenIds = new Map(devices.map(device => [device.token, device.id]))
    let tokens = devices.map(device => device.token)
    let sent = 0
    let failed = 0
    for (const appointment of appointments) {
      const title = 'Atendimento presencial hoje'
      const body = `Hoje você tem atendimento presencial às ${appointment.horario} com ${appointment.cliente}. Confirme com a pessoa.`
      const result = await sendPushNotificationToMany(tokens, title, body, {
        type: 'atendimento_hoje',
        tag: `atendimento_hoje:${date}:${appointment.id}`,
        url: '/',
      })
      sent += result.sent
      failed += result.failed

      const { error: logError } = await supabase.from('notification_deliveries').insert(
        result.deliveries.map(delivery => ({
          token_id: tokenIds.get(delivery.token) ?? null,
          token_preview: delivery.token.slice(0, 12) + '...',
          title,
          body,
          notification_type: 'atendimento_hoje',
          status: delivery.success ? 'sent' : result.invalidTokens.includes(delivery.token) ? 'invalid' : 'failed',
          provider_message_id: delivery.messageId ?? null,
          error: delivery.error ?? null,
          attempt_count: delivery.attempts,
        })),
      )
      // O aceite do provedor não comprova que o celular exibiu a notificação.
      if (logError) console.error('[Cron atendimentos-hoje] Falha ao registrar envios:', logError)

      if (result.invalidTokens.length) {
        const { error: deactivateError } = await supabase.from('device_tokens')
          .update({ is_active: false }).in('token', result.invalidTokens)
        if (deactivateError) console.error('[Cron atendimentos-hoje] Falha ao desativar dispositivos:', deactivateError)
        tokens = tokens.filter(token => !result.invalidTokens.includes(token))
      }
    }
    console.log(`[Cron atendimentos-hoje] ${appointments.length} atendimentos, ${sent} envios aceitos, ${failed} falhas.`)
    return NextResponse.json({ success: failed === 0, atendimentos: appointments.length, sent, failed })
  } catch (error) {
    console.error('[Cron atendimentos-hoje] Erro:', error)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

/** Aviso uma hora antes, em America/Sao_Paulo, verificado a cada minuto. */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'
import { festaStart, reminderDue, reminderWindow } from '@/lib/notification-time'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }
  try {
    const now = new Date()
    const { start, end } = reminderWindow(now)
    const supabase = createServiceClient()
    const { data: festas, error } = await supabase.from('festas')
      .select('id, data, horario').gte('data', start).lte('data', end)
      .or('concluida.eq.false,concluida.is.null')
    if (error) throw error
    const due = (festas ?? []).flatMap(festa => {
      const beginsAt = festaStart(festa.data, festa.horario)
      return beginsAt && reminderDue(beginsAt, now) ? [{ ...festa, beginsAt }] : []
    })
    // Diagnóstico autenticado: nenhuma reserva nem notificação é criada.
    if (request.nextUrl.searchParams.get('dry_run') === 'true' || due.length === 0) {
      return NextResponse.json({ success: true, festas: due.length, sent: 0 })
    }
    const { data: tokens, error: tokensError } = await supabase.from('device_tokens')
      .select('id, token').eq('is_active', true)
    if (tokensError) throw tokensError
    if (!tokens?.length) return NextResponse.json({ success: true, festas: due.length, sent: 0 })

    let sent = 0
    let failed = 0
    for (const festa of due) {
      const scheduledStart = festa.beginsAt.toISOString()
      // Reserva atômica por festa, horário e dispositivo. Envios concluídos não
      // são repetidos; reservas interrompidas podem ser retomadas após 2 minutos.
      const { data: claims, error: claimError } = await supabase.rpc('claim_festa_reminders', {
        p_festa_id: festa.id, p_scheduled_start: scheduledStart,
        p_token_ids: tokens.map(t => t.id),
      })
      if (claimError) throw claimError
      const claimedIds = new Set((claims ?? []).map((c: { token_id: string }) => c.token_id))
      const recipients = tokens.filter(t => claimedIds.has(t.id))
      if (!recipients.length) continue
      const tag = `uma_hora_antes:${festa.id}:${scheduledStart}`
      const title = `A festa das ${festa.horario.slice(0, 5)} começa em 1 hora!`
      const result = await sendPushNotificationToMany(recipients.map(t => t.token), title,
        'Entre no Agathon e confira os detalhes da festa.', {
          type: 'uma_hora_antes', festa_id: festa.id, tag, expires_at: new Date(festa.beginsAt.getTime() - 55 * 60_000).toISOString(),
        })
      sent += result.sent
      failed += result.failed
      const successTokens = new Set(result.deliveries.filter(d => d.success).map(d => d.token))
      const deliveredIds = recipients.filter(t => successTokens.has(t.token)).map(t => t.id)
      const retryIds = recipients.filter(t => !successTokens.has(t.token)).map(t => t.id)
      if (deliveredIds.length) {
        const { error: saveError } = await supabase.from('festa_reminder_deliveries')
          .update({ sent_at: new Date().toISOString() }).eq('festa_id', festa.id)
          .eq('scheduled_start', scheduledStart).in('token_id', deliveredIds)
        if (saveError) throw saveError
      }
      if (retryIds.length) {
        const { error: releaseError } = await supabase.from('festa_reminder_deliveries')
          .delete().eq('festa_id', festa.id).eq('scheduled_start', scheduledStart)
          .is('sent_at', null).in('token_id', retryIds)
        if (releaseError) throw releaseError
      }
      if (result.invalidTokens.length) {
        const { error: deactivateError } = await supabase.from('device_tokens')
          .update({ is_active: false }).in('token', result.invalidTokens)
        if (deactivateError) throw deactivateError
      }
    }
    console.log(`[Cron uma-hora-antes] ${due.length} festas, ${sent} enviadas, ${failed} falhas.`)
    return NextResponse.json({ success: failed === 0, festas: due.length, sent, failed }, { status: failed ? 502 : 200 })
  } catch (err) {
    console.error('[Cron uma-hora-antes] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

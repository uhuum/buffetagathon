import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

export async function POST(request: NextRequest) {
  try {
    const { title, body: notifBody, data } = await request.json()
    if (!title || !notifBody) return NextResponse.json({ message: 'Campos obrigatorios: title, body' }, { status: 400 })
    const supabase = createServiceClient()
    const { data: rows, error } = await supabase.from('device_tokens').select('id, token').eq('is_active', true)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    const tokens = rows ?? []
    if (!tokens.length) return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 })

    const result = await sendPushNotificationToMany(tokens.map((r: any) => r.token), title, notifBody, data)
    if (result.invalidTokens.length) await supabase.from('device_tokens').update({ is_active: false }).in('token', result.invalidTokens)

    const byToken = new Map(tokens.map((r: any) => [r.token, r.id]))
    await supabase.from('notification_deliveries').insert(result.deliveries.map((d) => ({
      token_id: byToken.get(d.token) ?? null,
      token_preview: d.token.slice(0, 12) + '...',
      title,
      body: notifBody,
      notification_type: data?.type ?? 'manual',
      status: d.success ? 'sent' : result.invalidTokens.includes(d.token) ? 'invalid' : 'failed',
      provider_message_id: d.messageId ?? null,
      error: d.error ?? null,
      attempt_count: d.attempts,
    })))

    return NextResponse.json({ success: result.failed === 0, sent: result.sent, failed: result.failed, total: tokens.length })
  } catch (err) {
    console.error('[API send-all]', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

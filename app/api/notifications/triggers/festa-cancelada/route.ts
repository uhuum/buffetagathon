import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)
    if (tokenList.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const title = 'Festa cancelada'
    const notifBody = 'Uma festa foi cancelada. Verifique sua agenda.'

    const result = await sendPushNotificationToMany(tokenList, title, notifBody, {
      type: 'festa_cancelada',
    })

    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    return NextResponse.json({ success: true, sent: result.sent })
  } catch (err) {
    console.error('[API trigger/festa-cancelada] Erro:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

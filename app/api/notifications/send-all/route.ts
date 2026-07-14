import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotificationToMany } from '@/lib/fcm-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: notifBody, data } = body

    if (!title || !notifBody) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: title, body' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    // Buscar todos os tokens ativos
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    const tokenList = (tokens ?? []).map((t: { token: string }) => t.token)

    if (tokenList.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'Nenhum token registrado' })
    }

    const result = await sendPushNotificationToMany(tokenList, title, notifBody, data)

    // Marcar tokens inválidos como inativos
    if (result.invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
      console.log(`[API send-all] ${result.invalidTokens.length} tokens inválidos desativados.`)
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: tokenList.length,
    })
  } catch (err) {
    console.error('[API send-all] Erro inesperado:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

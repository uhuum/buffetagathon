import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/fcm-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, title, body: notifBody, data } = body

    if (!token || !title || !notifBody) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: token, title, body' },
        { status: 400 },
      )
    }

    const result = await sendPushNotification({
      token,
      title,
      body: notifBody,
      data: data ?? {},
    })

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err) {
    console.error('[API send] Erro inesperado:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

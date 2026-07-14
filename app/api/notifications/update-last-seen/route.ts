import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Token inválido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('device_tokens')
      .update({ last_seen: new Date().toISOString() })
      .eq('token', token)

    if (error) {
      console.error('[API update-last-seen] Erro Supabase:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API update-last-seen] Erro inesperado:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, device_name, browser, platform } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Token inválido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert: insere ou atualiza se o token já existir
    const { error } = await supabase.from('device_tokens').upsert(
      {
        token,
        user_id: 'edna',
        device_name: device_name ?? null,
        browser: browser ?? null,
        platform: platform ?? null,
        last_seen: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'token' },
    )

    if (error) {
      console.error('[API save-token] Erro Supabase:', error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API save-token] Erro inesperado:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

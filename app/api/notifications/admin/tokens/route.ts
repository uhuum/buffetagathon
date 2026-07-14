import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('device_tokens')
      .select('*')
      .order('last_seen', { ascending: false })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[API admin/tokens] Erro inesperado:', err)
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 })
  }
}

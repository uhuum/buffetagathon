import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const supabase=createServiceClient()
  const body=await request.json()
  const {data,error}=await supabase.from('festas').update(body).eq('id',id).select('*').single()
  if(error) return NextResponse.json({message:error.message},{status:500})
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}})
}
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const supabase=createServiceClient()
  const {error}=await supabase.from('festas').delete().eq('id',id)
  if(error) return NextResponse.json({message:error.message},{status:500})
  return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}})
}

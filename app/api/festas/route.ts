import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(){
  const supabase=createServiceClient()
  const {data,error}=await supabase.from('festas').select('*').order('data',{ascending:true})
  if(error) return NextResponse.json({message:error.message},{status:500,headers:{'Cache-Control':'no-store'}})
  return NextResponse.json(data??[],{headers:{'Cache-Control':'no-store, no-cache, must-revalidate'}})
}
export async function POST(request:Request){
  const supabase=createServiceClient()
  const body=await request.json()
  const {data,error}=await supabase.from('festas').insert(body).select('*').single()
  if(error) return NextResponse.json({message:error.message},{status:500})
  return NextResponse.json(data,{status:201,headers:{'Cache-Control':'no-store'}})
}

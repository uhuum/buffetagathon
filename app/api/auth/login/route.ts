import { NextResponse } from 'next/server'
import { setSession } from '@/lib/auth'
export async function POST(r:Request){const {usuario,senha}=await r.json();if(usuario!==process.env.ADMIN_USERNAME||senha!==process.env.ADMIN_PASSWORD)return NextResponse.json({message:'Usuário ou senha inválidos'},{status:401});await setSession(usuario);return NextResponse.json({success:true})}
import{NextResponse}from'next/server'
import{createClient}from'@/lib/supabase/server'
export async function POST(r:Request){const{email,senha}=await r.json();if(typeof email!=='string'||typeof senha!=='string')return NextResponse.json({message:'E-mail e senha são obrigatórios'},{status:400});const supabase=await createClient();const{error}=await supabase.auth.signInWithPassword({email:email.trim(),password:senha});if(error)return NextResponse.json({message:'E-mail ou senha inválidos'},{status:401});return NextResponse.json({success:true})}

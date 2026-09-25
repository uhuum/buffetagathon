import{createServerClient}from'@supabase/ssr'
import{createClient as createAdminClient}from'@supabase/supabase-js'
import{cookies}from'next/headers'
export async function createClient(){const store=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return store.getAll()},setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}})}
export function createServiceClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Configuração do banco ausente');return createAdminClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})}

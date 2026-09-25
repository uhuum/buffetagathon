import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
const COOKIE='agathon_session', MAX_AGE=604800
function key(){const v=process.env.APP_SESSION_SECRET;if(!v)throw new Error('APP_SESSION_SECRET ausente');return v}
function sign(v:string){return createHmac('sha256',key()).update(v).digest('hex')}
export function createSessionValue(user:string){const exp=Math.floor(Date.now()/1000)+MAX_AGE,p=user+'.'+exp;return p+'.'+sign(p)}
export async function isAuthenticated(){const raw=(await cookies()).get(COOKIE)?.value;if(!raw)return false;const [u,e,s]=raw.split('.');if(!u||!e||!s||Number(e)<Date.now()/1000)return false;const x=sign(u+'.'+e);try{return timingSafeEqual(Buffer.from(s),Buffer.from(x))}catch{return false}}
export async function setSession(u:string){(await cookies()).set(COOKIE,createSessionValue(u),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:MAX_AGE})}
export async function clearSession(){(await cookies()).set(COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0})}

import type{Handler}from'@netlify/functions'
const handler:Handler=async()=>{const base=process.env.URL,secret=process.env.CRON_SECRET;if(!base||!secret)return{statusCode:500,body:'Configuração ausente'};const r=await fetch(base+'/api/cron/atendimentos-hoje',{headers:{Authorization:'Bearer '+secret}});return{statusCode:r.status,body:await r.text()}}
export{handler}
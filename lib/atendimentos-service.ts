import { Atendimento } from './types'
async function j<T>(r:Response):Promise<T>{if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||'Falha ao sincronizar atendimentos')}return r.json()}
export async function fetchAtendimentos(){return j<Atendimento[]>(await fetch('/api/atendimentos',{cache:'no-store'}))}
export async function createAtendimento(v:Omit<Atendimento,'id'|'criadoEm'>){return j<Atendimento>(await fetch('/api/atendimentos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}))}
export async function updateAtendimento(id:string,v:Partial<Atendimento>){return j<Atendimento>(await fetch('/api/atendimentos/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}))}
export async function deleteAtendimento(id:string){const r=await fetch('/api/atendimentos/'+id,{method:'DELETE'});if(!r.ok)throw new Error('Falha ao excluir atendimento')}

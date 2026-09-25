'use client'
import React,{createContext,useContext,useState,useEffect,useCallback}from'react'
import {AppState,Festa,Page,Atendimento}from'./types'
import{fetchFestas,createFesta,updateFestaRow,deleteFestaRow}from'./festas-service'
import{fetchAtendimentos,createAtendimento,updateAtendimento as updateAtendimentoRow,deleteAtendimento as deleteAtendimentoRow}from'./atendimentos-service'
interface C extends AppState{loading:boolean;error:string|null;login:(email:string,s:string)=>Promise<boolean>;logout:()=>Promise<void>;navigate:(p:Page)=>void;addFesta:(f:Omit<Festa,'id'|'criadoEm'>)=>Promise<void>;updateFesta:(id:string,f:Omit<Festa,'id'|'criadoEm'>)=>Promise<void>;setConcluida:(id:string,c:boolean)=>Promise<void>;deleteFesta:(id:string)=>Promise<void>;refreshFestas:()=>Promise<void>;refreshAtendimentos:()=>Promise<void>;addAtendimento:(a:Omit<Atendimento,'id'|'criadoEm'>)=>Promise<void>;updateAtendimento:(id:string,a:Partial<Atendimento>)=>Promise<void>;deleteAtendimento:(id:string)=>Promise<void>;setEditingFesta:(f:Festa|null)=>void;setViewingFesta:(f:Festa|null)=>void}
const X=createContext<C|null>(null)
export function AppProvider({children}:{children:React.ReactNode}){const[festas,setFestas]=useState<Festa[]>([]),[atendimentos,setAtendimentos]=useState<Atendimento[]>([]),[isLoggedIn,setIsLoggedIn]=useState(false),[currentPage,setCurrentPage]=useState<Page>('login'),[editingFesta,setEditingFesta]=useState<Festa|null>(null),[viewingFesta,setViewingFesta]=useState<Festa|null>(null),[hydrated,setHydrated]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null)
const refreshFestas=useCallback(async()=>{try{setLoading(true);setError(null);setFestas(await fetchFestas())}catch(e){console.error(e);setError('Não foi possível carregar as festas.')}finally{setLoading(false)}},[])
const refreshAtendimentos=useCallback(async()=>{try{setAtendimentos(await fetchAtendimentos())}catch(e){console.error(e)}},[])
useEffect(()=>{(async()=>{try{const r=await fetch('/api/auth/session',{cache:'no-store'}),j=await r.json();if(j.authenticated){setIsLoggedIn(true);setCurrentPage('dashboard');await Promise.all([refreshFestas(),refreshAtendimentos()])}}finally{setHydrated(true)}})()},[refreshFestas,refreshAtendimentos])
const login=async(email:string,senha:string)=>{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,senha})});if(!r.ok)return false;setIsLoggedIn(true);setCurrentPage('dashboard');await Promise.all([refreshFestas(),refreshAtendimentos()]);return true}
const logout=async()=>{await fetch('/api/auth/logout',{method:'POST'});setIsLoggedIn(false);setCurrentPage('login');setFestas([]);setAtendimentos([])}
const navigate=(p:Page)=>setCurrentPage(p)
const addFesta=async(f:Omit<Festa,'id'|'criadoEm'>)=>{const n=await createFesta(f);setFestas(p=>[...p,n]);fetch('/api/notifications/triggers/festa-criada',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tema:n.tema,data:n.data,horario:n.horario,cliente:n.responsavel})}).catch(()=>{})}
const updateFesta=async(id:string,f:Omit<Festa,'id'|'criadoEm'>)=>{const n=await updateFestaRow(id,f);setFestas(p=>p.map(x=>x.id===id?n:x));fetch('/api/notifications/triggers/festa-alterada',{method:'POST'}).catch(()=>{})}
const setConcluida=async(id:string,c:boolean)=>{const f=festas.find(x=>x.id===id);if(!f)return;const{id:_i,criadoEm:_c,...rest}=f,n=await updateFestaRow(id,{...rest,concluida:c});setFestas(p=>p.map(x=>x.id===id?n:x));setViewingFesta(p=>p?.id===id?n:p)}
const deleteFesta=async(id:string)=>{await deleteFestaRow(id);setFestas(p=>p.filter(x=>x.id!==id))}
const addAtendimento=async(a:Omit<Atendimento,'id'|'criadoEm'>)=>{const n=await createAtendimento(a);setAtendimentos(p=>[...p,n])}
const updateAtendimento=async(id:string,a:Partial<Atendimento>)=>{const current=atendimentos.find(x=>x.id===id);if(!current)return;const n=await updateAtendimentoRow(id,{...current,...a});setAtendimentos(p=>p.map(x=>x.id===id?n:x))}
const deleteAtendimento=async(id:string)=>{await deleteAtendimentoRow(id);setAtendimentos(p=>p.filter(x=>x.id!==id))}
if(!hydrated)return null
return <X.Provider value={{festas,atendimentos,isLoggedIn,currentPage,editingFesta,viewingFesta,loading,error,login,logout,navigate,addFesta,updateFesta,setConcluida,deleteFesta,refreshFestas,refreshAtendimentos,addAtendimento,updateAtendimento,deleteAtendimento,setEditingFesta,setViewingFesta}}>{children}</X.Provider>}
export function useApp(){const c=useContext(X);if(!c)throw new Error('useApp must be used within AppProvider');return c}

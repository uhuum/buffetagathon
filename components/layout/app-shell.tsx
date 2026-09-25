'use client'
import{useState}from'react'
import{Sidebar}from'./sidebar'
import{Header}from'./header'
export function AppShell({children}:{children:React.ReactNode}){const[mobileOpen,setMobileOpen]=useState(false);return <div className="flex h-dvh min-h-0 overflow-hidden bg-background"><Sidebar mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/><div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden"><Header onMenuClick={()=>setMobileOpen(true)}/><main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6">{children}</main></div></div>}
'use client'

import Image from 'next/image'
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  List,
  Search,
  FileText,
  Settings,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Page } from '@/lib/types'
import { cn } from '@/lib/utils'

const navItems: { label: string; icon: React.ElementType; page: Page; color: string }[] = [
  { label: 'Dashboard',      icon: LayoutDashboard, page: 'dashboard',    color: '#f5a623' },
  { label: 'Calendário',     icon: Calendar,        page: 'calendario',   color: '#1a8fe3' },
  { label: 'Cadastrar Festa',icon: PlusCircle,      page: 'cadastrar',    color: '#f0127a' },
  { label: 'Lista de Festas',icon: List,            page: 'lista',        color: '#3cba54' },
  { label: 'Pesquisar',      icon: Search,          page: 'pesquisa',     color: '#f47920' },
  { label: 'Exportar PDF',   icon: FileText,        page: 'exportar',     color: '#7c3aed' },
  { label: 'Configurações',  icon: Settings,        page: 'configuracoes',color: '#94a3b8' },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { currentPage, navigate, logout } = useApp()

  const handleNav = (page: Page) => {
    navigate(page)
    onClose()
  }

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full w-64 flex-col transition-transform duration-300 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1154 60%, #1a0a2e 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              <Image
                src="/logo.png"
                alt="Buffet Agathon"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--agathon-gold)' }}>
                BUFFET
              </p>
              <p className="text-base font-extrabold text-white leading-tight">Agathon</p>
              <p className="text-[9px] text-white/40 leading-none">Sistema de Agenda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ label, icon: Icon, page, color }) => {
            const isActive = currentPage === page
            return (
              <button
                key={page}
                onClick={() => handleNav(page)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-white/60 hover:bg-white/8 hover:text-white',
                )}
                style={
                  isActive
                    ? { backgroundColor: color, color: '#fff', boxShadow: `0 4px 12px ${color}55` }
                    : undefined
                }
              >
                <Icon size={18} style={isActive ? { color: '#fff' } : { color }} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

interface MobileMenuButtonProps {
  onClick: () => void
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-white"
      style={{ background: 'linear-gradient(135deg, #1a0a2e, #2d1154)' }}
      aria-label="Abrir menu"
    >
      <Menu size={20} />
    </button>
  )
}

'use client'

import { LayoutDashboard, Calendar, PlusCircle, List, Search } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Page } from '@/lib/types'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { icon: React.ElementType; label: string; page: Page; color: string }[] = [
  { icon: LayoutDashboard, label: 'Início',     page: 'dashboard', color: '#f5a623' },
  { icon: Calendar,        label: 'Calendário', page: 'calendario', color: '#1a8fe3' },
  { icon: PlusCircle,      label: 'Cadastrar',  page: 'cadastrar',  color: '#f0127a' },
  { icon: List,            label: 'Lista',      page: 'lista',      color: '#3cba54' },
  { icon: Search,          label: 'Pesquisar',  page: 'pesquisa',   color: '#f47920' },
]

export function BottomNav() {
  const { currentPage, navigate } = useApp()

  // Não exibir na tela de login ou em páginas de detalhes
  if (currentPage === 'login') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-border"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1154 100%)' }}
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around px-1 pb-safe">
        {NAV_ITEMS.map(({ icon: Icon, label, page, color }) => {
          const isActive = currentPage === page
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl transition-all min-w-0 flex-1',
                isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                  isActive ? 'scale-110' : '',
                )}
                style={isActive ? { backgroundColor: color + '33' } : undefined}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? color : '#ffffff' }}
                  aria-hidden="true"
                />
              </div>
              <span
                className="text-[10px] font-semibold leading-none truncate w-full text-center"
                style={{ color: isActive ? color : '#ffffff99' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

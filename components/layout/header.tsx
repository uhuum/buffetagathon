'use client'

import { Bell, User, X } from 'lucide-react'
import Image from 'next/image'
import { useApp } from '@/lib/app-context'
import { Page } from '@/lib/types'
import { MobileMenuButton } from './sidebar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getNotifications } from '@/lib/utils-app'
import { useState } from 'react'

const pageTitles: Record<Page, string> = {
  login:         'Login',
  dashboard:     'Dashboard',
  calendario:    'Calendário',
  cadastrar:     'Cadastrar Festa',
  lista:         'Lista de Festas',
  pesquisa:      'Pesquisar',
  exportar:      'Exportar PDF',
  configuracoes: 'Configurações',
  detalhes:      'Detalhes da Festa',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentPage, festas } = useApp()
  const notifications = getNotifications(festas)
  const [showNotifs, setShowNotifs] = useState(false)

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileMenuButton onClick={onMenuClick} />
        <div className="min-w-0">
          <h1 className="text-base font-bold text-foreground leading-tight truncate sm:text-lg">
            {pageTitles[currentPage]}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block truncate">{todayCapitalized}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Logo visível no mobile */}
        <div className="lg:hidden">
          <Image
            src="/logo.png"
            alt="Buffet Agathon"
            width={28}
            height={28}
            style={{ width: 28, height: 'auto' }}
            className="object-contain"
          />
        </div>

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Notificações"
            aria-expanded={showNotifs}
          >
            <Bell size={18} className="text-muted-foreground sm:w-5 sm:h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--agathon-pink)' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: 'var(--agathon-pink)' }}
                />
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="fixed inset-x-3 top-16 z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
              <div
                className="flex items-center justify-between p-3 border-b border-border"
                style={{ background: 'linear-gradient(135deg, #1a0a2e, #2d1154)' }}
              >
                <p className="text-sm font-bold text-white">Notificações</p>
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Fechar notificações"
                >
                  <X size={16} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-center text-muted-foreground">Sem notificações</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif, i) => (
                    <div key={i} className="flex gap-2 p-3 border-b border-border last:border-0">
                      <div
                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            notif.type === 'danger'
                              ? '#ef4444'
                              : notif.type === 'warning'
                              ? 'var(--agathon-gold)'
                              : 'var(--agathon-blue)',
                        }}
                      />
                      <p className="text-sm text-foreground">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usuário */}
        <div
          className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 sm:px-3"
          style={{ background: 'linear-gradient(135deg, var(--agathon-pink), var(--agathon-purple))' }}
        >
          <User size={14} className="text-white" />
          <span className="text-xs font-bold text-white hidden sm:block">Edna</span>
        </div>
      </div>
    </header>
  )
}

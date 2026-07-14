'use client'

import Image from 'next/image'
import { User, Info, Bell, ChevronRight } from 'lucide-react'
import { useApp } from '@/lib/app-context'

export function ConfiguracoesScreen() {
  const { festas, navigate } = useApp()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Perfil do sistema */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border" style={{ backgroundColor: '#1a2e4a' }}>
          <h2 className="text-lg font-bold text-white">Configurações do Sistema</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Identidade */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
            <Image
              src="/logo.png"
              alt="Buffet Agathon"
              width={64}
              height={64}
              style={{ width: 64, height: 'auto' }}
              className="object-contain flex-shrink-0"
            />
            <div>
              <p className="font-bold text-foreground text-lg">Buffet Agathon</p>
              <p className="text-sm text-muted-foreground">Sistema de Agenda de Festas</p>
              <p className="text-xs text-muted-foreground mt-1">Versão 1.0.0</p>
            </div>
          </div>

          {/* Usuário */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User size={15} style={{ color: '#c9a227' }} />
              Usuário do Sistema
            </h3>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Login</span>
                <span className="font-medium text-foreground">edna</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-medium text-foreground">Administrador</span>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info size={15} style={{ color: '#c9a227' }} />
              Dados do Sistema
            </h3>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de festas cadastradas</span>
                <span className="font-bold text-foreground">{festas.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Buffet Agathon</span>
                <span className="font-medium text-foreground">{festas.filter(f => f.tipo === 'buffet').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Domicílio</span>
                <span className="font-medium text-foreground">{festas.filter(f => f.tipo === 'domicilio').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Outro Espaço</span>
                <span className="font-medium text-foreground">{festas.filter(f => f.tipo === 'outro').length}</span>
              </div>
            </div>
          </div>

          {/* Administração */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bell size={15} style={{ color: '#c9a227' }} />
              Notificações Push
            </h3>
            <button
              onClick={() => navigate('admin-notificacoes')}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 text-sm hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Painel de Notificações</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gerenciar dispositivos e enviar notificações
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Buffet Agathon. Todos os direitos reservados.
      </p>
    </div>
  )
}

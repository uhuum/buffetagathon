'use client'

import { AppProvider, useApp } from '@/lib/app-context'
import { AppShell } from '@/components/layout/app-shell'
import { LoginScreen } from '@/components/screens/login'
import { DashboardScreen } from '@/components/screens/dashboard'
import { CalendarioScreen } from '@/components/screens/calendario'
import { CadastrarFestaScreen } from '@/components/screens/cadastrar-festa'
import { ListaFestasScreen } from '@/components/screens/lista-festas'
import { PesquisaScreen } from '@/components/screens/pesquisa'
import { ExportarPDFScreen } from '@/components/screens/exportar-pdf'
import { ConfiguracoesScreen } from '@/components/screens/configuracoes'
import { DetalhesFestaScreen } from '@/components/screens/detalhes-festa'
import { AdminNotificacoesScreen } from '@/components/screens/admin-notificacoes'

function AppContent() {
  const { isLoggedIn, currentPage } = useApp()

  if (!isLoggedIn) {
    return <LoginScreen />
  }

  const screens: Record<string, React.ReactNode> = {
    dashboard: <DashboardScreen />,
    calendario: <CalendarioScreen />,
    cadastrar: <CadastrarFestaScreen />,
    lista: <ListaFestasScreen />,
    pesquisa: <PesquisaScreen />,
    exportar: <ExportarPDFScreen />,
    configuracoes: <ConfiguracoesScreen />,
    detalhes: <DetalhesFestaScreen />,
    'admin-notificacoes': <AdminNotificacoesScreen />,
  }

  return (
    <AppShell>
      {screens[currentPage] || <DashboardScreen />}
    </AppShell>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

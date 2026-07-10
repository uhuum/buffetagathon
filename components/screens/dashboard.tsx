'use client'

import { useMemo } from 'react'
import {
  Calendar,
  Home,
  Truck,
  MapPin,
  Star,
  Clock,
  Users,
  Cake,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { formatDate, tipoLabel, tipoBadgeClass, getNotifications } from '@/lib/utils-app'
import { parseISO, isThisMonth, isFuture, isToday, compareAsc } from 'date-fns'
import { Festa } from '@/lib/types'

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm sm:gap-4 sm:p-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12" style={{ backgroundColor: bg }}>
        <Icon size={18} style={{ color }} className="sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground sm:text-2xl">{value}</p>
        <p className="text-xs text-muted-foreground leading-tight sm:text-sm">{label}</p>
      </div>
    </div>
  )
}

function PartyCard({ festa, onClick }: { festa: Festa; onClick: () => void }) {
  const badgeClass = tipoBadgeClass(festa.tipo)
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-[#c9a227] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{festa.nomeAniversariante}</h3>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {tipoLabel(festa.tipo)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{festa.tema}</p>
        </div>
        {isToday(parseISO(festa.data)) && (
          <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#c9a227' }}>
            Hoje
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar size={13} />
          {formatDate(festa.data)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} />
          {festa.horario}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users size={13} />
          {festa.convidados} convidados
        </div>
      </div>
    </button>
  )
}

export function DashboardScreen() {
  const { festas, navigate, setViewingFesta } = useApp()

  const stats = useMemo(() => {
    const doMes = festas.filter(f => isThisMonth(parseISO(f.data)))
    return {
      total: doMes.length,
      buffet: doMes.filter(f => f.tipo === 'buffet').length,
      domicilio: doMes.filter(f => f.tipo === 'domicilio').length,
      outro: doMes.filter(f => f.tipo === 'outro').length,
    }
  }, [festas])

  const proximaFesta = useMemo(() => {
    const upcoming = festas
      .filter(f => !f.concluida && (isFuture(parseISO(f.data)) || isToday(parseISO(f.data))))
      .sort((a, b) => compareAsc(parseISO(a.data), parseISO(b.data)))
    return upcoming[0] || null
  }, [festas])

  const proximas4 = useMemo(() => {
    return festas
      .filter(f => !f.concluida && (isFuture(parseISO(f.data)) || isToday(parseISO(f.data))))
      .sort((a, b) => compareAsc(parseISO(a.data), parseISO(b.data)))
      .slice(0, 4)
  }, [festas])

  const notifications = getNotifications(festas)

  const handleViewFesta = (festa: Festa) => {
    setViewingFesta(festa)
    navigate('detalhes')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notificações */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notif, i) => {
            const Icon = notif.type === 'danger' ? AlertCircle : notif.type === 'warning' ? AlertTriangle : Info
            const colors = {
              danger: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '#ef4444' },
              warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '#c9a227' },
              info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '#3b82f6' },
            }
            const c = colors[notif.type]
            return (
              <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium sm:px-4 sm:py-3 ${c.bg} ${c.border} ${c.text}`}>
                <Icon size={15} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
                <span className="leading-snug">{notif.message}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Cards de estatísticas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2.5 sm:text-base sm:mb-3">Resumo do Mês</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard icon={Calendar} label="Total de festas" value={stats.total} color="#1a2e4a" bg="#e8eef7" />
          <StatCard icon={Home} label="Buffet Agathon" value={stats.buffet} color="#2563eb" bg="#dbeafe" />
          <StatCard icon={Truck} label="Domicílio" value={stats.domicilio} color="#16a34a" bg="#dcfce7" />
          <StatCard icon={MapPin} label="Outro Espaço" value={stats.outro} color="#ea580c" bg="#ffedd5" />
        </div>
      </div>

      {/* Próxima festa destaque */}
      {proximaFesta && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2 sm:text-base sm:mb-3">
            <Star size={15} style={{ color: '#c9a227' }} />
            Próxima Festa
          </h2>
          <button
            onClick={() => handleViewFesta(proximaFesta)}
            className="w-full text-left rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5" style={{ backgroundColor: '#1a2e4a' }}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14" style={{ backgroundColor: '#c9a227' }}>
                <Cake size={22} className="text-white sm:text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate sm:text-xl">{proximaFesta.nomeAniversariante}</p>
                <p className="text-xs truncate sm:text-sm" style={{ color: '#c9a227' }}>{proximaFesta.tema}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-white sm:text-lg">{proximaFesta.horario}</p>
                <p className="text-xs text-white/70">{formatDate(proximaFesta.data)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-white border-t border-border sm:gap-4 sm:px-5 sm:py-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadgeClass(proximaFesta.tipo)}`}>
                {tipoLabel(proximaFesta.tipo)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users size={12} />
                {proximaFesta.convidados} convidados
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Users size={12} />
                {proximaFesta.responsavel}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Próximas 4 festas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2.5 sm:text-base sm:mb-3">Próximas Festas</h2>
        {proximas4.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            Nenhuma festa agendada
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
            {proximas4.map(f => (
              <PartyCard key={f.id} festa={f} onClick={() => handleViewFesta(f)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

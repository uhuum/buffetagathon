'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, Users, MapPin } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Festa } from '@/lib/types'
import { tipoColor, tipoLabel, tipoBadgeClass } from '@/lib/utils-app'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  getYear,
  getMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const WEEK_DAYS_FULL  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEK_DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i)

interface DayModalProps {
  date: Date
  festas: Festa[]
  onClose: () => void
  onViewFesta: (f: Festa) => void
}

function DayModal({ date, festas, onClose, onViewFesta }: DayModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ backgroundColor: '#1a2e4a' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: '#c9a227' }}>FESTAS DO DIA</p>
            <p className="text-lg font-bold text-white capitalize">
              {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {festas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma festa neste dia.</p>
          ) : (
            festas.map(f => (
              <button
                key={f.id}
                onClick={() => onViewFesta(f)}
                className="w-full text-left rounded-xl border border-border p-4 hover:border-[#c9a227] hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{f.nomeAniversariante}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadgeClass(f.tipo)}`}>
                    {tipoLabel(f.tipo)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{f.tema}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} /> {f.horario}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={12} /> {f.convidados} convidados
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={12} /> {f.responsavel}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function CalendarioScreen() {
  const { festas, navigate, setViewingFesta } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startWeekDay = getDay(monthStart)

  const festasByDate: Record<string, Festa[]> = {}
  festas.forEach(f => {
    if (!festasByDate[f.data]) festasByDate[f.data] = []
    festasByDate[f.data].push(f)
  })

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
  }

  const handleViewFesta = (f: Festa) => {
    setViewingFesta(f)
    navigate('detalhes')
    setSelectedDay(null)
  }

  const festasDoDay = selectedDay
    ? (festasByDate[format(selectedDay, 'yyyy-MM-dd')] || [])
    : []

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Controles do calendário */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-lg border border-border bg-card p-1.5 hover:bg-muted transition-colors sm:p-2"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded-lg border border-border bg-card p-1.5 hover:bg-muted transition-colors sm:p-2"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <h2 className="text-base font-bold text-foreground capitalize ml-1 sm:text-lg">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <select
            value={getMonth(currentDate)}
            onChange={e => {
              const d = new Date(currentDate)
              d.setMonth(parseInt(e.target.value))
              setCurrentDate(d)
            }}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] sm:px-3 sm:text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={getYear(currentDate)}
            onChange={e => {
              const d = new Date(currentDate)
              d.setFullYear(parseInt(e.target.value))
              setCurrentDate(d)
            }}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] sm:px-3 sm:text-sm"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {[
          { label: 'Buffet Agathon', color: '#3b82f6' },
          { label: 'Domicílio', color: '#22c55e' },
          { label: 'Outro Espaço', color: '#f97316' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 sm:h-3 sm:w-3" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS_FULL.map((d, i) => (
            <div key={d + i} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              <span className="hidden sm:inline">{WEEK_DAYS_FULL[i]}</span>
              <span className="sm:hidden">{WEEK_DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7">
          {/* Espaços vazios antes do primeiro dia */}
          {Array.from({ length: startWeekDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[52px] border-b border-r border-border bg-muted/30 sm:min-h-[80px]" />
          ))}

          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayFestas = festasByDate[dateKey] || []
            const isCurrentDay = isToday(day)
            const isLastInRow = (startWeekDay + idx + 1) % 7 === 0
            const isLastRow = idx >= days.length - 7

            return (
              <div
                key={dateKey}
                onClick={() => handleDayClick(day)}
                className={`min-h-[52px] border-b border-r border-border p-1 cursor-pointer transition-colors hover:bg-muted/50 sm:min-h-[80px] sm:p-1.5 ${
                  isLastInRow ? 'border-r-0' : ''
                } ${isLastRow ? 'border-b-0' : ''}`}
              >
                <div
                  className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold sm:mb-1 sm:h-6 sm:w-6 sm:text-xs ${
                    isCurrentDay ? 'text-white' : 'text-foreground'
                  }`}
                  style={isCurrentDay ? { backgroundColor: '#1a2e4a' } : undefined}
                >
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {/* Mobile: mostrar só pontos coloridos */}
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayFestas.slice(0, 3).map(f => (
                      <span
                        key={f.id}
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tipoColor(f.tipo) }}
                      />
                    ))}
                    {dayFestas.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{dayFestas.length - 3}</span>
                    )}
                  </div>
                  {/* Desktop: mostrar nomes */}
                  <div className="hidden sm:block space-y-0.5">
                    {dayFestas.slice(0, 2).map(f => (
                      <div
                        key={f.id}
                        className="truncate rounded px-1 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: tipoColor(f.tipo) }}
                      >
                        {f.nomeAniversariante}
                      </div>
                    ))}
                    {dayFestas.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayFestas.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal do dia */}
      {selectedDay && (
        <DayModal
          date={selectedDay}
          festas={festasDoDay}
          onClose={() => setSelectedDay(null)}
          onViewFesta={handleViewFesta}
        />
      )}
    </div>
  )
}

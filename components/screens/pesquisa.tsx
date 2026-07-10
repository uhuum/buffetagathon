'use client'

import { useState, useMemo } from 'react'
import { Search, Eye, Pencil, X } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Festa } from '@/lib/types'
import { formatDate, tipoLabel, tipoBadgeClass } from '@/lib/utils-app'
import { getMonth, getYear, parseISO } from 'date-fns'

const MONTHS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function PesquisaScreen() {
  const { festas, navigate, setViewingFesta, setEditingFesta } = useApp()
  const [query, setQuery] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAno, setFiltroAno] = useState('')

  const anos = useMemo(() => {
    const set = new Set(festas.map(f => getYear(parseISO(f.data)).toString()))
    return Array.from(set).sort()
  }, [festas])

  const results = useMemo(() => {
    return festas.filter(f => {
      const q = query.toLowerCase()
      const matchQuery =
        !q ||
        f.nomeAniversariante.toLowerCase().includes(q) ||
        f.tema.toLowerCase().includes(q) ||
        f.responsavel.toLowerCase().includes(q) ||
        f.telefone.includes(q) ||
        f.data.includes(q)

      const matchTipo = !filtroTipo || f.tipo === filtroTipo
      const matchMes = !filtroMes || getMonth(parseISO(f.data)) + 1 === parseInt(filtroMes)
      const matchAno = !filtroAno || getYear(parseISO(f.data)).toString() === filtroAno

      return matchQuery && matchTipo && matchMes && matchAno
    })
  }, [festas, query, filtroTipo, filtroMes, filtroAno])

  const clearFilters = () => {
    setQuery('')
    setFiltroTipo('')
    setFiltroMes('')
    setFiltroAno('')
  }

  const hasFilters = query || filtroTipo || filtroMes || filtroAno

  const handleView = (f: Festa) => {
    setViewingFesta(f)
    navigate('detalhes')
  }

  const handleEdit = (f: Festa) => {
    setEditingFesta(f)
    navigate('cadastrar')
  }

  const inputClass = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:border-transparent transition'

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, tema, responsável, telefone ou data..."
            className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={inputClass}>
              <option value="">Todos os tipos</option>
              <option value="buffet">Buffet Agathon</option>
              <option value="domicilio">Domicílio</option>
              <option value="outro">Outro Espaço</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mês</label>
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className={inputClass}>
              <option value="">Todos os meses</option>
              {MONTHS.slice(1).map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Ano</label>
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className={inputClass}>
              <option value="">Todos os anos</option>
              {anos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={13} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Search size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">Nenhuma festa encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(f => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-[#c9a227] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{f.nomeAniversariante}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadgeClass(f.tipo)}`}>
                    {tipoLabel(f.tipo)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{f.tema}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(f.data)} às {f.horario}</span>
                  <span>{f.convidados} convidados</span>
                  <span>{f.responsavel} · {f.telefone}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleView(f)}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleEdit(f)}
                  className="rounded-lg p-2 hover:bg-amber-50 transition-colors"
                  style={{ color: '#c9a227' }}
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

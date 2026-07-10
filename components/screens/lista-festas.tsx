'use client'

import { useState } from 'react'
import {
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Festa } from '@/lib/types'
import { formatDate, tipoLabel, tipoBadgeClass } from '@/lib/utils-app'
import { whatsappLink } from '@/lib/masks'
import { compareAsc, compareDesc, parseISO } from 'date-fns'

type SortKey = 'proximas' | 'antigas' | 'nome' | 'tema'

function WhatsAppIcon({ telefone }: { telefone: string }) {
  return (
    <a
      href={whatsappLink(telefone)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center h-6 w-6 rounded-full transition-opacity hover:opacity-80"
      style={{ backgroundColor: '#25d366' }}
      aria-label={`WhatsApp ${telefone}`}
      onClick={e => e.stopPropagation()}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  )
}

function DeleteModal({
  festa,
  onConfirm,
  onCancel,
}: {
  festa: Festa
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Excluir Festa</p>
            <p className="text-sm text-muted-foreground">Esta acao nao pode ser desfeita</p>
          </div>
        </div>
        <p className="text-sm text-foreground mb-6">
          Tem certeza que deseja excluir a festa de{' '}
          <strong>{festa.nomeAniversariante}</strong> ({festa.tema})?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

export function ListaFestasScreen() {
  const { festas, deleteFesta, setEditingFesta, setViewingFesta, navigate } = useApp()
  const [sortKey, setSortKey] = useState<SortKey>('proximas')
  const [deletingFesta, setDeletingFesta] = useState<Festa | null>(null)

  const sorted = [...festas].sort((a, b) => {
    if (sortKey === 'proximas') return compareAsc(parseISO(a.data), parseISO(b.data))
    if (sortKey === 'antigas') return compareDesc(parseISO(a.data), parseISO(b.data))
    if (sortKey === 'nome') return a.nomeAniversariante.localeCompare(b.nomeAniversariante)
    if (sortKey === 'tema') return a.tema.localeCompare(b.tema)
    return 0
  })

  const handleEdit = (f: Festa) => { setEditingFesta(f); navigate('cadastrar') }
  const handleView = (f: Festa) => { setViewingFesta(f); navigate('detalhes') }
  const handleDelete = (f: Festa) => { setDeletingFesta(f) }
  const confirmDelete = async () => {
    if (deletingFesta) {
      try {
        await deleteFesta(deletingFesta.id)
      } catch (err) {
        console.error('[v0] Erro ao excluir festa:', err)
      }
      setDeletingFesta(null)
    }
  }

  const SortButton = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
        sortKey === k ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted'
      }`}
      style={sortKey === k ? { background: 'linear-gradient(135deg, var(--agathon-pink), var(--agathon-purple))' } : undefined}
    >
      {label}
      {sortKey === k && (k === 'proximas' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
    </button>
  )

  const horario = (f: Festa) => f.horarioFim ? `${f.horario}–${f.horarioFim}` : f.horario

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-muted-foreground">Ordenar:</span>
          <SortButton k="proximas" label="Próximas" />
          <SortButton k="antigas" label="Antigas" />
          <SortButton k="nome" label="Nome" />
          <SortButton k="tema" label="Tema" />
        </div>
        <button
          onClick={() => { setEditingFesta(null); navigate('cadastrar') }}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white sm:w-auto sm:py-2"
          style={{ background: 'linear-gradient(135deg, var(--agathon-pink), var(--agathon-purple))' }}
        >
          <Plus size={16} />
          Nova Festa
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {festas.length} festa{festas.length !== 1 ? 's' : ''} cadastrada{festas.length !== 1 ? 's' : ''}
      </p>

      {/* Tabela desktop */}
      <div className="hidden lg:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-border"
              style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1154 100%)' }}
            >
              {['Data', 'Horario', 'Nome', 'Tema', 'Tipo', 'Local', 'Conv.', 'Responsavel', 'Telefone', 'Acoes'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/80 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  Nenhuma festa cadastrada
                </td>
              </tr>
            ) : (
              sorted.map((f, i) => (
                <tr
                  key={f.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">{formatDate(f.data)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground text-xs">{horario(f)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    <div className="flex items-center gap-1.5">
                      {f.nomeAniversariante}
                      {f.concluida && (
                        <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" aria-label="Concluída" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{f.tema}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tipoBadgeClass(f.tipo)}`}>
                      {tipoLabel(f.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[130px] truncate">
                    {f.tipo === 'buffet'
                      ? 'Buffet Agathon'
                      : f.tipo === 'domicilio'
                      ? `${f.enderecoFesta?.endereco || ''}, ${f.enderecoFesta?.cidade || ''}`
                      : f.outroEspaco?.nomeEspaco || 'Outro'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">{f.convidados}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{f.responsavel}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-muted-foreground text-xs">{f.telefone}</span>
                      <WhatsAppIcon telefone={f.telefone} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleView(f)}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'var(--agathon-blue)' }}
                        title="Visualizar"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEdit(f)}
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'var(--agathon-gold)' }}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="lg:hidden space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhuma festa cadastrada
          </div>
        ) : (
          sorted.map(f => (
            <div key={f.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    {f.nomeAniversariante}
                    {f.concluida && (
                      <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" aria-label="Concluída" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{f.tema}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tipoBadgeClass(f.tipo)}`}>
                  {tipoLabel(f.tipo)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-1">
                <span>{formatDate(f.data)} {horario(f)}</span>
                <span>{f.convidados} convidados</span>
                <span>{f.responsavel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <span>{f.telefone}</span>
                <WhatsAppIcon telefone={f.telefone} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleView(f)} className="flex-1 rounded-xl border py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors" style={{ borderColor: 'var(--agathon-blue)', color: 'var(--agathon-blue)' }}>
                  <Eye size={13} /> Ver
                </button>
                <button onClick={() => handleEdit(f)} className="flex-1 rounded-xl border py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors" style={{ borderColor: 'var(--agathon-pink)', color: 'var(--agathon-pink)' }}>
                  <Pencil size={13} /> Editar
                </button>
                <button onClick={() => handleDelete(f)} className="flex-1 rounded-xl border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deletingFesta && (
        <DeleteModal festa={deletingFesta} onConfirm={confirmDelete} onCancel={() => setDeletingFesta(null)} />
      )}
    </div>
  )
}

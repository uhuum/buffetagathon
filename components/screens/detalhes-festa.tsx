'use client'

import {
  Calendar,
  Clock,
  User,
  Phone,
  Users,
  MapPin,
  Cake,
  FileText,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  Home,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import Image from 'next/image'
import { useApp } from '@/lib/app-context'
import { formatDateLong, tipoLabel, tipoBadgeClass } from '@/lib/utils-app'
import { whatsappLink } from '@/lib/masks'
import { useState } from 'react'
import { parseISO, differenceInCalendarDays } from 'date-fns'

function InfoRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: React.ElementType
  label: string
  value: string
  action?: React.ReactNode
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: '#fce7f3' }}
      >
        <Icon size={16} style={{ color: 'var(--agathon-pink)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-sm font-medium text-foreground">{value}</p>
          {action}
        </div>
      </div>
    </div>
  )
}

function WhatsAppButton({ telefone }: { telefone: string }) {
  return (
    <a
      href={whatsappLink(telefone)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: '#25d366' }}
      aria-label="Abrir WhatsApp"
    >
      {/* WhatsApp SVG icon */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      WhatsApp
    </a>
  )
}

export function DetalhesFestaScreen() {
  const { viewingFesta, setViewingFesta, setEditingFesta, deleteFesta, setConcluida, navigate } = useApp()
  const [showDelete, setShowDelete] = useState(false)
  const [savingConcluida, setSavingConcluida] = useState(false)

  if (!viewingFesta) {
    navigate('lista')
    return null
  }

  const f = viewingFesta

  // A festa "já passou" quando a data é hoje ou anterior
  const jaPassou = differenceInCalendarDays(parseISO(f.data), new Date()) <= 0

  const handleToggleConcluida = async () => {
    setSavingConcluida(true)
    try {
      await setConcluida(f.id, !f.concluida)
    } catch (err) {
      console.error('[v0] Erro ao atualizar conclusão da festa:', err)
      alert('Não foi possível atualizar o status da festa.')
    } finally {
      setSavingConcluida(false)
    }
  }

  const handleEdit = () => {
    setEditingFesta(f)
    navigate('cadastrar')
  }

  const handleDelete = async () => {
    try {
      await deleteFesta(f.id)
    } catch (err) {
      console.error('[v0] Erro ao excluir festa:', err)
    }
    setViewingFesta(null)
    navigate('lista')
  }

  const handleBack = () => {
    setViewingFesta(null)
    navigate('lista')
  }

  const enderecoCompleto = () => {
    if (f.tipo === 'buffet') return 'Salao Buffet Agathon'
    if (f.tipo === 'domicilio' && f.enderecoFesta) {
      const e = f.enderecoFesta
      return [
        e.endereco && e.numero ? `${e.endereco}, ${e.numero}` : e.endereco,
        e.complemento,
        e.bairro,
        e.cidade,
        e.cep,
      ]
        .filter(Boolean)
        .join(' - ')
    }
    if (f.tipo === 'outro' && f.outroEspaco) {
      const o = f.outroEspaco
      return [o.nomeEspaco, o.endereco, o.cidade].filter(Boolean).join(' - ')
    }
    return ''
  }

  const horarioDisplay = f.horarioFim
    ? `${f.horario} — ${f.horarioFim}`
    : f.horario

  return (
    <div className="mx-auto max-w-2xl">
      {/* Voltar */}
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para a lista
      </button>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-5 sm:px-6 sm:py-6"
          style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1154 100%)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tipoBadgeClass(f.tipo)}`}>
                  {tipoLabel(f.tipo)}
                </span>
                {f.concluida && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                    <CheckCircle2 size={12} />
                    Concluída
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white break-words sm:text-2xl">{f.nomeAniversariante}</h1>
              <p className="text-sm mt-1 break-words sm:text-base" style={{ color: 'var(--agathon-gold)' }}>{f.tema}</p>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Buffet Agathon"
                width={44}
                height={44}
                style={{ width: 44, height: 'auto' }}
                className="object-contain opacity-90 sm:w-14"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 sm:mt-4 sm:gap-4">
            <div className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
              <Calendar size={13} />
              {formatDateLong(f.data)}
            </div>
            <div className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
              <Clock size={13} />
              {horarioDisplay}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-0.5 sm:p-6 sm:space-y-1">
          <InfoRow icon={User} label="Aniversariante" value={`${f.nomeAniversariante}, ${f.idade} anos`} />
          <InfoRow icon={Cake} label="Tema" value={f.tema} />
          <InfoRow icon={Users} label="Quantidade de Convidados" value={`${f.convidados} convidados`} />
          <InfoRow icon={Calendar} label="Data" value={formatDateLong(f.data)} />
          <InfoRow
            icon={Clock}
            label={f.horarioFim ? 'Horário (Início — Término)' : 'Horário de Início'}
            value={horarioDisplay}
          />
          <InfoRow icon={User} label="Responsável" value={f.responsavel} />
          <InfoRow
            icon={Phone}
            label="Telefone / WhatsApp"
            value={f.telefone}
            action={<WhatsAppButton telefone={f.telefone} />}
          />
          <InfoRow icon={Home} label="Tipo da Festa" value={tipoLabel(f.tipo)} />
          <InfoRow icon={MapPin} label="Local" value={enderecoCompleto()} />
          {f.enderecoFesta?.referencia && (
            <InfoRow icon={MapPin} label="Referência" value={f.enderecoFesta.referencia} />
          )}
          {f.observacoes && (
            <InfoRow icon={FileText} label="Observações" value={f.observacoes} />
          )}
        </div>

        {/* Check-in de conclusão */}
        <div className="border-t border-border px-6 py-4">
          {f.concluida ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={18} />
                <span className="text-sm font-semibold">Festa concluída</span>
              </div>
              <button
                onClick={handleToggleConcluida}
                disabled={savingConcluida}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-60"
              >
                <RotateCcw size={13} />
                Reabrir
              </button>
            </div>
          ) : jaPassou ? (
            <button
              onClick={handleToggleConcluida}
              disabled={savingConcluida}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle2 size={17} />
              {savingConcluida ? 'Salvando...' : 'Marcar festa como concluída'}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <CheckCircle2 size={16} />
              O check-in de conclusão fica disponível a partir do dia da festa.
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="border-t border-border px-4 py-3 flex gap-2 sm:px-6 sm:py-4 sm:gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors sm:px-4 sm:gap-2"
          >
            <ArrowLeft size={15} />
            <span className="hidden xs:inline sm:inline">Voltar</span>
          </button>
          <button
            onClick={handleEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:flex-none sm:px-4 sm:gap-2"
            style={{ background: 'linear-gradient(135deg, var(--agathon-pink), var(--agathon-purple))' }}
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors sm:flex-none sm:ml-auto sm:px-4 sm:gap-2"
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      </div>

      {/* Modal de exclusão */}
      {showDelete && (
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
              Tem certeza que deseja excluir a festa de <strong>{f.nomeAniversariante}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

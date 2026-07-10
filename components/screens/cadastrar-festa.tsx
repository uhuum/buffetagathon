'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, X } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { TipoFesta } from '@/lib/types'
import { maskTelefone, maskCep } from '@/lib/masks'

const schema = z.object({
  nomeAniversariante: z.string().min(2, 'Nome obrigatório'),
  idade: z.coerce.number().min(1).max(120),
  tema: z.string().min(2, 'Tema obrigatório'),
  data: z.string().min(1, 'Data obrigatória'),
  horario: z.string().min(1, 'Horário de início obrigatório'),
  horarioFim: z.string().optional(),
  responsavel: z.string().min(2, 'Responsável obrigatório'),
  telefone: z.string().min(8, 'Telefone obrigatório'),
  convidados: z.coerce.number().min(1),
  observacoes: z.string().optional(),
  tipo: z.enum(['buffet', 'domicilio', 'outro'] as const),
  // Domicílio
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  referencia: z.string().optional(),
  // Outro
  nomeEspaco: z.string().optional(),
  enderecoOutro: z.string().optional(),
  cidadeOutro: z.string().optional(),
  obsOutro: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function InputField({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--agathon-pink)] focus:border-transparent transition'

const TIPO_OPTIONS = [
  { value: 'buffet',    label: 'Buffet Agathon', color: 'var(--agathon-blue)',   bg: '#eff8ff', border: '#bfdbfe', text: '#1d4ed8' },
  { value: 'domicilio', label: 'Domicílio',       color: 'var(--agathon-green)',  bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  { value: 'outro',     label: 'Outro Espaço',    color: 'var(--agathon-orange)', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
] as const

export function CadastrarFestaScreen() {
  const { addFesta, updateFesta, editingFesta, setEditingFesta, navigate } = useApp()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'buffet',
      ...(editingFesta
        ? {
            nomeAniversariante: editingFesta.nomeAniversariante,
            idade: editingFesta.idade,
            tema: editingFesta.tema,
            data: editingFesta.data,
            horario: editingFesta.horario,
            horarioFim: editingFesta.horarioFim,
            responsavel: editingFesta.responsavel,
            telefone: editingFesta.telefone,
            convidados: editingFesta.convidados,
            observacoes: editingFesta.observacoes,
            tipo: editingFesta.tipo,
            endereco: editingFesta.enderecoFesta?.endereco,
            numero: editingFesta.enderecoFesta?.numero,
            complemento: editingFesta.enderecoFesta?.complemento,
            bairro: editingFesta.enderecoFesta?.bairro,
            cidade: editingFesta.enderecoFesta?.cidade,
            cep: editingFesta.enderecoFesta?.cep,
            referencia: editingFesta.enderecoFesta?.referencia,
            nomeEspaco: editingFesta.outroEspaco?.nomeEspaco,
            enderecoOutro: editingFesta.outroEspaco?.endereco,
            cidadeOutro: editingFesta.outroEspaco?.cidade,
            obsOutro: editingFesta.outroEspaco?.observacoes,
          }
        : {}),
    },
  })

  const tipo = watch('tipo') as TipoFesta
  const tipoOpt = TIPO_OPTIONS.find(o => o.value === tipo)

  const onSubmit = async (data: FormData) => {
    const base = {
      nomeAniversariante: data.nomeAniversariante,
      idade: data.idade,
      tema: data.tema,
      data: data.data,
      horario: data.horario,
      horarioFim: data.horarioFim || undefined,
      responsavel: data.responsavel,
      telefone: data.telefone,
      convidados: data.convidados,
      observacoes: data.observacoes,
      tipo: data.tipo,
      enderecoFesta:
        data.tipo === 'domicilio'
          ? {
              endereco: data.endereco,
              numero: data.numero,
              complemento: data.complemento,
              bairro: data.bairro,
              cidade: data.cidade,
              cep: data.cep,
              referencia: data.referencia,
            }
          : undefined,
      outroEspaco:
        data.tipo === 'outro'
          ? {
              nomeEspaco: data.nomeEspaco,
              endereco: data.enderecoOutro,
              cidade: data.cidadeOutro,
              observacoes: data.obsOutro,
            }
          : undefined,
      concluida: editingFesta?.concluida ?? false,
    }

    try {
      if (editingFesta) {
        await updateFesta(editingFesta.id, base)
        setEditingFesta(null)
      } else {
        await addFesta(base)
      }
      reset()
      navigate('lista')
    } catch (err) {
      console.error('[v0] Erro ao salvar festa:', err)
      alert('Nao foi possivel salvar a festa. Tente novamente.')
    }
  }

  const handleCancel = () => {
    setEditingFesta(null)
    navigate('lista')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-4 border-b border-border flex items-center gap-4 sm:px-6 sm:py-5"
          style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1154 100%)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">
              {editingFesta ? 'Editar Festa' : 'Cadastrar Nova Festa'}
            </h2>
            <p className="text-xs mt-0.5 sm:text-sm" style={{ color: 'var(--agathon-gold)' }}>
              Preencha todos os campos obrigatórios
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5 sm:p-6 sm:space-y-6">
          {/* Aniversariante */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--agathon-pink)' }} />
              Dados do Aniversariante
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Nome do Aniversariante" error={errors.nomeAniversariante?.message} required>
                <input {...register('nomeAniversariante')} className={inputClass} placeholder="Ex: Henry" />
              </InputField>
              <InputField label="Idade" error={errors.idade?.message} required>
                <input {...register('idade')} type="number" className={inputClass} placeholder="Ex: 5" min="1" max="120" />
              </InputField>
              <div className="sm:col-span-2">
                <InputField label="Tema da Festa" error={errors.tema?.message} required>
                  <input {...register('tema')} className={inputClass} placeholder="Ex: Patrulha Canina" />
                </InputField>
              </div>
            </div>
          </section>

          {/* Data e horários */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--agathon-blue)' }} />
              Data e Horários
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField label="Data" error={errors.data?.message} required>
                <input {...register('data')} type="date" className={inputClass} />
              </InputField>
              <InputField label="Horário de Início" error={errors.horario?.message} required>
                <input {...register('horario')} type="time" className={inputClass} />
              </InputField>
              <InputField label="Horário de Término" error={errors.horarioFim?.message}>
                <input {...register('horarioFim')} type="time" className={inputClass} />
              </InputField>
            </div>
          </section>

          {/* Responsável */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--agathon-orange)' }} />
              Responsável
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField label="Nome do Responsável" error={errors.responsavel?.message} required>
                <input {...register('responsavel')} className={inputClass} placeholder="Ex: Ana Silva" />
              </InputField>
              <InputField label="Telefone / WhatsApp" error={errors.telefone?.message} required>
                <input
                  {...register('telefone')}
                  className={inputClass}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  onChange={e => {
                    const masked = maskTelefone(e.target.value)
                    setValue('telefone', masked, { shouldValidate: true })
                  }}
                />
              </InputField>
              <InputField label="Quantidade de Convidados" error={errors.convidados?.message} required>
                <input {...register('convidados')} type="number" className={inputClass} placeholder="Ex: 80" min="1" />
              </InputField>
              <InputField label="Observações" error={errors.observacoes?.message}>
                <input {...register('observacoes')} className={inputClass} placeholder="Informações adicionais..." />
              </InputField>
            </div>
          </section>

          {/* Tipo da festa */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--agathon-green)' }} />
              Tipo da Festa
            </h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {TIPO_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer rounded-xl border-2 px-4 py-2.5 transition-all"
                  style={
                    tipo === opt.value
                      ? { borderColor: opt.color, backgroundColor: opt.bg, color: opt.text }
                      : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  <input
                    {...register('tipo')}
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                  />
                  <span
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition"
                    style={
                      tipo === opt.value
                        ? { borderColor: opt.color, backgroundColor: opt.color }
                        : { borderColor: 'var(--border)' }
                    }
                  >
                    {tipo === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Buffet — salão único */}
            {tipo === 'buffet' && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: '#eff8ff', border: '1px solid #bfdbfe' }}
              >
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
                  Local — Buffet Agathon
                </p>
                <p className="text-sm text-blue-600 font-medium">Salao Buffet Agathon</p>
                <p className="text-xs text-blue-500 mt-1">O evento sera realizado no salao do Buffet Agathon.</p>
              </div>
            )}

            {/* Domicílio */}
            {tipo === 'domicilio' && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold text-green-700 mb-3 uppercase tracking-wide">
                  Endereco do Domicilio
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <InputField label="Endereço" error={errors.endereco?.message}>
                      <input {...register('endereco')} className={inputClass} placeholder="Rua, Av..." />
                    </InputField>
                  </div>
                  <InputField label="Número" error={errors.numero?.message}>
                    <input {...register('numero')} className={inputClass} placeholder="123" />
                  </InputField>
                  <InputField label="Complemento" error={errors.complemento?.message}>
                    <input {...register('complemento')} className={inputClass} placeholder="Apto, casa..." />
                  </InputField>
                  <InputField label="Bairro" error={errors.bairro?.message}>
                    <input {...register('bairro')} className={inputClass} placeholder="Bairro" />
                  </InputField>
                  <InputField label="CEP" error={errors.cep?.message}>
                    <input
                      {...register('cep')}
                      className={inputClass}
                      placeholder="00000-000"
                      inputMode="numeric"
                      onChange={e => {
                        const masked = maskCep(e.target.value)
                        setValue('cep', masked, { shouldValidate: true })
                      }}
                    />
                  </InputField>
                  <div className="sm:col-span-2">
                    <InputField label="Cidade" error={errors.cidade?.message}>
                      <input {...register('cidade')} className={inputClass} placeholder="Cidade" />
                    </InputField>
                  </div>
                  <div className="sm:col-span-2">
                    <InputField label="Referência" error={errors.referencia?.message}>
                      <input {...register('referencia')} className={inputClass} placeholder="Ponto de referência" />
                    </InputField>
                  </div>
                </div>
              </div>
            )}

            {/* Outro Espaço */}
            {tipo === 'outro' && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                <p className="text-xs font-bold text-orange-700 mb-3 uppercase tracking-wide">
                  Dados do Espaco
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <InputField label="Nome do Espaço" error={errors.nomeEspaco?.message}>
                      <input {...register('nomeEspaco')} className={inputClass} placeholder="Nome do espaço" />
                    </InputField>
                  </div>
                  <InputField label="Endereço" error={errors.enderecoOutro?.message}>
                    <input {...register('enderecoOutro')} className={inputClass} placeholder="Endereço completo" />
                  </InputField>
                  <InputField label="Cidade" error={errors.cidadeOutro?.message}>
                    <input {...register('cidadeOutro')} className={inputClass} placeholder="Cidade" />
                  </InputField>
                  <div className="sm:col-span-2">
                    <InputField label="Observações" error={errors.obsOutro?.message}>
                      <textarea {...register('obsOutro')} className={inputClass} rows={2} placeholder="Informações adicionais sobre o espaço..." />
                    </InputField>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <X size={16} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--agathon-pink), var(--agathon-purple))' }}
            >
              <Save size={16} />
              {editingFesta ? 'Salvar Alterações' : 'Cadastrar Festa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

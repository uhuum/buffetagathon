import { createClient } from './supabase/client'
import { Festa } from './types'

// Linha da tabela `festas` no Supabase (snake_case)
interface FestaRow {
  id: string
  nome_aniversariante: string
  idade: number
  tema: string
  data: string
  horario: string
  horario_fim: string | null
  responsavel: string
  telefone: string
  convidados: number
  observacoes: string | null
  tipo: Festa['tipo']
  endereco_festa: Festa['enderecoFesta'] | null
  outro_espaco: Festa['outroEspaco'] | null
  concluida: boolean | null
  criado_em: string
}

function rowToFesta(row: FestaRow): Festa {
  return {
    id: row.id,
    nomeAniversariante: row.nome_aniversariante,
    idade: row.idade,
    tema: row.tema,
    data: row.data,
    horario: row.horario,
    horarioFim: row.horario_fim ?? undefined,
    responsavel: row.responsavel,
    telefone: row.telefone,
    convidados: row.convidados,
    observacoes: row.observacoes ?? undefined,
    tipo: row.tipo,
    enderecoFesta: row.endereco_festa ?? undefined,
    outroEspaco: row.outro_espaco ?? undefined,
    concluida: row.concluida ?? false,
    criadoEm: row.criado_em,
  }
}

function festaToRow(festa: Omit<Festa, 'id' | 'criadoEm'>) {
  return {
    nome_aniversariante: festa.nomeAniversariante,
    idade: festa.idade,
    tema: festa.tema,
    data: festa.data,
    horario: festa.horario,
    horario_fim: festa.horarioFim ?? null,
    responsavel: festa.responsavel,
    telefone: festa.telefone,
    convidados: festa.convidados,
    observacoes: festa.observacoes ?? null,
    tipo: festa.tipo,
    endereco_festa: festa.enderecoFesta ?? null,
    outro_espaco: festa.outroEspaco ?? null,
    concluida: festa.concluida ?? false,
  }
}

export async function fetchFestas(): Promise<Festa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('festas')
    .select('*')
    .order('data', { ascending: true })

  if (error) throw error
  return (data as FestaRow[]).map(rowToFesta)
}

export async function createFesta(
  festa: Omit<Festa, 'id' | 'criadoEm'>,
): Promise<Festa> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('festas')
    .insert(festaToRow(festa))
    .select('*')
    .single()

  if (error) throw error
  return rowToFesta(data as FestaRow)
}

export async function updateFestaRow(
  id: string,
  festa: Omit<Festa, 'id' | 'criadoEm'>,
): Promise<Festa> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('festas')
    .update(festaToRow(festa))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return rowToFesta(data as FestaRow)
}

export async function deleteFestaRow(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('festas').delete().eq('id', id)
  if (error) throw error
}

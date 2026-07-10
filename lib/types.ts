export type TipoFesta = 'buffet' | 'domicilio' | 'outro'

export interface EnderecoFesta {
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  cep?: string
  referencia?: string
}

export interface OutroEspaco {
  nomeEspaco?: string
  endereco?: string
  cidade?: string
  observacoes?: string
}

export interface Festa {
  id: string
  nomeAniversariante: string
  idade: number
  tema: string
  data: string // ISO date string YYYY-MM-DD
  horario: string // HH:mm - hora de início
  horarioFim?: string // HH:mm - hora de término
  responsavel: string
  telefone: string
  convidados: number
  observacoes?: string
  tipo: TipoFesta
  // Domicílio
  enderecoFesta?: EnderecoFesta
  // Outro Espaço
  outroEspaco?: OutroEspaco
  concluida: boolean
  criadoEm: string
}

export interface AppState {
  festas: Festa[]
  isLoggedIn: boolean
  currentPage: Page
  editingFesta: Festa | null
  viewingFesta: Festa | null
}

export type Page =
  | 'login'
  | 'dashboard'
  | 'calendario'
  | 'cadastrar'
  | 'lista'
  | 'pesquisa'
  | 'exportar'
  | 'configuracoes'
  | 'detalhes'

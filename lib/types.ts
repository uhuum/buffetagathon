export type TipoFesta='buffet'|'domicilio'|'outro'
export interface EnderecoFesta{endereco?:string;numero?:string;complemento?:string;bairro?:string;cidade?:string;cep?:string;referencia?:string}
export interface OutroEspaco{nomeEspaco?:string;endereco?:string;cidade?:string;observacoes?:string}
export interface Festa{id:string;nomeAniversariante:string;idade:number;tema:string;data:string;horario:string;horarioFim?:string;responsavel:string;telefone:string;convidados:number;observacoes?:string;tipo:TipoFesta;enderecoFesta?:EnderecoFesta;outroEspaco?:OutroEspaco;concluida:boolean;criadoEm:string}
export type AtendimentoStatus='agendado'|'confirmado'|'realizado'|'cancelado'
export interface Atendimento{id:string;cliente:string;telefone?:string;data:string;horario:string;observacoes?:string;status:AtendimentoStatus;criadoEm:string}
export interface AppState{festas:Festa[];atendimentos:Atendimento[];isLoggedIn:boolean;currentPage:Page;editingFesta:Festa|null;viewingFesta:Festa|null}
export type Page='login'|'dashboard'|'calendario'|'cadastrar'|'lista'|'pesquisa'|'exportar'|'configuracoes'|'detalhes'|'admin-notificacoes'|'atendimentos'

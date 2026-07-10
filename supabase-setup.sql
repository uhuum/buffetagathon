-- =============================================================================
-- BUFFET AGATHON — Script completo de criação do banco de dados
-- =============================================================================
--
-- Como usar:
--   1. Acesse o Supabase Dashboard → seu projeto → SQL Editor
--   2. Cole todo o conteúdo deste arquivo
--   3. Clique em "Run" (ou pressione Ctrl+Enter)
--
-- Este script é IDEMPOTENTE: pode ser executado múltiplas vezes sem erros.
-- Se a tabela já existir, ela não será recriada nem terá dados apagados.
--
-- Banco de dados: PostgreSQL (Supabase)
-- Versão: 1.0
-- Aplicativo: Buffet Agathon — Agenda de Festas
-- =============================================================================


-- =============================================================================
-- EXTENSÃO: uuid-ossp (garante geração de UUID v4)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- TABELA PRINCIPAL: public.festas
--
-- Armazena todas as festas agendadas pelo Buffet Agathon.
--
-- Tipos de festa (coluna `tipo`):
--   buffet    → realizada no Salão Agathon
--   domicilio → realizada na casa do cliente (usa endereco_festa)
--   outro     → realizada em espaço externo   (usa outro_espaco)
--
-- Campos JSONB:
--   endereco_festa → { endereco, numero, complemento, bairro, cidade, cep, referencia }
--   outro_espaco   → { nomeEspaco, endereco, cidade, observacoes }
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.festas (

  -- -----------------------------------------------------------------------
  -- Chave primária
  -- -----------------------------------------------------------------------
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),

  -- -----------------------------------------------------------------------
  -- Dados do aniversariante
  -- -----------------------------------------------------------------------
  nome_aniversariante TEXT        NOT NULL,
  idade               INTEGER     NOT NULL,
  tema                TEXT        NOT NULL,

  -- -----------------------------------------------------------------------
  -- Data e horários
  -- -----------------------------------------------------------------------
  data                DATE        NOT NULL,
  horario             TEXT        NOT NULL,   -- formato HH:mm (início)
  horario_fim         TEXT        NULL,        -- formato HH:mm (término) — opcional

  -- -----------------------------------------------------------------------
  -- Responsável pelo contato
  -- -----------------------------------------------------------------------
  responsavel         TEXT        NOT NULL,
  telefone            TEXT        NOT NULL,

  -- -----------------------------------------------------------------------
  -- Detalhes gerais
  -- -----------------------------------------------------------------------
  convidados          INTEGER     NOT NULL,
  observacoes         TEXT        NULL,

  -- -----------------------------------------------------------------------
  -- Tipo de local
  -- -----------------------------------------------------------------------
  tipo                TEXT        NOT NULL,

  -- -----------------------------------------------------------------------
  -- Dados de endereço (preenchido apenas quando tipo = 'domicilio')
  -- JSON esperado: { endereco, numero, complemento, bairro, cidade, cep, referencia }
  -- -----------------------------------------------------------------------
  endereco_festa      JSONB       NULL,

  -- -----------------------------------------------------------------------
  -- Dados do espaço externo (preenchido apenas quando tipo = 'outro')
  -- JSON esperado: { nomeEspaco, endereco, cidade, observacoes }
  -- -----------------------------------------------------------------------
  outro_espaco        JSONB       NULL,

  -- -----------------------------------------------------------------------
  -- Status
  -- -----------------------------------------------------------------------
  concluida           BOOLEAN     NOT NULL DEFAULT FALSE,

  -- -----------------------------------------------------------------------
  -- Auditoria
  -- -----------------------------------------------------------------------
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- -----------------------------------------------------------------------
  -- Constraints
  -- -----------------------------------------------------------------------
  CONSTRAINT festas_pkey
    PRIMARY KEY (id),

  CONSTRAINT festas_idade_check
    CHECK (idade >= 1 AND idade <= 120),

  CONSTRAINT festas_convidados_check
    CHECK (convidados >= 1),

  CONSTRAINT festas_tipo_check
    CHECK (tipo IN ('buffet', 'domicilio', 'outro')),

  CONSTRAINT festas_horario_formato_check
    CHECK (horario ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),

  CONSTRAINT festas_horario_fim_formato_check
    CHECK (
      horario_fim IS NULL
      OR horario_fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    )

);


-- =============================================================================
-- COMENTÁRIOS (documentação inline no banco)
-- =============================================================================
COMMENT ON TABLE  public.festas IS
  'Festas agendadas pelo Buffet Agathon.';

COMMENT ON COLUMN public.festas.id IS
  'Identificador único da festa (UUID v4).';

COMMENT ON COLUMN public.festas.nome_aniversariante IS
  'Nome completo do aniversariante.';

COMMENT ON COLUMN public.festas.idade IS
  'Idade do aniversariante. Deve estar entre 1 e 120.';

COMMENT ON COLUMN public.festas.tema IS
  'Tema decorativo da festa (ex: Frozen, Dinossauros, Safari).';

COMMENT ON COLUMN public.festas.data IS
  'Data da festa no formato YYYY-MM-DD.';

COMMENT ON COLUMN public.festas.horario IS
  'Horário de início da festa no formato HH:mm.';

COMMENT ON COLUMN public.festas.horario_fim IS
  'Horário de término da festa no formato HH:mm. Opcional.';

COMMENT ON COLUMN public.festas.responsavel IS
  'Nome da pessoa responsável pelo contato.';

COMMENT ON COLUMN public.festas.telefone IS
  'Telefone de contato do responsável (com máscara, ex: (11) 99999-9999).';

COMMENT ON COLUMN public.festas.convidados IS
  'Quantidade estimada de convidados. Mínimo: 1.';

COMMENT ON COLUMN public.festas.observacoes IS
  'Observações gerais sobre a festa. Campo livre.';

COMMENT ON COLUMN public.festas.tipo IS
  'buffet = Salão Agathon | domicilio = Casa do cliente | outro = Espaço externo.';

COMMENT ON COLUMN public.festas.endereco_festa IS
  'JSON com endereço completo. Preenchido apenas quando tipo = ''domicilio''.
   Estrutura: { endereco, numero, complemento, bairro, cidade, cep, referencia }';

COMMENT ON COLUMN public.festas.outro_espaco IS
  'JSON com dados do espaço externo. Preenchido apenas quando tipo = ''outro''.
   Estrutura: { nomeEspaco, endereco, cidade, observacoes }';

COMMENT ON COLUMN public.festas.concluida IS
  'Indica se a festa já foi realizada (true) ou ainda está agendada (false).';

COMMENT ON COLUMN public.festas.criado_em IS
  'Timestamp de criação do registro com fuso horário.';


-- =============================================================================
-- ÍNDICES
-- Melhoram a performance das consultas mais frequentes do aplicativo.
-- =============================================================================

-- Listagem e calendário: ordenados por data
CREATE INDEX IF NOT EXISTS idx_festas_data
  ON public.festas (data ASC);

-- Filtro por tipo de festa
CREATE INDEX IF NOT EXISTS idx_festas_tipo
  ON public.festas (tipo);

-- Filtro por status de conclusão
CREATE INDEX IF NOT EXISTS idx_festas_concluida
  ON public.festas (concluida);

-- Dashboard e calendário: consultas por mês/período agrupadas por tipo
CREATE INDEX IF NOT EXISTS idx_festas_data_tipo
  ON public.festas (data, tipo);

-- Pesquisa por nome do aniversariante (case-insensitive via ILIKE)
CREATE INDEX IF NOT EXISTS idx_festas_nome_aniversariante
  ON public.festas (lower(nome_aniversariante));

-- Pesquisa por responsável (case-insensitive via ILIKE)
CREATE INDEX IF NOT EXISTS idx_festas_responsavel
  ON public.festas (lower(responsavel));

-- Ordenação por data de criação (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_festas_criado_em
  ON public.festas (criado_em DESC);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
--
-- O aplicativo usa autenticação própria (login hardcoded, sem Supabase Auth).
-- Por isso, as políticas abaixo liberam acesso total via chave anônima (anon key).
--
-- ATENÇÃO: se no futuro você migrar para Supabase Auth, substitua as políticas
-- abaixo por políticas baseadas em auth.uid().
-- =============================================================================
ALTER TABLE public.festas ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes antes de recriar (garante idempotência)
DROP POLICY IF EXISTS "allow_all_select" ON public.festas;
DROP POLICY IF EXISTS "allow_all_insert" ON public.festas;
DROP POLICY IF EXISTS "allow_all_update" ON public.festas;
DROP POLICY IF EXISTS "allow_all_delete" ON public.festas;

-- Leitura total
CREATE POLICY "allow_all_select"
  ON public.festas
  FOR SELECT
  USING (true);

-- Inserção total
CREATE POLICY "allow_all_insert"
  ON public.festas
  FOR INSERT
  WITH CHECK (true);

-- Atualização total
CREATE POLICY "allow_all_update"
  ON public.festas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Exclusão total
CREATE POLICY "allow_all_delete"
  ON public.festas
  FOR DELETE
  USING (true);


-- =============================================================================
-- PERMISSÕES
-- Garante que o papel `anon` (chave pública) e `authenticated` possam operar.
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festas TO authenticated;


-- =============================================================================
-- VERIFICAÇÃO FINAL
-- Exibe um resumo do que foi criado para confirmar o sucesso do script.
-- =============================================================================
SELECT
  'TABELA'                        AS tipo,
  t.table_name                    AS nome,
  'OK'                            AS status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name   = 'festas'

UNION ALL

SELECT
  'INDICE'                        AS tipo,
  i.indexname                     AS nome,
  'OK'                            AS status
FROM pg_indexes i
WHERE i.schemaname = 'public'
  AND i.tablename  = 'festas'

UNION ALL

SELECT
  'POLITICA RLS'                  AS tipo,
  p.policyname                    AS nome,
  'OK'                            AS status
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename  = 'festas'

ORDER BY tipo, nome;

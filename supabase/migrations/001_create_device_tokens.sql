-- Tabela para armazenar tokens FCM dos dispositivos
-- Execute este SQL no painel do Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS device_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  token       text NOT NULL,
  user_id     text NOT NULL DEFAULT 'edna',  -- usuário fixo do sistema
  device_name text,
  browser     text,
  platform    text,
  last_seen   timestamptz NOT NULL DEFAULT now(),
  is_active   boolean NOT NULL DEFAULT true,

  -- Garante que o mesmo token não seja duplicado
  CONSTRAINT device_tokens_token_unique UNIQUE (token)
);

-- Índice para buscar tokens de um usuário rapidamente
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token   ON device_tokens(token);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) - a tabela é gerenciada pelo service role
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Política: permite leitura/escrita via service_role (Edge Functions e API Routes)
-- A anon key NÃO terá acesso direto — tudo passa pela API do Next.js
CREATE POLICY "service_role_all" ON device_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

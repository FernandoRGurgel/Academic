-- 20260626000400_link_receitas_to_trabalhos.sql
-- Vincula a tabela de receitas aos trabalhos e adiciona suporte a origem de trabalho acadêmico.

-- Adicionar referência ao trabalho de origem (nullable – receitas manuais não têm trabalho)
ALTER TABLE receitas
  ADD COLUMN IF NOT EXISTS trabalho_id UUID REFERENCES trabalhos(id) ON DELETE SET NULL;

-- Índice para busca rápida por trabalho
CREATE INDEX IF NOT EXISTS idx_receitas_trabalho_id ON receitas(trabalho_id);
CREATE INDEX IF NOT EXISTS idx_receitas_user_id     ON receitas(user_id);

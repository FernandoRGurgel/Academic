-- 20260626000200_add_trabalho_fields.sql
-- Adiciona colunas complementares à tabela trabalhos para persistir
-- todos os dados inseridos no formulário de cadastro de novo trabalho.

ALTER TABLE trabalhos
  ADD COLUMN IF NOT EXISTS titulo       TEXT,
  ADD COLUMN IF NOT EXISTS instituicao  TEXT,
  ADD COLUMN IF NOT EXISTS curso        TEXT,
  ADD COLUMN IF NOT EXISTS prioridade   TEXT,
  ADD COLUMN IF NOT EXISTS orientador_id UUID REFERENCES orientadores(id) ON DELETE SET NULL;

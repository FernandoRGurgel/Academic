-- 20260626000100_add_orientadores.sql
-- Adiciona suporte para cadastro e vinculação de Orientadores na modelagem do banco de dados

-- =========================================================================
-- 1. CRIAÇÃO DA TABELA DE ORIENTADORES
-- =========================================================================
CREATE TABLE IF NOT EXISTS orientadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    institution TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE orientadores ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. CRIAR POLÍTICAS DE RLS PARA: orientadores
-- =========================================================================
CREATE POLICY "Orientadores owner full access" ON orientadores
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to orientadores" ON orientadores
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = orientadores.user_id)
                OR (resource_type = 'orientadores' AND (resource_id IS NULL AND shared_by = orientadores.user_id))
                OR (resource_type = 'orientadores' AND resource_id = orientadores.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to orientadores" ON orientadores
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = orientadores.user_id)
                OR (resource_type = 'orientadores' AND (resource_id IS NULL AND shared_by = orientadores.user_id))
                OR (resource_type = 'orientadores' AND resource_id = orientadores.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = orientadores.user_id)
                OR (resource_type = 'orientadores' AND (resource_id IS NULL AND shared_by = orientadores.user_id))
                OR (resource_type = 'orientadores' AND resource_id = orientadores.id)
            )
        )
    );

-- =========================================================================
-- 4. ADICIONAR VÍNCULO DE ORIENTADOR EM TRABALHOS
-- =========================================================================
ALTER TABLE trabalhos ADD COLUMN IF NOT EXISTS orientador_id UUID REFERENCES orientadores(id) ON DELETE SET NULL;

-- =========================================================================
-- 5. ATUALIZAR RESTRIÇÃO DE TIPO DE RECURSO EM DATA_SHARING
-- =========================================================================
ALTER TABLE data_sharing DROP CONSTRAINT IF EXISTS data_sharing_resource_type_check;
ALTER TABLE data_sharing ADD CONSTRAINT data_sharing_resource_type_check CHECK (resource_type IN ('all', 'trabalhos', 'clientes', 'instituicoes', 'cursos', 'financeiro', 'orientadores'));

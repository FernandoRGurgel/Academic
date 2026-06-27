-- 20260626000000_create_base_schema.sql
-- Migração inicial de criação de tabelas para o Academic Enterprise Portal com Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TABELA DE COMPARTILHAMENTO E PERMISSÕES (data_sharing)
-- =========================================================================
CREATE TABLE IF NOT EXISTS data_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('all', 'trabalhos', 'clientes', 'instituicoes', 'cursos', 'financeiro')),
    resource_id UUID NULL, -- Se nulo, compartilha todos os recursos do tipo. Se preenchido, apenas o recurso específico.
    permission_level TEXT NOT NULL DEFAULT 'leitor' CHECK (permission_level IN ('leitor', 'editor')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (shared_by, shared_with, resource_type, resource_id)
);

-- =========================================================================
-- 2. TABELA DE TRABALHOS (trabalhos e kanban)
-- =========================================================================
CREATE TABLE IF NOT EXISTS trabalhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cliente_nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data TIMESTAMPTZ DEFAULT now() NOT NULL,
    valor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aguardando pagamento',
    tempo TEXT,
    critico BOOLEAN NOT NULL DEFAULT false,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    column_id TEXT NOT NULL DEFAULT 'aguardando-inicio',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 3. TABELA DE CLIENTES (clientes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    institution TEXT,
    course TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 4. TABELA DE INSTITUIÇÕES (instituicoes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS instituicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Pública',
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 5. TABELA DE CURSOS (cursos)
-- =========================================================================
CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'Graduação',
    duration TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 6. TABELA DE RECEITAS FINANCEIRAS (receitas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS receitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    client TEXT NOT NULL,
    origin TEXT,
    total_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_installment INTEGER NOT NULL DEFAULT 1,
    total_installments INTEGER NOT NULL DEFAULT 1,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aguardando',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 7. TABELA DE DESPESAS FINANCEIRAS (despesas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ DEFAULT now() NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aguardando',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- =========================================================================
-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE data_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- POLÍTICAS DE RLS PARA: data_sharing
-- =========================================================================
CREATE POLICY "Users can manage sharing rules they created" ON data_sharing
    FOR ALL TO authenticated
    USING (auth.uid() = shared_by)
    WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can view sharing rules targeted to them" ON data_sharing
    FOR SELECT TO authenticated
    USING (auth.uid() = shared_with);


-- =========================================================================
-- POLÍTICAS DE RLS PARA: trabalhos
-- =========================================================================
CREATE POLICY "Trabalhos owner full access" ON trabalhos
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to trabalhos" ON trabalhos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = trabalhos.user_id)
                OR (resource_type = 'trabalhos' AND (resource_id IS NULL AND shared_by = trabalhos.user_id))
                OR (resource_type = 'trabalhos' AND resource_id = trabalhos.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to trabalhos" ON trabalhos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = trabalhos.user_id)
                OR (resource_type = 'trabalhos' AND (resource_id IS NULL AND shared_by = trabalhos.user_id))
                OR (resource_type = 'trabalhos' AND resource_id = trabalhos.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = trabalhos.user_id)
                OR (resource_type = 'trabalhos' AND (resource_id IS NULL AND shared_by = trabalhos.user_id))
                OR (resource_type = 'trabalhos' AND resource_id = trabalhos.id)
            )
        )
    );


-- =========================================================================
-- POLÍTICAS DE RLS PARA: clientes
-- =========================================================================
CREATE POLICY "Clientes owner full access" ON clientes
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to clientes" ON clientes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = clientes.user_id)
                OR (resource_type = 'clientes' AND (resource_id IS NULL AND shared_by = clientes.user_id))
                OR (resource_type = 'clientes' AND resource_id = clientes.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to clientes" ON clientes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = clientes.user_id)
                OR (resource_type = 'clientes' AND (resource_id IS NULL AND shared_by = clientes.user_id))
                OR (resource_type = 'clientes' AND resource_id = clientes.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = clientes.user_id)
                OR (resource_type = 'clientes' AND (resource_id IS NULL AND shared_by = clientes.user_id))
                OR (resource_type = 'clientes' AND resource_id = clientes.id)
            )
        )
    );


-- =========================================================================
-- POLÍTICAS DE RLS PARA: instituicoes
-- =========================================================================
CREATE POLICY "Instituicoes owner full access" ON instituicoes
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to instituicoes" ON instituicoes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = instituicoes.user_id)
                OR (resource_type = 'instituicoes' AND (resource_id IS NULL AND shared_by = instituicoes.user_id))
                OR (resource_type = 'instituicoes' AND resource_id = instituicoes.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to instituicoes" ON instituicoes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = instituicoes.user_id)
                OR (resource_type = 'instituicoes' AND (resource_id IS NULL AND shared_by = instituicoes.user_id))
                OR (resource_type = 'instituicoes' AND resource_id = instituicoes.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = instituicoes.user_id)
                OR (resource_type = 'instituicoes' AND (resource_id IS NULL AND shared_by = instituicoes.user_id))
                OR (resource_type = 'instituicoes' AND resource_id = instituicoes.id)
            )
        )
    );


-- =========================================================================
-- POLÍTICAS DE RLS PARA: cursos
-- =========================================================================
CREATE POLICY "Cursos owner full access" ON cursos
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to cursos" ON cursos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = cursos.user_id)
                OR (resource_type = 'cursos' AND (resource_id IS NULL AND shared_by = cursos.user_id))
                OR (resource_type = 'cursos' AND resource_id = cursos.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to cursos" ON cursos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = cursos.user_id)
                OR (resource_type = 'cursos' AND (resource_id IS NULL AND shared_by = cursos.user_id))
                OR (resource_type = 'cursos' AND resource_id = cursos.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = cursos.user_id)
                OR (resource_type = 'cursos' AND (resource_id IS NULL AND shared_by = cursos.user_id))
                OR (resource_type = 'cursos' AND resource_id = cursos.id)
            )
        )
    );


-- =========================================================================
-- POLÍTICAS DE RLS PARA: receitas
-- =========================================================================
CREATE POLICY "Receitas owner full access" ON receitas
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to receitas" ON receitas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = receitas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = receitas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = receitas.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to receitas" ON receitas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = receitas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = receitas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = receitas.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = receitas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = receitas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = receitas.id)
            )
        )
    );


-- =========================================================================
-- POLÍTICAS DE RLS PARA: despesas
-- =========================================================================
CREATE POLICY "Despesas owner full access" ON despesas
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users read access to despesas" ON despesas
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND (
                (resource_type = 'all' AND shared_by = despesas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = despesas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = despesas.id)
            )
        )
    );

CREATE POLICY "Shared users editor write access to despesas" ON despesas
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = despesas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = despesas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = despesas.id)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM data_sharing
            WHERE shared_with = auth.uid()
            AND permission_level = 'editor'
            AND (
                (resource_type = 'all' AND shared_by = despesas.user_id)
                OR (resource_type = 'financeiro' AND (resource_id IS NULL AND shared_by = despesas.user_id))
                OR (resource_type = 'financeiro' AND resource_id = despesas.id)
            )
        )
    );

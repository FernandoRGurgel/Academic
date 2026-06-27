-- 20260626000300_add_financeiro_table.sql
-- Cria a tabela de registros financeiros vinculados a trabalhos,
-- com suporte a pagamento à vista e parcelado (com entrada e parcelas individuais).

-- =========================================================================
-- 1. TABELA PRINCIPAL DE FINANCEIRO (financeiro)
-- =========================================================================
CREATE TABLE IF NOT EXISTS financeiro (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    trabalho_id         UUID REFERENCES trabalhos(id) ON DELETE CASCADE NOT NULL,
    payment_condition   TEXT NOT NULL DEFAULT 'À vista' CHECK (payment_condition IN ('À vista', 'A prazo')),
    total_value         NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    down_payment        NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    first_due_date      DATE,
    interval_days       INTEGER DEFAULT 30,
    installment_count   INTEGER DEFAULT 1,
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 2. TABELA DE PARCELAS INDIVIDUAIS (financeiro_parcelas)
-- =========================================================================
CREATE TABLE IF NOT EXISTS financeiro_parcelas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financeiro_id   UUID REFERENCES financeiro(id) ON DELETE CASCADE NOT NULL,
    numero          INTEGER NOT NULL,          -- Número da parcela (1, 2, 3...)
    valor           NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    due_date        DATE,
    status          TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =========================================================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE financeiro          ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_parcelas ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. POLÍTICAS DE RLS
-- =========================================================================

-- financeiro: dono tem acesso total
CREATE POLICY "Financeiro owner full access" ON financeiro
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- financeiro_parcelas: acesso via financeiro do próprio usuário
CREATE POLICY "Parcelas owner access" ON financeiro_parcelas
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM financeiro f
            WHERE f.id = financeiro_parcelas.financeiro_id
              AND f.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM financeiro f
            WHERE f.id = financeiro_parcelas.financeiro_id
              AND f.user_id = auth.uid()
        )
    );

-- =========================================================================
-- 5. ÍNDICES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_financeiro_trabalho_id    ON financeiro(trabalho_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_user_id        ON financeiro(user_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_financeiro_id    ON financeiro_parcelas(financeiro_id);

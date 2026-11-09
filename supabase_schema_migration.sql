-- ==============================================================================
-- KAEN AUTO MECÂNICA - MIGRATION RELACIONAL DE NOTAS E ITENS
-- Resolve definitivamente o erro PGRST200 de relacionamento e Foreign Key
-- e garante acesso total via RLS (Row Level Security).
-- ==============================================================================

-- 1. TABELA PRINCIPAL DE NOTAS / ORDENS DE SERVIÇO (public.notas)
CREATE TABLE IF NOT EXISTS public.notas (
    id TEXT PRIMARY KEY,
    os_number TEXT NOT NULL,
    client_id TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    vehicle_id TEXT,
    vehicle_plate TEXT NOT NULL,
    vehicle_model TEXT,
    vehicle_km TEXT,
    problem TEXT,
    labor_value NUMERIC(12, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Finalizado',
    payment_status TEXT NOT NULL DEFAULT 'Pendente',
    payment_method TEXT,
    observations TEXT,
    proof_photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE ITENS DA NOTA (public.itens_nota) COM FOREIGN KEY EXPLÍCITA
CREATE TABLE IF NOT EXISTS public.itens_nota (
    id TEXT PRIMARY KEY,
    nota_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount, 0.00)) STORED,
    type TEXT NOT NULL DEFAULT 'SERVICE', -- 'SERVICE' ou 'PART'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRIAÇÃO OU ATUALIZAÇÃO DA FOREIGN KEY ENTRE ITENS E NOTAS
-- Se a constraint já existir, este bloco a valida; se não existir, cria com ON DELETE CASCADE.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_itens_nota_nota' 
        AND table_name = 'itens_nota'
    ) THEN
        ALTER TABLE public.itens_nota 
        ADD CONSTRAINT fk_itens_nota_nota 
        FOREIGN KEY (nota_id) 
        REFERENCES public.notas(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_itens_nota_nota_id ON public.itens_nota(nota_id);
CREATE INDEX IF NOT EXISTS idx_notas_os_number ON public.notas(os_number);
CREATE INDEX IF NOT EXISTS idx_notas_vehicle_plate ON public.notas(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_notas_client_name ON public.notas(client_name);

-- 5. CONFIGURAÇÃO DE POLÍTICAS DE ACESSO (ROW LEVEL SECURITY - RLS)
-- Permite leitura e escrita sem bloqueio para a aplicação
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_nota ENABLE ROW LEVEL SECURITY;

-- Políticas para NOTAS
DROP POLICY IF EXISTS "Permitir leitura de notas" ON public.notas;
CREATE POLICY "Permitir leitura de notas" 
ON public.notas FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir insercao de notas" ON public.notas;
CREATE POLICY "Permitir insercao de notas" 
ON public.notas FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de notas" ON public.notas;
CREATE POLICY "Permitir atualizacao de notas" 
ON public.notas FOR UPDATE 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de notas" ON public.notas;
CREATE POLICY "Permitir exclusao de notas" 
ON public.notas FOR DELETE 
TO anon, authenticated 
USING (true);

-- Políticas para ITENS DA NOTA
DROP POLICY IF EXISTS "Permitir leitura de itens da nota" ON public.itens_nota;
CREATE POLICY "Permitir leitura de itens da nota" 
ON public.itens_nota FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir insercao de itens da nota" ON public.itens_nota;
CREATE POLICY "Permitir insercao de itens da nota" 
ON public.itens_nota FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de itens da nota" ON public.itens_nota;
CREATE POLICY "Permitir atualizacao de itens da nota" 
ON public.itens_nota FOR UPDATE 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de itens da nota" ON public.itens_nota;
CREATE POLICY "Permitir exclusao de itens da nota" 
ON public.itens_nota FOR DELETE 
TO anon, authenticated 
USING (true);

-- 6. TABELA COMPATÍVEL LEGADA (kaen_store)
CREATE TABLE IF NOT EXISTS public.kaen_store (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.kaen_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura kaen_store anon" ON public.kaen_store;
CREATE POLICY "Permitir leitura kaen_store anon" ON public.kaen_store FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir gravacao kaen_store anon" ON public.kaen_store;
CREATE POLICY "Permitir gravacao kaen_store anon" ON public.kaen_store FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao kaen_store anon" ON public.kaen_store;
CREATE POLICY "Permitir atualizacao kaen_store anon" ON public.kaen_store FOR UPDATE TO anon, authenticated USING (true);

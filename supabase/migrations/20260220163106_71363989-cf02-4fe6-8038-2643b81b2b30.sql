ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS pedido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_prevista_chegada date NULL;
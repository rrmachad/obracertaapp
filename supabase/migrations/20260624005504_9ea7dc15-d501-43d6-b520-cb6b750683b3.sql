ALTER TABLE public.movimentacao_estoque
  ADD COLUMN IF NOT EXISTS preco_unitario_momento NUMERIC(10, 2);

ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS valor_receita NUMERIC(12, 2);
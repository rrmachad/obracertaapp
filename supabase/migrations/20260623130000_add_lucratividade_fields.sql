-- Add price-at-moment to stock movements (recorded when a transaction happens)
ALTER TABLE public.movimentacao_estoque
  ADD COLUMN IF NOT EXISTS preco_unitario_momento NUMERIC(10, 2);

-- Add expected contract revenue to obras (filled by the contractor)
ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS valor_receita NUMERIC(12, 2);

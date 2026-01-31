-- Tabela para armazenar o PIN de admin por obra
CREATE TABLE public.obra_pin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(obra_id)
);

-- Enable RLS
ALTER TABLE public.obra_pin ENABLE ROW LEVEL SECURITY;

-- Policies: apenas o dono da obra pode gerenciar o PIN
CREATE POLICY "Users can view own obra pin"
ON public.obra_pin FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.obras WHERE obras.id = obra_pin.obra_id AND obras.user_id = auth.uid()
));

CREATE POLICY "Users can insert own obra pin"
ON public.obra_pin FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.obras WHERE obras.id = obra_pin.obra_id AND obras.user_id = auth.uid()
));

CREATE POLICY "Users can update own obra pin"
ON public.obra_pin FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.obras WHERE obras.id = obra_pin.obra_id AND obras.user_id = auth.uid()
));

CREATE POLICY "Users can delete own obra pin"
ON public.obra_pin FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.obras WHERE obras.id = obra_pin.obra_id AND obras.user_id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_obra_pin_updated_at
BEFORE UPDATE ON public.obra_pin
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de logs de alterações do diário
CREATE TABLE public.diario_log_alteracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diario_id UUID NOT NULL REFERENCES public.diario_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diario_log_alteracoes ENABLE ROW LEVEL SECURITY;

-- Policies para logs de alterações
CREATE POLICY "Users can view own diario alteracoes"
ON public.diario_log_alteracoes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.diario_log dl
  JOIN public.obras o ON o.id = dl.obra_id
  WHERE dl.id = diario_log_alteracoes.diario_id AND o.user_id = auth.uid()
));

CREATE POLICY "Users can insert own diario alteracoes"
ON public.diario_log_alteracoes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.diario_log dl
  JOIN public.obras o ON o.id = dl.obra_id
  WHERE dl.id = diario_log_alteracoes.diario_id AND o.user_id = auth.uid()
));

-- Tabela de movimentação de estoque (entrada/saída)
CREATE TABLE public.movimentacao_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade NUMERIC NOT NULL,
  observacao TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;

-- Policies para movimentação de estoque
CREATE POLICY "Users can view own movimentacao"
ON public.movimentacao_estoque FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.materiais m
  JOIN public.obras o ON o.id = m.obra_id
  WHERE m.id = movimentacao_estoque.material_id AND o.user_id = auth.uid()
));

CREATE POLICY "Users can insert own movimentacao"
ON public.movimentacao_estoque FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.materiais m
  JOIN public.obras o ON o.id = m.obra_id
  WHERE m.id = movimentacao_estoque.material_id AND o.user_id = auth.uid()
));

CREATE POLICY "Users can update own movimentacao"
ON public.movimentacao_estoque FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.materiais m
  JOIN public.obras o ON o.id = m.obra_id
  WHERE m.id = movimentacao_estoque.material_id AND o.user_id = auth.uid()
));

CREATE POLICY "Users can delete own movimentacao"
ON public.movimentacao_estoque FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.materiais m
  JOIN public.obras o ON o.id = m.obra_id
  WHERE m.id = movimentacao_estoque.material_id AND o.user_id = auth.uid()
));
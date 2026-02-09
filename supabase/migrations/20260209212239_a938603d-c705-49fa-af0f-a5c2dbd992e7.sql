
-- 1. Adicionar valor do contrato de mão de obra nos itens do cronograma
ALTER TABLE public.cronograma_itens
ADD COLUMN valor_contrato_mao_de_obra NUMERIC DEFAULT NULL;

-- 2. Adicionar percentual de retenção técnica padrão na obra
ALTER TABLE public.obras
ADD COLUMN retencao_tecnica_percentual NUMERIC NOT NULL DEFAULT 5;

-- 3. Criar tabela de adiantamentos (vales)
CREATE TABLE public.adiantamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC NOT NULL,
  descricao TEXT,
  abatido_em_medicao_id UUID DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.adiantamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adiantamentos"
ON public.adiantamentos FOR SELECT
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = adiantamentos.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can insert own adiantamentos"
ON public.adiantamentos FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = adiantamentos.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can update own adiantamentos"
ON public.adiantamentos FOR UPDATE
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = adiantamentos.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can delete own adiantamentos"
ON public.adiantamentos FOR DELETE
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = adiantamentos.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users with access can view adiantamentos"
ON public.adiantamentos FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

CREATE POLICY "Users with access can insert adiantamentos"
ON public.adiantamentos FOR INSERT
WITH CHECK (has_obra_access(auth.uid(), obra_id));

-- 4. Criar tabela de medições
CREATE TABLE public.medicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  fase_id UUID REFERENCES public.fases(id),
  cronograma_item_id UUID REFERENCES public.cronograma_itens(id),
  data_medicao DATE NOT NULL DEFAULT CURRENT_DATE,
  percentual_anterior NUMERIC NOT NULL DEFAULT 0,
  percentual_atual NUMERIC NOT NULL DEFAULT 0,
  percentual_avanco_periodo NUMERIC GENERATED ALWAYS AS (percentual_atual - percentual_anterior) STORED,
  valor_contrato_referencia NUMERIC NOT NULL DEFAULT 0,
  valor_bruto_medido NUMERIC NOT NULL DEFAULT 0,
  valor_retencao_tecnica NUMERIC NOT NULL DEFAULT 0,
  retencao_percentual_aplicado NUMERIC NOT NULL DEFAULT 5,
  valor_adiantamentos_descontados NUMERIC NOT NULL DEFAULT 0,
  valor_liquido_a_pagar NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'aprovada',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medicoes"
ON public.medicoes FOR SELECT
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = medicoes.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can insert own medicoes"
ON public.medicoes FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = medicoes.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can update own medicoes"
ON public.medicoes FOR UPDATE
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = medicoes.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users can delete own medicoes"
ON public.medicoes FOR DELETE
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = medicoes.obra_id AND obras.user_id = auth.uid()));

CREATE POLICY "Users with access can view medicoes"
ON public.medicoes FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- 5. Adicionar FK do adiantamento para medição
ALTER TABLE public.adiantamentos
ADD CONSTRAINT adiantamentos_abatido_em_medicao_id_fkey
FOREIGN KEY (abatido_em_medicao_id) REFERENCES public.medicoes(id);

-- 6. Triggers de updated_at
CREATE TRIGGER update_adiantamentos_updated_at
BEFORE UPDATE ON public.adiantamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicoes_updated_at
BEFORE UPDATE ON public.medicoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

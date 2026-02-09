
-- Allow users with obra_access to view diario_log of shared obras
CREATE POLICY "Users with access can view diario logs"
ON public.diario_log FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to insert diario_log on shared obras
CREATE POLICY "Users with access can insert diario logs"
ON public.diario_log FOR INSERT
WITH CHECK (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to update diario_log on shared obras
CREATE POLICY "Users with access can update diario logs"
ON public.diario_log FOR UPDATE
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to view cronograma_itens of shared obras
CREATE POLICY "Users with access can view cronograma items"
ON public.cronograma_itens FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to insert cronograma_itens on shared obras
CREATE POLICY "Users with access can insert cronograma items"
ON public.cronograma_itens FOR INSERT
WITH CHECK (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to update cronograma_itens on shared obras
CREATE POLICY "Users with access can update cronograma items"
ON public.cronograma_itens FOR UPDATE
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to view materiais of shared obras
CREATE POLICY "Users with access can view materiais"
ON public.materiais FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to insert materiais on shared obras
CREATE POLICY "Users with access can insert materiais"
ON public.materiais FOR INSERT
WITH CHECK (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to update materiais on shared obras
CREATE POLICY "Users with access can update materiais"
ON public.materiais FOR UPDATE
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to view consumo_diario of shared obras
CREATE POLICY "Users with access can view consumo diario"
ON public.consumo_diario FOR SELECT
USING (EXISTS (
  SELECT 1 FROM diario_log dl
  WHERE dl.id = consumo_diario.diario_id
  AND has_obra_access(auth.uid(), dl.obra_id)
));

-- Allow users with obra_access to insert consumo_diario on shared obras
CREATE POLICY "Users with access can insert consumo diario"
ON public.consumo_diario FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM diario_log dl
  WHERE dl.id = consumo_diario.diario_id
  AND has_obra_access(auth.uid(), dl.obra_id)
));

-- Allow users with obra_access to view obra_pin of shared obras
CREATE POLICY "Users with access can view obra pin"
ON public.obra_pin FOR SELECT
USING (has_obra_access(auth.uid(), obra_id));

-- Allow users with obra_access to view movimentacao_estoque of shared obras
CREATE POLICY "Users with access can view movimentacao"
ON public.movimentacao_estoque FOR SELECT
USING (EXISTS (
  SELECT 1 FROM materiais m
  WHERE m.id = movimentacao_estoque.material_id
  AND has_obra_access(auth.uid(), m.obra_id)
));

-- Allow users with obra_access to insert movimentacao_estoque on shared obras
CREATE POLICY "Users with access can insert movimentacao"
ON public.movimentacao_estoque FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM materiais m
  WHERE m.id = movimentacao_estoque.material_id
  AND has_obra_access(auth.uid(), m.obra_id)
));

-- Allow users with obra_access to view diario_log_alteracoes of shared obras
CREATE POLICY "Users with access can view diario alteracoes"
ON public.diario_log_alteracoes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM diario_log dl
  WHERE dl.id = diario_log_alteracoes.diario_id
  AND has_obra_access(auth.uid(), dl.obra_id)
));

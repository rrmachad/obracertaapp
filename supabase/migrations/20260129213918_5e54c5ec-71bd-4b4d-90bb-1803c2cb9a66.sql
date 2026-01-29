-- Adicionar política de UPDATE para a tabela consumo_diario
CREATE POLICY "Users can update own consumo diario"
ON public.consumo_diario
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM diario_log dl
    JOIN obras o ON o.id = dl.obra_id
    WHERE dl.id = consumo_diario.diario_id
    AND o.user_id = auth.uid()
  )
);
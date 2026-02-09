
-- Fix views to use security_invoker = true (security best practice)
CREATE OR REPLACE VIEW public.obras_portal
WITH (security_invoker = true) AS
SELECT 
  o.id,
  o.nome,
  o.endereco,
  o.foto_capa,
  o.progresso,
  o.status,
  o.token_portal,
  o.portal_ativo
FROM public.obras o
WHERE o.portal_ativo = true;

CREATE OR REPLACE VIEW public.cronograma_portal
WITH (security_invoker = true) AS
SELECT 
  ci.id,
  ci.obra_id,
  ci.fase_id,
  ci.descricao,
  ci.status,
  ci.ordem,
  ci.data_conclusao,
  f.nome as fase_nome,
  f.icone as fase_icone,
  f.ordem as fase_ordem
FROM public.cronograma_itens ci
JOIN public.fases f ON f.id = ci.fase_id
JOIN public.obras o ON o.id = ci.obra_id
WHERE o.portal_ativo = true;

CREATE OR REPLACE VIEW public.fotos_portal
WITH (security_invoker = true) AS
SELECT 
  dl.id,
  dl.obra_id,
  dl.data,
  dl.fotos,
  dl.atividades_realizadas
FROM public.diario_log dl
JOIN public.obras o ON o.id = dl.obra_id
WHERE o.portal_ativo = true AND dl.fotos IS NOT NULL AND dl.fotos != '[]'::jsonb;

-- Add RLS policies for portal access on base tables (for anon users via views)
-- obras: allow anon to SELECT obras where portal_ativo = true
CREATE POLICY "Anon can view portal obras"
ON public.obras FOR SELECT TO anon
USING (portal_ativo = true);

-- cronograma_itens: allow anon to SELECT items of portal-active obras
CREATE POLICY "Anon can view portal cronograma items"
ON public.cronograma_itens FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.obras WHERE id = cronograma_itens.obra_id AND portal_ativo = true
));

-- diario_log: allow anon to SELECT diario of portal-active obras (photos only view handles filtering)
CREATE POLICY "Anon can view portal diario photos"
ON public.diario_log FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.obras WHERE id = diario_log.obra_id AND portal_ativo = true
));

-- fases: already has "Anyone can view fases" policy, so anon can already access it

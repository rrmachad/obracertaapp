
-- Add portal columns to obras table
ALTER TABLE public.obras 
ADD COLUMN IF NOT EXISTS token_portal UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS portal_ativo BOOLEAN NOT NULL DEFAULT false;

-- Create index on token_portal for fast lookups
CREATE INDEX IF NOT EXISTS idx_obras_token_portal ON public.obras(token_portal) WHERE portal_ativo = true;

-- Create a view for public portal access (no financial data)
CREATE OR REPLACE VIEW public.obras_portal
WITH (security_invoker = false) AS
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

-- Grant anon access to the view
GRANT SELECT ON public.obras_portal TO anon;
GRANT SELECT ON public.obras_portal TO authenticated;

-- Create a view for portal cronograma (phases + items, no financial data)
CREATE OR REPLACE VIEW public.cronograma_portal
WITH (security_invoker = false) AS
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

GRANT SELECT ON public.cronograma_portal TO anon;
GRANT SELECT ON public.cronograma_portal TO authenticated;

-- Create a view for portal photos from diario_log (no financial data, just photos and dates)
CREATE OR REPLACE VIEW public.fotos_portal
WITH (security_invoker = false) AS
SELECT 
  dl.id,
  dl.obra_id,
  dl.data,
  dl.fotos,
  dl.atividades_realizadas
FROM public.diario_log dl
JOIN public.obras o ON o.id = dl.obra_id
WHERE o.portal_ativo = true AND dl.fotos IS NOT NULL AND dl.fotos != '[]'::jsonb;

GRANT SELECT ON public.fotos_portal TO anon;
GRANT SELECT ON public.fotos_portal TO authenticated;

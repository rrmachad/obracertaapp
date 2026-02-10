
-- Recreate view WITHOUT security_invoker so anon can access branding via the view
DROP VIEW IF EXISTS public.portal_branding;

CREATE OR REPLACE VIEW public.portal_branding AS
SELECT
  o.id AS obra_id,
  o.token_portal,
  us.empresa_nome,
  us.empresa_logo_url,
  us.whatsapp
FROM public.obras o
LEFT JOIN public.user_settings us ON us.user_id = o.user_id
WHERE o.portal_ativo = true;

-- Grant access
GRANT SELECT ON public.portal_branding TO anon;
GRANT SELECT ON public.portal_branding TO authenticated;

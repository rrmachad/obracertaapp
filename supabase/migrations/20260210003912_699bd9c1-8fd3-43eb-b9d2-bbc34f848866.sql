
-- Add whatsapp column to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Create a view to expose branding info for portal (joins obras with user_settings)
CREATE OR REPLACE VIEW public.portal_branding WITH (security_invoker = true) AS
SELECT
  o.id AS obra_id,
  o.token_portal,
  us.empresa_nome,
  us.empresa_logo_url,
  us.whatsapp
FROM public.obras o
LEFT JOIN public.user_settings us ON us.user_id = o.user_id
WHERE o.portal_ativo = true;

-- Allow anon to read portal_branding
GRANT SELECT ON public.portal_branding TO anon;
GRANT SELECT ON public.portal_branding TO authenticated;

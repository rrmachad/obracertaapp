-- Remover o default antigo primeiro
ALTER TABLE public.diario_log 
  ALTER COLUMN fotos DROP DEFAULT;

-- Criar função auxiliar para converter text[] para jsonb com legendas
CREATE OR REPLACE FUNCTION public.convert_fotos_to_jsonb(fotos_array text[])
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  foto text;
BEGIN
  IF fotos_array IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  FOREACH foto IN ARRAY fotos_array
  LOOP
    result := result || jsonb_build_object('url', foto, 'legenda', '');
  END LOOP;
  
  RETURN result;
END;
$$;

-- Alterar coluna fotos de text[] para jsonb para suportar legendas
ALTER TABLE public.diario_log 
  ALTER COLUMN fotos TYPE jsonb 
  USING public.convert_fotos_to_jsonb(fotos);

-- Definir novo valor padrão como array JSON vazio
ALTER TABLE public.diario_log 
  ALTER COLUMN fotos SET DEFAULT '[]'::jsonb;

-- Remover função auxiliar (não é mais necessária)
DROP FUNCTION public.convert_fotos_to_jsonb(text[]);
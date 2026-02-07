-- Adicionar coluna para registrar profissionais no diário
ALTER TABLE public.diario_log
ADD COLUMN profissionais jsonb DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.diario_log.profissionais IS 'Array de objetos {funcao: string, quantidade: number} registrando trabalhadores na obra no dia';

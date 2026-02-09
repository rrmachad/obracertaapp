-- Adicionar constraint UNIQUE em user_id na tabela subscriptions
-- Isso permite usar upsert corretamente

-- Primeiro, remover duplicatas se houver (manter apenas a mais recente)
DELETE FROM public.subscriptions a
USING public.subscriptions b
WHERE a.user_id = b.user_id 
  AND a.created_at < b.created_at;

-- Adicionar constraint UNIQUE
ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);

-- Adicionar política de INSERT para admins (para o upsert funcionar)
CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
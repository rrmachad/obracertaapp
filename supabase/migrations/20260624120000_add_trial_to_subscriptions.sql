-- FASE 1: Trial de 7 dias no plano Construtora para novos cadastros
-- Afeta SOMENTE novos INSERTs em auth.users (trigger AFTER INSERT).
-- Usuários existentes NÃO são alterados por esta migration.

-- 1. Adiciona coluna de expiração do trial (nullable — NULL = sem trial / já convertido)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Atualiza a função que o trigger chama ao criar um novo usuário
--    Antes: plan = 'free', max_users = 1, sem trial
--    Depois: plan = 'gold', max_users = 3, trial_ends_at = agora + 7 dias
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, max_users, trial_ends_at)
  VALUES (NEW.id, 'gold', 3, NOW() + INTERVAL '7 days');

  -- Novos usuários recebem role 'user' (não 'admin')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

-- ============================================================
-- AÇÃO SEPARADA — NÃO EXECUTAR AGORA
-- Rodar SOMENTE após confirmação explícita do usuário.
-- Reativa trial de 7 dias para contas existentes que caíram em
-- 'free' por causa do trigger antigo (sem o trial prometido).
--
-- ANTES de executar, rode o SELECT abaixo para revisar os afetados:
--
-- SELECT u.email, s.plan, s.created_at
-- FROM public.subscriptions s
-- JOIN auth.users u ON u.id = s.user_id
-- WHERE s.plan = 'free'
-- ORDER BY s.created_at;
--
-- UPDATE retroativo (só após revisão e confirmação):
--
-- UPDATE public.subscriptions
-- SET plan = 'gold',
--     trial_ends_at = NOW() + INTERVAL '7 days'
-- WHERE plan = 'free';
-- ============================================================

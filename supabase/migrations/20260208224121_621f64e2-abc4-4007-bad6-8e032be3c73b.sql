-- Permitir que admins vejam todos os profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que admins atualizem qualquer profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que admins vejam todas as subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Permitir que admins atualizem qualquer subscription
CREATE POLICY "Admins can update any subscription"
ON public.subscriptions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Adicionar coluna para bloquear usuários
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;

-- Adicionar coluna para armazenar o email do usuário (para facilitar consultas)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;
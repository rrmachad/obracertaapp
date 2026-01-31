-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para planos de assinatura
CREATE TYPE public.subscription_plan AS ENUM ('free', 'start', 'gold', 'premium');

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Tabela de assinaturas/planos
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  max_users INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de convites de usuários (PINs automáticos)
CREATE TABLE public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pin_code TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de acesso de usuários às obras
CREATE TABLE public.obra_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (obra_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_access ENABLE ROW LEVEL SECURITY;

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin de uma obra
CREATE OR REPLACE FUNCTION public.is_obra_admin(_user_id UUID, _obra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.obras WHERE id = _obra_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.obra_access 
    WHERE obra_id = _obra_id AND user_id = _user_id AND role = 'admin'
  )
$$;

-- Função para verificar se usuário tem acesso a uma obra
CREATE OR REPLACE FUNCTION public.has_obra_access(_user_id UUID, _obra_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.obras WHERE id = _obra_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.obra_access 
    WHERE obra_id = _obra_id AND user_id = _user_id
  )
$$;

-- Função para obter limite de usuários por plano
CREATE OR REPLACE FUNCTION public.get_plan_user_limit(_plan subscription_plan)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN 1
    WHEN 'start' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'premium' THEN 5
    ELSE 1
  END
$$;

-- Função para gerar PIN automático de 6 dígitos
CREATE OR REPLACE FUNCTION public.generate_pin()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
$$;

-- RLS Policies para user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para subscriptions
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies para user_invites
CREATE POLICY "Obra admins can manage invites"
ON public.user_invites FOR ALL
USING (public.is_obra_admin(auth.uid(), obra_id));

CREATE POLICY "Anyone can view unused invites to use them"
ON public.user_invites FOR SELECT
USING (used_by IS NULL);

-- RLS Policies para obra_access
CREATE POLICY "Users can view own access"
ON public.obra_access FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Obra admins can view all access"
ON public.obra_access FOR SELECT
USING (public.is_obra_admin(auth.uid(), obra_id));

CREATE POLICY "Obra admins can manage access"
ON public.obra_access FOR ALL
USING (public.is_obra_admin(auth.uid(), obra_id));

-- Trigger para criar subscription padrão ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, max_users)
  VALUES (NEW.id, 'free', 1);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Atualizar updated_at em subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Corrigir funções sem search_path definido
CREATE OR REPLACE FUNCTION public.get_plan_user_limit(_plan subscription_plan)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN 1
    WHEN 'start' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'premium' THEN 5
    ELSE 1
  END
$$;

CREATE OR REPLACE FUNCTION public.generate_pin()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
$$;
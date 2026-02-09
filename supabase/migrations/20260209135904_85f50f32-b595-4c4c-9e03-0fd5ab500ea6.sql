-- Fix: Change trigger to assign 'user' role by default (not 'admin')
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, max_users)
  VALUES (NEW.id, 'free', 1);
  
  -- New users get 'user' role, NOT 'admin'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Fix existing users: demote non-owner users to 'user' role
-- Keep only the first user (Bruno) as admin, demote others
UPDATE public.user_roles 
SET role = 'user' 
WHERE user_id IN ('c65c6f0c-9a63-407c-803e-85065150c15e', '4c129907-0767-4c3e-b567-41bbcdc9239e');
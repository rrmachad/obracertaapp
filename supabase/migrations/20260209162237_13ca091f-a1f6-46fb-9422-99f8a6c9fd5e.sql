
-- Update has_obra_access to grant access to ALL obras of the owner who invited the user
CREATE OR REPLACE FUNCTION public.has_obra_access(_user_id uuid, _obra_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    -- User owns the obra
    SELECT 1 FROM public.obras WHERE id = _obra_id AND user_id = _user_id
  ) OR EXISTS (
    -- User has direct access to the obra
    SELECT 1 FROM public.obra_access 
    WHERE obra_id = _obra_id AND user_id = _user_id
  ) OR EXISTS (
    -- User was invited by the obra's owner → access to ALL owner's obras
    SELECT 1 FROM public.obra_access oa
    JOIN public.obras o ON o.user_id = oa.granted_by
    WHERE o.id = _obra_id AND oa.user_id = _user_id
  )
$$;

-- Add RLS policy so invited users can view ALL obras from their license owner
CREATE POLICY "Invited users can view all owner obras"
ON public.obras FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.obra_access oa
  WHERE oa.user_id = auth.uid()
  AND oa.granted_by = obras.user_id
));

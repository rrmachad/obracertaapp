
-- 1. Allow users with obra_access to SELECT the obra
CREATE POLICY "Users can view obras they have access to"
ON public.obras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.obra_access
    WHERE obra_access.obra_id = obras.id
    AND obra_access.user_id = auth.uid()
  )
);

-- 2. Allow obra owners to read profiles of users they granted access to
CREATE POLICY "Obra owners can view profiles of their invited users"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.obra_access
    WHERE obra_access.granted_by = auth.uid()
    AND obra_access.user_id = profiles.user_id
  )
);

-- 3. Allow users who share an obra to view each other's profiles (for collaboration context)
CREATE POLICY "Users can view profiles of users sharing same obra"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.obra_access oa1
    JOIN public.obra_access oa2 ON oa1.obra_id = oa2.obra_id
    WHERE oa1.user_id = auth.uid()
    AND oa2.user_id = profiles.user_id
  )
);

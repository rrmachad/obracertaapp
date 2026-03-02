DROP POLICY IF EXISTS "Users can update own obras" ON public.obras;

CREATE POLICY "Owners and obra admins can update obras"
ON public.obras
FOR UPDATE
USING (
  auth.uid() = user_id OR public.is_obra_admin(auth.uid(), id)
)
WITH CHECK (
  auth.uid() = user_id OR public.is_obra_admin(auth.uid(), id)
);
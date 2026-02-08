-- Permitir que admins vejam todas as obras
CREATE POLICY "Admins can view all obras"
ON public.obras
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
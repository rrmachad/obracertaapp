-- Allow platform admins to view all obra_access records
CREATE POLICY "Platform admins can view all obra_access"
ON public.obra_access
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow invited users to view the subscription of the license owner who invited them
CREATE POLICY "Invited users can view owner subscription"
ON public.subscriptions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.obra_access oa
  WHERE oa.user_id = auth.uid()
  AND oa.granted_by = subscriptions.user_id
));


-- Allow inserting notifications for users who own obras the current user has access to
-- This enables notifying obra owners when invited users perform actions
CREATE POLICY "Users can notify obra owners"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obra_access oa
    WHERE oa.user_id = auth.uid()
      AND oa.granted_by = notifications.user_id
  )
);

-- Also allow users to notify themselves (keep existing)
-- The existing policy "Authenticated users can receive notifications" covers self-notifications

-- Create a server-side function to create notifications (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data);
END;
$$;

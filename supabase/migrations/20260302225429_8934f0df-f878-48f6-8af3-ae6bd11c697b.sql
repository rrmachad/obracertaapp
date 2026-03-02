
-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- More restrictive: only authenticated users can receive notifications targeting themselves
CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

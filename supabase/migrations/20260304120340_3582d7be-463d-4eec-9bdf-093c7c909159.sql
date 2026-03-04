
-- Create function to clean up expired invites older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_invites
  WHERE used_by IS NULL
    AND expires_at < now() - interval '30 days';
END;
$$;

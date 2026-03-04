
ALTER TABLE public.user_invites 
ADD COLUMN expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days');

-- Set expiration for any existing unused invites
UPDATE public.user_invites 
SET expires_at = created_at + interval '7 days' 
WHERE used_by IS NULL;

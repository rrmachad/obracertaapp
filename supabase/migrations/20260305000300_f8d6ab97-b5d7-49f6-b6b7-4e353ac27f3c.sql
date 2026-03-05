
-- Add obra_id to fases table (nullable = global template phase)
ALTER TABLE public.fases ADD COLUMN obra_id uuid REFERENCES public.obras(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_fases_obra_id ON public.fases(obra_id);

-- RLS policies for per-obra phase management
-- Users can insert phases for their own obras
CREATE POLICY "Users can insert own obra fases"
ON public.fases FOR INSERT TO authenticated
WITH CHECK (
  obra_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.obras WHERE id = fases.obra_id AND user_id = auth.uid())
);

-- Users can update phases for their own obras
CREATE POLICY "Users can update own obra fases"
ON public.fases FOR UPDATE TO authenticated
USING (
  obra_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.obras WHERE id = fases.obra_id AND user_id = auth.uid())
);

-- Users can delete phases for their own obras
CREATE POLICY "Users can delete own obra fases"
ON public.fases FOR DELETE TO authenticated
USING (
  obra_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.obras WHERE id = fases.obra_id AND user_id = auth.uid())
);

-- Users with access can view obra-specific fases
CREATE POLICY "Users with access can view obra fases"
ON public.fases FOR SELECT TO authenticated
USING (
  obra_id IS NOT NULL AND has_obra_access(auth.uid(), obra_id)
);

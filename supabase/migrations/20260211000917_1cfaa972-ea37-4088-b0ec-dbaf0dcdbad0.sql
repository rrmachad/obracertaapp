
-- Add measurement system column to obras table
ALTER TABLE public.obras 
ADD COLUMN sistema_medidas text NOT NULL DEFAULT 'metrico';

-- Add check constraint for valid values
ALTER TABLE public.obras 
ADD CONSTRAINT obras_sistema_medidas_check 
CHECK (sistema_medidas IN ('metrico', 'imperial'));

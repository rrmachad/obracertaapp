-- Add payment status fields to medicoes
-- New medições start as 'pendente'; existing rows will be handled separately after user confirmation.

ALTER TABLE public.medicoes
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_pagamento IN ('pendente', 'pago')),
  ADD COLUMN IF NOT EXISTS data_recebimento DATE;

-- NOTE: Existing rows are intentionally left as 'pendente' (the DEFAULT).
-- Run the following UPDATE separately after confirming with the user:
--   UPDATE public.medicoes SET status_pagamento = 'pago' WHERE created_at < NOW();

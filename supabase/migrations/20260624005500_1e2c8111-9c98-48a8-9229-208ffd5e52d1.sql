ALTER TABLE public.medicoes
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_pagamento IN ('pendente', 'pago')),
  ADD COLUMN IF NOT EXISTS data_recebimento DATE;
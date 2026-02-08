-- Tabela para log de ações administrativas
CREATE TABLE public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comentário para documentação
COMMENT ON TABLE public.admin_action_logs IS 'Log de ações administrativas para auditoria';
COMMENT ON COLUMN public.admin_action_logs.action_type IS 'Tipo de ação: change_plan, toggle_block, toggle_admin';

-- Enable RLS
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver os logs
CREATE POLICY "Admins can view admin action logs"
ON public.admin_action_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir logs
CREATE POLICY "Admins can insert admin action logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Criar índice para buscas
CREATE INDEX idx_admin_action_logs_created_at ON public.admin_action_logs(created_at DESC);
CREATE INDEX idx_admin_action_logs_target_user ON public.admin_action_logs(target_user_id);
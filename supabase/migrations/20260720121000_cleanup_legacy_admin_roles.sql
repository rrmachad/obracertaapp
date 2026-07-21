-- =====================================================================
-- Item #5 — Rebaixa contas com role 'admin' herdado do bug antigo
--
-- Até a migration de 2026-02-09 (85f50f32), o trigger
-- handle_new_user_subscription atribuía role 'admin' a TODO novo signup.
-- Contas criadas antes dessa data permanecem com 'admin' de plataforma e
-- passam em has_role(admin) e nos checks das edge functions admin.
--
-- ⚠️  NÃO EXECUTE esta migration enquanto a lista de e-mails a PRESERVAR
--     estiver com os valores placeholder abaixo.
--
--     Rode ANTES o SELECT de auditoria (entregue à parte), decida quem
--     deve continuar admin de plataforma e substitua os e-mails na lista.
--     Se a lista ficar vazia/placeholder, TODOS os admins seriam
--     rebaixados — inclusive você.
-- =====================================================================

-- Converte admin -> user quando o usuário ainda NÃO possui linha 'user'
UPDATE public.user_roles r
SET role = 'user'
WHERE r.role = 'admin'
  AND r.user_id NOT IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'SUBSTITUIR_ADMIN_1@exemplo.com',   -- <-- trocar pelos e-mails reais
      'SUBSTITUIR_ADMIN_2@exemplo.com'    -- <-- (adicione/remova linhas)
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles u
    WHERE u.user_id = r.user_id AND u.role = 'user'
  );

-- Remove a linha 'admin' quando já existe uma linha 'user' (evita
-- violar o UNIQUE(user_id, role) e deixa o usuário só com 'user')
DELETE FROM public.user_roles r
WHERE r.role = 'admin'
  AND r.user_id NOT IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'SUBSTITUIR_ADMIN_1@exemplo.com',   -- <-- trocar pelos e-mails reais
      'SUBSTITUIR_ADMIN_2@exemplo.com'    -- <-- (adicione/remova linhas)
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles u
    WHERE u.user_id = r.user_id AND u.role = 'user'
  );

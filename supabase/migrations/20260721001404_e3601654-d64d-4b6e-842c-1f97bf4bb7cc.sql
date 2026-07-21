-- MIGRATION 1: secure invites RPC
CREATE OR REPLACE FUNCTION public.validate_invite(p_pin text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_expires timestamptz; v_found boolean := false;
BEGIN
  SELECT ui.expires_at, true INTO v_expires, v_found
  FROM public.user_invites ui
  WHERE ui.pin_code = p_pin AND ui.used_by IS NULL
  LIMIT 1;
  IF NOT v_found THEN RETURN jsonb_build_object('valid', false, 'expired', false); END IF;
  IF v_expires IS NOT NULL AND v_expires < now() THEN
    RETURN jsonb_build_object('valid', false, 'expired', true);
  END IF;
  RETURN jsonb_build_object('valid', true, 'expired', false);
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_invite(p_pin text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid(); v_invite public.user_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;
  SELECT * INTO v_invite FROM public.user_invites ui
  WHERE ui.pin_code = p_pin AND ui.used_by IS NULL
  LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'invalid'); END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  IF EXISTS (SELECT 1 FROM public.obras o WHERE o.id = v_invite.obra_id AND o.user_id = v_uid)
     OR EXISTS (SELECT 1 FROM public.obra_access oa WHERE oa.obra_id = v_invite.obra_id AND oa.user_id = v_uid) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_has_access', 'obra_id', v_invite.obra_id);
  END IF;
  UPDATE public.user_invites SET used_by = v_uid, used_at = now() WHERE id = v_invite.id;
  INSERT INTO public.obra_access (obra_id, user_id, role, granted_by)
  VALUES (v_invite.obra_id, v_uid, v_invite.role, v_invite.invited_by);
  RETURN jsonb_build_object('success', true, 'obra_id', v_invite.obra_id, 'role', v_invite.role);
END; $$;

REVOKE ALL ON FUNCTION public.validate_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text) TO authenticated;

DROP POLICY IF EXISTS "Anyone can view unused invites to use them" ON public.user_invites;

-- MIGRATION 2: secure portal RPC
CREATE OR REPLACE FUNCTION public.get_portal_data(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_obra record; v_token uuid;
BEGIN
  IF p_token IS NULL THEN RETURN NULL; END IF;
  BEGIN v_token := p_token::uuid; EXCEPTION WHEN others THEN RETURN NULL; END;
  SELECT o.id, o.nome, o.endereco, o.foto_capa, o.progresso, o.status, o.user_id
  INTO v_obra FROM public.obras o
  WHERE o.token_portal = v_token AND o.portal_ativo = true
  LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'obra', jsonb_build_object(
      'id', v_obra.id, 'nome', v_obra.nome, 'endereco', v_obra.endereco,
      'foto_capa', v_obra.foto_capa, 'progresso', v_obra.progresso, 'status', v_obra.status
    ),
    'branding', (
      SELECT jsonb_build_object('empresa_nome', us.empresa_nome,
             'empresa_logo_url', us.empresa_logo_url, 'whatsapp', us.whatsapp)
      FROM public.user_settings us WHERE us.user_id = v_obra.user_id LIMIT 1
    ),
    'cronograma', COALESCE((
      SELECT jsonb_agg(item ORDER BY item.fase_ordem, item.ordem)
      FROM (
        SELECT ci.id, ci.obra_id, ci.fase_id, ci.descricao, ci.status, ci.ordem,
               ci.data_conclusao, f.nome AS fase_nome, f.icone AS fase_icone, f.ordem AS fase_ordem
        FROM public.cronograma_itens ci
        JOIN public.fases f ON f.id = ci.fase_id
        WHERE ci.obra_id = v_obra.id
      ) item
    ), '[]'::jsonb),
    'fotos', COALESCE((
      SELECT jsonb_agg(foto ORDER BY foto.data DESC)
      FROM (
        SELECT dl.id, dl.data, dl.fotos
        FROM public.diario_log dl
        WHERE dl.obra_id = v_obra.id
          AND dl.fotos IS NOT NULL
          AND dl.fotos::text NOT IN ('[]', '{}', 'null')
        ORDER BY dl.data DESC LIMIT 30
      ) foto
    ), '[]'::jsonb)
  );
END; $$;

REVOKE ALL ON FUNCTION public.get_portal_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_data(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anon can view portal obras"            ON public.obras;
DROP POLICY IF EXISTS "Anon can view portal cronograma items" ON public.cronograma_itens;
DROP POLICY IF EXISTS "Anon can view portal diario photos"    ON public.diario_log;

DROP VIEW IF EXISTS public.portal_branding;
DROP VIEW IF EXISTS public.fotos_portal;
DROP VIEW IF EXISTS public.cronograma_portal;
DROP VIEW IF EXISTS public.obras_portal;
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailNotificationRequest {
  type: "medicao_criada" | "estoque_baixo" | "cronograma_concluido";
  obra_id: string;
  details: Record<string, unknown>;
}

function buildEmailContent(type: string, details: Record<string, unknown>, obraNome: string): { subject: string; html: string } {
  switch (type) {
    case "medicao_criada":
      return {
        subject: `Nova medição registrada - ${obraNome}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Nova Medição Registrada 📊</h2>
            <p>Uma nova medição foi criada na obra <strong>${obraNome}</strong>.</p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Descrição:</strong> ${details.item_descricao || "Medição"}</p>
              ${details.criado_por ? `<p style="margin: 8px 0 0;"><strong>Registrado por:</strong> ${details.criado_por}</p>` : ""}
            </div>
            <p>Acesse o ObraCerta para ver os detalhes completos.</p>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">— Equipe ObraCerta</p>
          </div>
        `,
      };

    case "estoque_baixo":
      return {
        subject: `⚠️ Estoque baixo: ${details.material_nome} - ${obraNome}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #d97706;">Alerta de Estoque Baixo ⚠️</h2>
            <p>Um material atingiu o nível mínimo na obra <strong>${obraNome}</strong>.</p>
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #d97706;">
              <p style="margin: 0;"><strong>Material:</strong> ${details.material_nome}</p>
              <p style="margin: 8px 0 0;"><strong>Quantidade atual:</strong> ${details.qtd_atual} ${details.unidade || "un"}</p>
              <p style="margin: 8px 0 0;"><strong>Quantidade mínima:</strong> ${details.qtd_minima}</p>
            </div>
            <p>Providencie a reposição para evitar atrasos na obra.</p>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">— Equipe ObraCerta</p>
          </div>
        `,
      };

    case "cronograma_concluido":
      return {
        subject: `✅ Item concluído - ${obraNome}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Item do Cronograma Concluído ✅</h2>
            <p>Um item foi marcado como concluído na obra <strong>${obraNome}</strong>.</p>
            <div style="background: #d1fae5; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #059669;">
              <p style="margin: 0;"><strong>Item:</strong> ${details.item_descricao}</p>
              ${details.concluido_por ? `<p style="margin: 8px 0 0;"><strong>Concluído por:</strong> ${details.concluido_por}</p>` : ""}
            </div>
            <p>Acesse o ObraCerta para acompanhar o progresso.</p>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">— Equipe ObraCerta</p>
          </div>
        `,
      };

    default:
      return {
        subject: `Notificação - ${obraNome}`,
        html: `<p>Você recebeu uma notificação sobre a obra ${obraNome}.</p>`,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify JWT to get caller identity
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, obra_id, details }: EmailNotificationRequest = await req.json();

    if (!type || !obra_id) {
      return new Response(JSON.stringify({ error: "type e obra_id são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get obra info and owner
    const { data: obra } = await supabaseAdmin
      .from("obras")
      .select("user_id, nome")
      .eq("id", obra_id)
      .single();

    if (!obra) {
      return new Response(JSON.stringify({ error: "Obra não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get owner's email
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("nome, email")
      .eq("user_id", obra.user_id)
      .single();

    if (!ownerProfile?.email) {
      return new Response(JSON.stringify({ error: "E-mail do proprietário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email
    const { subject, html } = buildEmailContent(type, details, obra.nome);

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ sent: false, reason: "RESEND_API_KEY not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ObraCerta <noreply@updates.obracertaapp.com>",
        to: [ownerProfile.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ sent: false, error: err }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-notification-email error:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

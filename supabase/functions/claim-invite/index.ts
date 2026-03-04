import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmailNotification(ownerEmail: string, ownerName: string, guestName: string, obraNome: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not configured, skipping email notification");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "ObraCerta <noreply@updates.obracertaapp.com>",
        to: [ownerEmail],
        subject: `${guestName} aceitou seu convite - ${obraNome}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">Convite Aceito! 🎉</h2>
            <p>Olá <strong>${ownerName}</strong>,</p>
            <p><strong>${guestName}</strong> aceitou seu convite e agora tem acesso à obra <strong>${obraNome}</strong>.</p>
            <p style="color: #666; font-size: 14px; margin-top: 24px;">— Equipe ObraCerta</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    }
  } catch (e) {
    console.error("Email send error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin_code, email, password, nome } = await req.json();

    if (!pin_code || !email || !password || !nome) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: pin_code, email, password, nome" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Validate PIN - find unused invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("user_invites")
      .select("*")
      .eq("pin_code", pin_code)
      .is("used_by", null)
      .maybeSingle();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "PIN inválido ou já utilizado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Este convite expirou. Solicite um novo ao administrador." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Este email já está cadastrado. Use login normal." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create user account (auto-confirmed since invited via PIN)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Erro ao criar conta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // 4. Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: userId,
        nome,
        email,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // 5. Mark invite as used
    const { error: updateError } = await supabaseAdmin
      .from("user_invites")
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Error updating invite:", updateError);
    }

    // 6. Create obra_access
    const { error: accessError } = await supabaseAdmin
      .from("obra_access")
      .insert({
        obra_id: invite.obra_id,
        user_id: userId,
        role: invite.role,
        granted_by: invite.invited_by,
      });

    if (accessError) {
      console.error("Error creating access:", accessError);
    }

    // 7. Notify the owner (in-app + email)
    try {
      // Get obra name
      const { data: obra } = await supabaseAdmin
        .from("obras")
        .select("nome")
        .eq("id", invite.obra_id)
        .single();

      const obraNome = obra?.nome || "Obra";

      // In-app notification
      await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: invite.invited_by,
          type: "invite_accepted",
          title: "Convite aceito!",
          message: `${nome} aceitou seu convite e agora tem acesso à obra "${obraNome}".`,
          data: {
            guest_name: nome,
            guest_email: email,
            obra_id: invite.obra_id,
            obra_nome: obraNome,
          },
        });

      // Get owner info for email
      const { data: ownerProfile } = await supabaseAdmin
        .from("profiles")
        .select("nome, email")
        .eq("user_id", invite.invited_by)
        .single();

      if (ownerProfile?.email) {
        await sendEmailNotification(
          ownerProfile.email,
          ownerProfile.nome || "Proprietário",
          nome,
          obraNome
        );
      }
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
      // Don't fail the whole flow for notification errors
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta criada com sucesso! Faça login com seu email e senha.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Claim invite error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

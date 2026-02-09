import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // 7. The user_roles trigger (handle_new_user_subscription) already creates 'user' role
    // No need to manually insert role

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

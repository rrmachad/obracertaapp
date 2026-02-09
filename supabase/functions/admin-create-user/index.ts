import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const planMaxUsers: Record<string, number> = {
  free: 1,
  start: 2,
  gold: 3,
  premium: 5,
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CREATE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");

    logStep("Admin authenticated", { adminId: adminUser.id });

    // Verificar se o usuário é admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) throw new Error(`Role check error: ${roleError.message}`);
    if (!roleData) throw new Error("User is not an admin");

    logStep("Admin role verified");

    // Obter dados do body
    const body = await req.json();
    const { email, password, nome, plan } = body;

    if (!email || !password || !nome || !plan) {
      throw new Error("Missing required fields: email, password, nome, plan");
    }

    logStep("Creating user", { email, nome, plan });

    // Criar usuário com Supabase Admin
    const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
    });

    if (createError) throw new Error(`User creation error: ${createError.message}`);
    if (!newUserData.user) throw new Error("Failed to create user");

    const newUserId = newUserData.user.id;
    logStep("User created", { newUserId });

    // Criar profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        user_id: newUserId,
        nome,
        email,
      });

    if (profileError) {
      logStep("Profile creation error", { error: profileError.message });
      // Não falhar por erro no profile, pois o trigger pode ter criado
    }

    // Criar/Atualizar subscription com o plano escolhido
    const maxUsers = planMaxUsers[plan] || 1;
    const { error: subsError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: newUserId,
        plan,
        max_users: maxUsers,
        status: 'active',
      }, { onConflict: 'user_id' });

    if (subsError) {
      logStep("Subscription creation error", { error: subsError.message });
    }

    // Criar role de usuário padrão
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: newUserId,
        role: 'user',
      }, { onConflict: 'user_id' });

    if (roleInsertError) {
      logStep("Role insert error", { error: roleInsertError.message });
    }

    // Registrar log de ação administrativa
    await supabaseClient
      .from('admin_action_logs')
      .insert({
        admin_user_id: adminUser.id,
        target_user_id: newUserId,
        action_type: 'create_user',
        action_details: { email, nome, plan },
      });

    logStep("User created successfully", { newUserId, email, plan });

    return new Response(JSON.stringify({
      success: true,
      user_id: newUserId,
      email,
      nome,
      plan,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

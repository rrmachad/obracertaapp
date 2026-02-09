import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-DELETE-USER] ${step}${detailsStr}`);
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
    const { userId, userName, userEmail } = body;

    if (!userId) {
      throw new Error("Missing required field: userId");
    }

    // Impedir que o admin delete a si mesmo
    if (userId === adminUser.id) {
      throw new Error("Cannot delete your own account");
    }

    logStep("Deleting user", { userId, userName, userEmail });

    // Registrar log de ação administrativa ANTES de deletar (para ter o registro)
    await supabaseClient
      .from('admin_action_logs')
      .insert({
        admin_user_id: adminUser.id,
        target_user_id: userId,
        action_type: 'delete_user',
        action_details: { 
          deleted_user_name: userName || 'unknown',
          deleted_user_email: userEmail || 'unknown',
        },
      });

    logStep("Action logged");

    // Deletar dados relacionados manualmente (em ordem para respeitar foreign keys)
    
    // 1. Deletar consumo_diario de diários das obras do usuário
    const { data: userObras } = await supabaseClient
      .from('obras')
      .select('id')
      .eq('user_id', userId);

    if (userObras && userObras.length > 0) {
      const obraIds = userObras.map(o => o.id);
      
      // Buscar diários dessas obras
      const { data: diarios } = await supabaseClient
        .from('diario_log')
        .select('id')
        .in('obra_id', obraIds);

      if (diarios && diarios.length > 0) {
        const diarioIds = diarios.map(d => d.id);
        
        // Deletar consumo_diario
        await supabaseClient
          .from('consumo_diario')
          .delete()
          .in('diario_id', diarioIds);

        // Deletar diario_log_alteracoes
        await supabaseClient
          .from('diario_log_alteracoes')
          .delete()
          .in('diario_id', diarioIds);
      }

      // Deletar diario_log
      await supabaseClient
        .from('diario_log')
        .delete()
        .in('obra_id', obraIds);

      // Buscar materiais dessas obras
      const { data: materiais } = await supabaseClient
        .from('materiais')
        .select('id')
        .in('obra_id', obraIds);

      if (materiais && materiais.length > 0) {
        const materialIds = materiais.map(m => m.id);
        
        // Deletar movimentacao_estoque
        await supabaseClient
          .from('movimentacao_estoque')
          .delete()
          .in('material_id', materialIds);
      }

      // Deletar materiais
      await supabaseClient
        .from('materiais')
        .delete()
        .in('obra_id', obraIds);

      // Deletar cronograma_itens
      await supabaseClient
        .from('cronograma_itens')
        .delete()
        .in('obra_id', obraIds);

      // Deletar obra_pin
      await supabaseClient
        .from('obra_pin')
        .delete()
        .in('obra_id', obraIds);

      // Deletar obra_access
      await supabaseClient
        .from('obra_access')
        .delete()
        .in('obra_id', obraIds);

      // Deletar user_invites
      await supabaseClient
        .from('user_invites')
        .delete()
        .in('obra_id', obraIds);

      // Deletar obras
      await supabaseClient
        .from('obras')
        .delete()
        .eq('user_id', userId);
    }

    logStep("Obras and related data deleted");

    // 2. Deletar dados do usuário em outras tabelas
    await supabaseClient
      .from('obra_access')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('user_invites')
      .delete()
      .eq('invited_by', userId);

    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    logStep("User related data deleted");

    // 3. Deletar usuário do Auth
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw new Error(`Failed to delete user from auth: ${deleteError.message}`);
    }

    logStep("User deleted successfully", { userId });

    return new Response(JSON.stringify({
      success: true,
      message: "User deleted successfully",
      deleted_user_id: userId,
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

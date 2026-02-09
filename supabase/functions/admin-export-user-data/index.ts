import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-EXPORT-USER-DATA] ${step}${detailsStr}`);
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
    const { userId } = body;

    if (!userId) {
      throw new Error("Missing required field: userId");
    }

    logStep("Exporting user data", { userId });

    // Buscar profile do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Buscar subscription
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Buscar roles
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    // Buscar configurações
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Buscar obras do usuário
    const { data: obras } = await supabaseClient
      .from('obras')
      .select('*')
      .eq('user_id', userId);

    const obraIds = obras?.map(o => o.id) || [];
    
    let diarios: unknown[] = [];
    let materiais: unknown[] = [];
    let cronogramaItens: unknown[] = [];
    let consumoDiario: unknown[] = [];
    let diarioAlteracoes: unknown[] = [];
    let movimentacaoEstoque: unknown[] = [];
    let obraPins: unknown[] = [];
    let obraAccess: unknown[] = [];
    let userInvites: unknown[] = [];

    if (obraIds.length > 0) {
      // Buscar diários das obras
      const { data: diariosData } = await supabaseClient
        .from('diario_log')
        .select('*')
        .in('obra_id', obraIds);
      diarios = diariosData || [];

      const diarioIds = diarios.map((d: { id: string }) => d.id);

      if (diarioIds.length > 0) {
        // Buscar consumo diário
        const { data: consumoData } = await supabaseClient
          .from('consumo_diario')
          .select('*')
          .in('diario_id', diarioIds);
        consumoDiario = consumoData || [];

        // Buscar alterações de diário
        const { data: alteracoesData } = await supabaseClient
          .from('diario_log_alteracoes')
          .select('*')
          .in('diario_id', diarioIds);
        diarioAlteracoes = alteracoesData || [];
      }

      // Buscar materiais
      const { data: materiaisData } = await supabaseClient
        .from('materiais')
        .select('*')
        .in('obra_id', obraIds);
      materiais = materiaisData || [];

      const materialIds = materiais.map((m: { id: string }) => m.id);

      if (materialIds.length > 0) {
        // Buscar movimentações de estoque
        const { data: movData } = await supabaseClient
          .from('movimentacao_estoque')
          .select('*')
          .in('material_id', materialIds);
        movimentacaoEstoque = movData || [];
      }

      // Buscar cronograma
      const { data: cronogramaData } = await supabaseClient
        .from('cronograma_itens')
        .select('*')
        .in('obra_id', obraIds);
      cronogramaItens = cronogramaData || [];

      // Buscar PINs de obra
      const { data: pinsData } = await supabaseClient
        .from('obra_pin')
        .select('*')
        .in('obra_id', obraIds);
      obraPins = pinsData || [];

      // Buscar acessos à obra
      const { data: accessData } = await supabaseClient
        .from('obra_access')
        .select('*')
        .in('obra_id', obraIds);
      obraAccess = accessData || [];

      // Buscar convites
      const { data: invitesData } = await supabaseClient
        .from('user_invites')
        .select('*')
        .in('obra_id', obraIds);
      userInvites = invitesData || [];
    }

    // Buscar acessos concedidos pelo usuário
    const { data: grantedAccess } = await supabaseClient
      .from('obra_access')
      .select('*')
      .eq('user_id', userId);

    // Buscar convites criados pelo usuário
    const { data: createdInvites } = await supabaseClient
      .from('user_invites')
      .select('*')
      .eq('invited_by', userId);

    // Montar objeto de exportação
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: adminUser.id,
        targetUserId: userId,
      },
      profile,
      subscription,
      roles,
      settings,
      obras: obras?.map(obra => ({
        ...obra,
        diarios: diarios.filter((d: { obra_id: string }) => d.obra_id === obra.id),
        materiais: materiais.filter((m: { obra_id: string }) => m.obra_id === obra.id),
        cronograma: cronogramaItens.filter((c: { obra_id: string }) => c.obra_id === obra.id),
        pin: obraPins.find((p: { obra_id: string }) => p.obra_id === obra.id),
        acessos: obraAccess.filter((a: { obra_id: string }) => a.obra_id === obra.id),
        convites: userInvites.filter((i: { obra_id: string }) => i.obra_id === obra.id),
      })),
      consumoDiario,
      diarioAlteracoes,
      movimentacaoEstoque,
      acessosConcedidos: grantedAccess,
      convitesCriados: createdInvites,
      estatisticas: {
        totalObras: obras?.length || 0,
        totalDiarios: diarios.length,
        totalMateriais: materiais.length,
        totalCronogramaItens: cronogramaItens.length,
      },
    };

    logStep("User data exported successfully", { 
      userId,
      stats: exportData.estatisticas 
    });

    return new Response(JSON.stringify({
      success: true,
      data: exportData,
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

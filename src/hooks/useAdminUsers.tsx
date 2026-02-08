import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { startOfMonth } from 'date-fns';

export interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  empresa: string | null;
  telefone: string | null;
  blocked: boolean;
  created_at: string;
  plan: 'free' | 'start' | 'gold' | 'premium' | null;
  role: 'admin' | 'user' | null;
  total_obras: number;
}

export interface AdminActionLog {
  id: string;
  admin_user_id: string;
  admin_name?: string;
  target_user_id: string;
  target_name?: string;
  action_type: string;
  action_details: Record<string, unknown> | null;
  created_at: string;
}

export interface UserMetrics {
  total: number;
  byPlan: Record<string, number>;
  newThisMonth: number;
  blocked: number;
  admins: number;
}

export function useAdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Verificar se o usuário atual é admin
  const isAdminQuery = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id,
  });

  // Listar todos os usuários (apenas para admins)
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status');

      if (subsError) throw subsError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Buscar contagem de obras por usuário
      const { data: obrasCount, error: obrasError } = await supabase
        .from('obras')
        .select('user_id');

      if (obrasError) throw obrasError;

      // Mapear dados
      const subsMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const obrasMap = new Map<string, number>();
      
      obrasCount?.forEach(o => {
        obrasMap.set(o.user_id, (obrasMap.get(o.user_id) || 0) + 1);
      });

      const users: AdminUser[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        nome: p.nome,
        email: p.email,
        empresa: p.empresa,
        telefone: p.telefone,
        blocked: p.blocked || false,
        created_at: p.created_at,
        plan: subsMap.get(p.user_id)?.plan || null,
        role: rolesMap.get(p.user_id) || null,
        total_obras: obrasMap.get(p.user_id) || 0,
      }));

      return users;
    },
    enabled: isAdminQuery.data === true,
  });

  // Calcular métricas
  const metrics: UserMetrics = {
    total: usersQuery.data?.length || 0,
    byPlan: {
      free: usersQuery.data?.filter(u => !u.plan || u.plan === 'free').length || 0,
      start: usersQuery.data?.filter(u => u.plan === 'start').length || 0,
      gold: usersQuery.data?.filter(u => u.plan === 'gold').length || 0,
      premium: usersQuery.data?.filter(u => u.plan === 'premium').length || 0,
    },
    newThisMonth: usersQuery.data?.filter(u => {
      const createdAt = new Date(u.created_at);
      return createdAt >= startOfMonth(new Date());
    }).length || 0,
    blocked: usersQuery.data?.filter(u => u.blocked).length || 0,
    admins: usersQuery.data?.filter(u => u.role === 'admin').length || 0,
  };

  // Buscar logs de ações administrativas
  const logsQuery = useQuery({
    queryKey: ['admin-action-logs'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = [...new Set([
        ...(logs?.map(l => l.admin_user_id) || []),
        ...(logs?.map(l => l.target_user_id) || [])
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.nome]) || []);

      return (logs || []).map(log => ({
        ...log,
        admin_name: profileMap.get(log.admin_user_id) || 'Admin',
        target_name: profileMap.get(log.target_user_id) || 'Usuário',
      })) as AdminActionLog[];
    },
    enabled: isAdminQuery.data === true,
  });

  // Função para registrar log de ação
  const logAction = async (targetUserId: string, actionType: string, details: Record<string, string | boolean | number>) => {
    if (!user?.id) return;
    
    await supabase
      .from('admin_action_logs')
      .insert([{
        admin_user_id: user.id,
        target_user_id: targetUserId,
        action_type: actionType,
        action_details: details,
      }]);
    
    queryClient.invalidateQueries({ queryKey: ['admin-action-logs'] });
  };

  // Mapeamento de max_users por plano
  const planMaxUsers: Record<string, number> = {
    free: 1,
    start: 2,
    gold: 3,
    premium: 5,
  };

  // Atualizar plano do usuário
  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan, previousPlan }: { userId: string; plan: 'free' | 'start' | 'gold' | 'premium'; previousPlan?: string }) => {
      const maxUsers = planMaxUsers[plan];
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          plan, 
          max_users: maxUsers,
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Registrar log
      await logAction(userId, 'change_plan', { 
        from: previousPlan || 'unknown', 
        to: plan 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Plano atualizado",
        description: "O plano do usuário foi alterado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bloquear/Desbloquear usuário
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ blocked, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Registrar log
      await logAction(userId, 'toggle_block', { blocked });
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: blocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: blocked 
          ? "O usuário foi bloqueado e não poderá mais acessar o sistema."
          : "O usuário foi desbloqueado e pode acessar o sistema novamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Promover/Rebaixar admin
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        // Verificar se já existe role
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'admin' });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'user' })
          .eq('user_id', userId);
        if (error) throw error;
      }
      
      // Registrar log
      await logAction(userId, 'toggle_admin', { made_admin: makeAdmin });
    },
    onSuccess: (_, { makeAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: makeAdmin ? "Promovido a admin" : "Rebaixado a usuário",
        description: makeAdmin 
          ? "O usuário agora é administrador do sistema."
          : "O usuário não é mais administrador.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar email do usuário
  const updateEmailMutation = useMutation({
    mutationFn: async ({ userId, email, previousEmail }: { userId: string; email: string; previousEmail?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ email, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Registrar log
      await logAction(userId, 'change_email', { 
        from: previousEmail || 'não definido', 
        to: email 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Email atualizado",
        description: "O email do usuário foi alterado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    isAdmin: isAdminQuery.data === true,
    isCheckingAdmin: isAdminQuery.isLoading,
    users: usersQuery.data || [],
    isLoadingUsers: usersQuery.isLoading,
    metrics,
    actionLogs: logsQuery.data || [],
    isLoadingLogs: logsQuery.isLoading,
    updatePlan: updatePlanMutation.mutate,
    isUpdatingPlan: updatePlanMutation.isPending,
    toggleBlock: toggleBlockMutation.mutate,
    isTogglingBlock: toggleBlockMutation.isPending,
    toggleAdmin: toggleAdminMutation.mutate,
    isTogglingAdmin: toggleAdminMutation.isPending,
    updateEmail: updateEmailMutation.mutate,
    isUpdatingEmail: updateEmailMutation.isPending,
    refetch: () => {
      usersQuery.refetch();
      logsQuery.refetch();
    },
  };
}

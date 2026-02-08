import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

  // Atualizar plano do usuário
  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: 'free' | 'start' | 'gold' | 'premium' }) => {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
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

  return {
    isAdmin: isAdminQuery.data === true,
    isCheckingAdmin: isAdminQuery.isLoading,
    users: usersQuery.data || [],
    isLoadingUsers: usersQuery.isLoading,
    updatePlan: updatePlanMutation.mutate,
    isUpdatingPlan: updatePlanMutation.isPending,
    toggleBlock: toggleBlockMutation.mutate,
    isTogglingBlock: toggleBlockMutation.isPending,
    toggleAdmin: toggleAdminMutation.mutate,
    isTogglingAdmin: toggleAdminMutation.isPending,
    refetch: () => usersQuery.refetch(),
  };
}

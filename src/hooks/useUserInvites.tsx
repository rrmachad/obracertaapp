import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'user';

export interface UserInvite {
  id: string;
  obra_id: string;
  invited_by: string;
  pin_code: string;
  role: AppRole;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string;
}

export interface ObraAccess {
  id: string;
  obra_id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  created_at: string;
  user_nome?: string;
  user_email?: string;
}

// Função para gerar PIN de 6 dígitos
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useUserInvites(obraId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar convites pendentes (não usados) da obra
  const invitesQuery = useQuery({
    queryKey: ['user-invites', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('obra_id', obraId)
        .is('used_by', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserInvite[];
    },
    enabled: !!obraId,
  });

  // Buscar usuários com acesso à obra
  const accessQuery = useQuery({
    queryKey: ['obra-access', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obra_access')
        .select('*')
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch profile names for each user with access
      const userIds = (data || []).map(a => a.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, email')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        return (data || []).map(a => ({
          ...a,
          user_nome: profileMap.get(a.user_id)?.nome,
          user_email: profileMap.get(a.user_id)?.email,
        })) as ObraAccess[];
      }

      return data as ObraAccess[];
    },
    enabled: !!obraId,
  });

  // Criar novo convite com PIN automático
  const createInvite = useMutation({
    mutationFn: async (role: AppRole = 'user') => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const pinCode = generatePin();
      
      const { data, error } = await supabase
        .from('user_invites')
        .insert({
          obra_id: obraId,
          invited_by: user.id,
          pin_code: pinCode,
          role,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserInvite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', obraId] });
    },
  });

  // Usar convite (usuário entra com PIN)
  const useInvite = useMutation({
    mutationFn: async (pinCode: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Buscar convite pelo PIN
      const { data: invite, error: findError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('obra_id', obraId)
        .eq('pin_code', pinCode)
        .is('used_by', null)
        .single();
      
      if (findError || !invite) {
        throw new Error('PIN inválido ou já utilizado');
      }
      
      // Marcar convite como usado
      const { error: updateError } = await supabase
        .from('user_invites')
        .update({
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('id', invite.id);
      
      if (updateError) throw updateError;
      
      // Criar acesso à obra
      const { data: access, error: accessError } = await supabase
        .from('obra_access')
        .insert({
          obra_id: obraId,
          user_id: user.id,
          role: invite.role,
          granted_by: invite.invited_by,
        })
        .select()
        .single();
      
      if (accessError) throw accessError;
      return access as ObraAccess;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obra-access', obraId] });
    },
  });

  // Alterar role de usuário com acesso
  const updateAccessRole = useMutation({
    mutationFn: async ({ accessId, role }: { accessId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('obra_access')
        .update({ role })
        .eq('id', accessId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra-access', obraId] });
    },
  });

  // Revogar acesso de usuário
  const revokeAccess = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase
        .from('obra_access')
        .delete()
        .eq('id', accessId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra-access', obraId] });
    },
  });

  // Cancelar convite pendente
  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', obraId] });
    },
  });

  // Renovar convite expirado (novo PIN + nova data de expiração)
  const renewInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const newPin = generatePin();
      const newExpires = new Date();
      newExpires.setDate(newExpires.getDate() + 7);

      const { data, error } = await supabase
        .from('user_invites')
        .update({
          pin_code: newPin,
          expires_at: newExpires.toISOString(),
        })
        .eq('id', inviteId)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserInvite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', obraId] });
    },
  });

  return {
    invites: invitesQuery.data || [],
    accessList: accessQuery.data || [],
    isLoading: invitesQuery.isLoading || accessQuery.isLoading,
    createInvite,
    useInvite,
    updateAccessRole,
    revokeAccess,
    cancelInvite,
    renewInvite,
  };
}

// Hook para verificar acesso do usuário atual a uma obra
export function useObraAccess(obraId: string) {
  const { user } = useAuth();

  const accessQuery = useQuery({
    queryKey: ['my-obra-access', obraId, user?.id],
    queryFn: async () => {
      if (!user?.id || !obraId) return null;
      
      // Primeiro verificar se é dono da obra
      const { data: obra } = await supabase
        .from('obras')
        .select('user_id')
        .eq('id', obraId)
        .single();
      
      if (obra?.user_id === user.id) {
        return { role: 'admin' as AppRole, isOwner: true };
      }
      
      // Verificar acesso concedido
      const { data: access } = await supabase
        .from('obra_access')
        .select('role')
        .eq('obra_id', obraId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (access) {
        return { role: access.role as AppRole, isOwner: false };
      }
      
      return null;
    },
    enabled: !!obraId && !!user?.id,
  });

  const access = accessQuery.data;
  const isAdmin = access?.role === 'admin';
  const isOwner = access?.isOwner || false;
  const hasAccess = !!access;
  const canEdit = hasAccess; // Usuários podem criar e editar registros
  const canManageUsers = isOwner; // Só o dono pode gerenciar usuários

  return {
    access,
    isAdmin,
    isOwner,
    hasAccess,
    canEdit,
    canManageUsers,
    isLoading: accessQuery.isLoading,
  };
}

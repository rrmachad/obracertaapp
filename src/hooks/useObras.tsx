import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra, ObraStatus } from '@/types/database';
import { useAuth } from './useAuth';

export function useObras() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch obras owned by the user
  const ownObrasQuery = useQuery({
    queryKey: ['obras-own', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Obra[];
    },
    enabled: !!user,
  });

  // Fetch ALL obras from license owners who invited the user
  const sharedObrasQuery = useQuery({
    queryKey: ['obras-shared', user?.id],
    queryFn: async () => {
      // Get owner IDs (granted_by) from obra_access
      const { data: accessList, error: accessError } = await supabase
        .from('obra_access')
        .select('granted_by')
        .eq('user_id', user!.id);
      
      if (accessError) throw accessError;
      if (!accessList || accessList.length === 0) return { obras: [] as Obra[], ownerIds: [] as string[] };

      const ownerIds = [...new Set(accessList.map(a => a.granted_by).filter(Boolean))] as string[];
      if (ownerIds.length === 0) return { obras: [] as Obra[], ownerIds: [] as string[] };

      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .in('user_id', ownerIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { obras: data as Obra[], ownerIds };
    },
    enabled: !!user,
  });

  // Combine own + shared obras, deduplicating by id
  const sharedData = sharedObrasQuery.data;
  const allObras = (() => {
    const own = ownObrasQuery.data ?? [];
    const shared = sharedData?.obras ?? [];
    const ownIds = new Set(own.map(o => o.id));
    const uniqueShared = shared.filter(o => !ownIds.has(o.id));
    return [...own, ...uniqueShared];
  })();

  const isLoading = ownObrasQuery.isLoading || sharedObrasQuery.isLoading;
  const isInvitedUser = (ownObrasQuery.data ?? []).length === 0 && (sharedData?.obras ?? []).length > 0;
  const ownerUserId = sharedData?.ownerIds?.[0] ?? null;

  const createObra = useMutation({
    mutationFn: async (obra: { nome: string; endereco: string; foto_capa?: string }) => {
      const { data, error } = await supabase
        .from('obras')
        .insert({
          ...obra,
          user_id: user!.id,
          status: 'planejamento' as ObraStatus,
          progresso: 0
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Obra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  const updateObra = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Obra> & { id: string }) => {
      const { data, error } = await supabase
        .from('obras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Obra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  const deleteObra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  return {
    obras: allObras,
    isLoading,
    isInvitedUser,
    ownerUserId,
    error: ownObrasQuery.error || sharedObrasQuery.error,
    createObra,
    updateObra,
    deleteObra,
  };
}

export function useObra(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['obra', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Obra;
    },
    enabled: !!user && !!id,
  });
}

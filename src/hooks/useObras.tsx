import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra, ObraStatus } from '@/types/database';
import { useAuth } from './useAuth';

export function useObras() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const obrasQuery = useQuery({
    queryKey: ['obras', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Obra[];
    },
    enabled: !!user,
  });

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
    obras: obrasQuery.data ?? [],
    isLoading: obrasQuery.isLoading,
    error: obrasQuery.error,
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

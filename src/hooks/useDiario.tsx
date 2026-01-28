import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DiarioLog, ClimaTipo } from '@/types/database';

export function useDiario(obraId: string) {
  const queryClient = useQueryClient();

  const diarioQuery = useQuery({
    queryKey: ['diario', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diario_log')
        .select('*')
        .eq('obra_id', obraId)
        .order('data', { ascending: false });
      
      if (error) throw error;
      return data as DiarioLog[];
    },
    enabled: !!obraId,
  });

  const createDiario = useMutation({
    mutationFn: async (diario: {
      obra_id: string;
      clima: ClimaTipo;
      atividades_realizadas: string;
      observacoes?: string;
      fotos?: string[];
    }) => {
      const { data, error } = await supabase
        .from('diario_log')
        .insert({
          ...diario,
          data: new Date().toISOString().split('T')[0],
          fotos: diario.fotos ?? []
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DiarioLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
    },
  });

  const updateDiario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiarioLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('diario_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DiarioLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
    },
  });

  const deleteDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('diario_log')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
    },
  });

  return {
    registros: diarioQuery.data ?? [],
    isLoading: diarioQuery.isLoading,
    error: diarioQuery.error,
    createDiario,
    updateDiario,
    deleteDiario,
  };
}

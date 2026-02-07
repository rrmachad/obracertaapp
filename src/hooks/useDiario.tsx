import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DiarioLog, ClimaTipo, Profissional } from '@/types/database';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

// Helper para converter Json para Profissional[]
function parseProfissionais(json: Json | null | undefined): Profissional[] {
  if (!json || !Array.isArray(json)) return [];
  return json.filter(
    (item): item is { funcao: string; quantidade: number } =>
      typeof item === 'object' &&
      item !== null &&
      'funcao' in item &&
      'quantidade' in item &&
      typeof (item as Record<string, unknown>).funcao === 'string' &&
      typeof (item as Record<string, unknown>).quantidade === 'number'
  );
}

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
      
      return (data ?? []).map(item => ({
        ...item,
        fotos: item.fotos ?? [],
        profissionais: parseProfissionais(item.profissionais)
      })) as DiarioLog[];
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
      profissionais?: Profissional[];
    }) => {
      const { data, error } = await supabase
        .from('diario_log')
        .insert({
          obra_id: diario.obra_id,
          clima: diario.clima,
          atividades_realizadas: diario.atividades_realizadas,
          observacoes: diario.observacoes,
          data: format(new Date(), 'yyyy-MM-dd'),
          fotos: diario.fotos ?? [],
          profissionais: (diario.profissionais ?? []) as unknown as Json
        })
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        fotos: data.fotos ?? [],
        profissionais: parseProfissionais(data.profissionais)
      } as DiarioLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
    },
  });

  const updateDiario = useMutation({
    mutationFn: async ({ id, profissionais, ...updates }: Partial<DiarioLog> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (profissionais !== undefined) {
        updateData.profissionais = profissionais as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('diario_log')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        fotos: data.fotos ?? [],
        profissionais: parseProfissionais(data.profissionais)
      } as DiarioLog;
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

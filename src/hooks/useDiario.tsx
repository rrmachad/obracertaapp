import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DiarioLog, ClimaTipo, Profissional, FotoComLegenda, Equipamento } from '@/types/database';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { notifyDiarioCriado } from '@/lib/notifications';

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

// Helper para converter Json para FotoComLegenda[]
function parseFotos(json: Json | null | undefined): FotoComLegenda[] {
  if (!json || !Array.isArray(json)) return [];
  return json.map((item) => {
    if (typeof item === 'string') {
      // Compatibilidade com formato antigo (string)
      return { url: item, legenda: '' };
    }
    if (typeof item === 'object' && item !== null && 'url' in item) {
      return {
        url: String((item as Record<string, unknown>).url ?? ''),
        legenda: String((item as Record<string, unknown>).legenda ?? ''),
      };
    }
    return { url: '', legenda: '' };
  }).filter(f => f.url);
}

// Helper para converter Json para Equipamento[]
function parseEquipamentos(json: Json | null | undefined): Equipamento[] {
  if (!json || !Array.isArray(json)) return [];
  return json.filter(
    (item): item is { nome: string; quantidade: number } =>
      typeof item === 'object' &&
      item !== null &&
      'nome' in item &&
      'quantidade' in item &&
      typeof (item as Record<string, unknown>).nome === 'string' &&
      typeof (item as Record<string, unknown>).quantidade === 'number'
  );
}

/**
 * Busca em batch quais obras já têm diário lançado hoje,
 * retornando um mapa obra_id -> true. Usado nas ações rápidas do dashboard.
 */
export function useDiariosHoje(obraIds: string[]) {
  const hoje = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['diarios-hoje', hoje, obraIds],
    queryFn: async () => {
      if (!obraIds.length) return {} as Record<string, boolean>;

      const { data, error } = await supabase
        .from('diario_log')
        .select('obra_id')
        .eq('data', hoje)
        .in('obra_id', obraIds);

      if (error) throw error;

      const lancados: Record<string, boolean> = {};
      (data ?? []).forEach((d) => {
        lancados[d.obra_id] = true;
      });
      return lancados;
    },
    enabled: obraIds.length > 0,
    staleTime: 60_000,
  });
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
        fotos: parseFotos(item.fotos),
        profissionais: parseProfissionais(item.profissionais),
        equipamentos: parseEquipamentos(item.equipamentos)
      })) as unknown as DiarioLog[];
    },
    enabled: !!obraId,
  });

  const createDiario = useMutation({
    mutationFn: async (diario: {
      obra_id: string;
      clima: ClimaTipo;
      atividades_realizadas: string;
      observacoes?: string;
      fotos?: FotoComLegenda[];
      profissionais?: Profissional[];
      equipamentos?: Equipamento[];
    }) => {
      const { data, error } = await supabase
        .from('diario_log')
        .insert({
          obra_id: diario.obra_id,
          clima: diario.clima,
          atividades_realizadas: diario.atividades_realizadas,
          observacoes: diario.observacoes,
          data: format(new Date(), 'yyyy-MM-dd'),
          fotos: (diario.fotos ?? []) as unknown as Json,
          profissionais: (diario.profissionais ?? []) as unknown as Json,
          equipamentos: (diario.equipamentos ?? []) as unknown as Json
        })
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        fotos: parseFotos(data.fotos),
        profissionais: parseProfissionais(data.profissionais),
        equipamentos: parseEquipamentos(data.equipamentos)
      } as unknown as DiarioLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diario', obraId] });
      notifyDiarioCriado(obraId, data.data);
    },
  });

  const updateDiario = useMutation({
    mutationFn: async ({ id, profissionais, fotos, equipamentos, ...updates }: Partial<DiarioLog> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (profissionais !== undefined) {
        updateData.profissionais = profissionais as unknown as Json;
      }
      if (fotos !== undefined) {
        updateData.fotos = fotos as unknown as Json;
      }
      if (equipamentos !== undefined) {
        updateData.equipamentos = equipamentos as unknown as Json;
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
        fotos: parseFotos(data.fotos),
        profissionais: parseProfissionais(data.profissionais),
        equipamentos: parseEquipamentos(data.equipamentos)
      } as unknown as DiarioLog;
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

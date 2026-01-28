import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Fase, CronogramaItem, ItemStatus } from '@/types/database';

export function useFases() {
  return useQuery({
    queryKey: ['fases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fases')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as Fase[];
    },
  });
}

export function useCronogramaItens(obraId: string) {
  const queryClient = useQueryClient();

  const itensQuery = useQuery({
    queryKey: ['cronograma', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cronograma_itens')
        .select('*')
        .eq('obra_id', obraId)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data as CronogramaItem[];
    },
    enabled: !!obraId,
  });

  const createItem = useMutation({
    mutationFn: async (item: { obra_id: string; fase_id: string; descricao: string }) => {
      const { data, error } = await supabase
        .from('cronograma_itens')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data as CronogramaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CronogramaItem> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'concluido') {
        updateData.data_conclusao = new Date().toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('cronograma_itens')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as CronogramaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      queryClient.invalidateQueries({ queryKey: ['obra'] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cronograma_itens')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cronograma', obraId] });
      queryClient.invalidateQueries({ queryKey: ['obras'] });
    },
  });

  return {
    itens: itensQuery.data ?? [],
    isLoading: itensQuery.isLoading,
    error: itensQuery.error,
    createItem,
    updateItem,
    deleteItem,
  };
}

// Itens padrão para cada fase MCMV
export const defaultItemsByFase: Record<string, string[]> = {
  'Serviços Preliminares': [
    'Limpeza do terreno',
    'Locação da obra',
    'Instalações provisórias (água, luz, tapume)',
    'Barracão de obra',
  ],
  'Fundação': [
    'Escavação',
    'Compactação do solo',
    'Sapatas',
    'Vigas baldrame',
    'Impermeabilização da fundação',
  ],
  'Estrutura': [
    'Alvenaria de embasamento',
    'Alvenaria de elevação',
    'Cintas e vergas',
    'Pilares',
    'Laje',
  ],
  'Cobertura': [
    'Estrutura do telhado (madeiramento)',
    'Colocação das telhas',
    'Cumeeiras',
    'Calhas e rufos',
  ],
  'Instalações': [
    'Instalação elétrica (tubulação)',
    'Passagem de fios',
    'Instalação hidráulica',
    'Instalação de esgoto',
    'Caixas de passagem',
  ],
  'Acabamento': [
    'Chapisco',
    'Reboco',
    'Contrapiso',
    'Revestimento cerâmico',
    'Pintura',
    'Instalação de louças',
    'Instalação de esquadrias',
    'Limpeza final',
  ],
};

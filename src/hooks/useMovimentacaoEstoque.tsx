import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MovimentacaoEstoque {
  id: string;
  material_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  observacao?: string;
  data: string;
  created_at: string;
}

export function useMovimentacaoEstoque(obraId: string) {
  const queryClient = useQueryClient();

  const movimentacoesQuery = useQuery({
    queryKey: ['movimentacoes', obraId],
    queryFn: async () => {
      // Primeiro buscar os IDs dos materiais dessa obra
      const { data: materiais, error: matError } = await supabase
        .from('materiais')
        .select('id')
        .eq('obra_id', obraId);
      
      if (matError) throw matError;
      if (!materiais?.length) return [];

      const materialIds = materiais.map(m => m.id);

      const { data, error } = await supabase
        .from('movimentacao_estoque')
        .select('*')
        .in('material_id', materialIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MovimentacaoEstoque[];
    },
    enabled: !!obraId,
  });

  const createMovimentacao = useMutation({
    mutationFn: async (mov: {
      material_id: string;
      tipo: 'entrada' | 'saida';
      quantidade: number;
      observacao?: string;
    }) => {
      const { data, error } = await supabase
        .from('movimentacao_estoque')
        .insert({
          ...mov,
          data: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as MovimentacaoEstoque;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes', obraId] });
    },
  });

  // Buscar movimentações de uma data específica
  const getMovimentacoesByDate = (date: string) => {
    return movimentacoesQuery.data?.filter(m => m.data === date) ?? [];
  };

  return {
    movimentacoes: movimentacoesQuery.data ?? [],
    isLoading: movimentacoesQuery.isLoading,
    createMovimentacao,
    getMovimentacoesByDate,
  };
}

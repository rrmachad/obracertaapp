import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types/database';
import { format } from 'date-fns';
import { notifyEstoqueBaixo } from '@/lib/notifications';

export function useMateriais(obraId: string) {
  const queryClient = useQueryClient();

  const materiaisQuery = useQuery({
    queryKey: ['materiais', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .eq('obra_id', obraId)
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!obraId,
  });

  const createMaterial = useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materiais')
        .insert(material)
        .select()
        .single();
      
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais', obraId] });
    },
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materiais')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais', obraId] });
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materiais')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais', obraId] });
    },
  });

  const ajustarQuantidade = useMutation({
    mutationFn: async ({ id, delta, observacao, precoUnitario }: { id: string; delta: number; observacao?: string; precoUnitario?: number }) => {
      const material = materiaisQuery.data?.find(m => m.id === id);
      if (!material) throw new Error('Material não encontrado');

      const novaQtd = Math.max(0, material.qtd_atual + delta);

      // Atualizar quantidade
      const { data, error } = await supabase
        .from('materiais')
        .update({ qtd_atual: novaQtd })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Resolve price at this moment
      let precoMomento: number | undefined;
      if (delta > 0) {
        // entrada: use the price the user informed
        precoMomento = precoUnitario;
      } else {
        // saída: inherit from the most recent entrada that has a price
        const { data: ultimaEntrada } = await supabase
          .from('movimentacao_estoque')
          .select('preco_unitario_momento')
          .eq('material_id', id)
          .eq('tipo', 'entrada')
          .not('preco_unitario_momento', 'is', null)
          .order('data', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (ultimaEntrada?.preco_unitario_momento != null) {
          precoMomento = Number(ultimaEntrada.preco_unitario_momento);
        } else if (material.preco_unitario != null) {
          precoMomento = Number(material.preco_unitario);
        }
      }

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('movimentacao_estoque')
        .insert({
          material_id: id,
          tipo: delta > 0 ? 'entrada' : 'saida',
          quantidade: Math.abs(delta),
          preco_unitario_momento: precoMomento ?? null,
          observacao,
          data: format(new Date(), 'yyyy-MM-dd'),
        });

      if (movError) console.error('Erro ao registrar movimentação:', movError);

      return data as Material;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materiais', obraId] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes', obraId] });
      // Check low stock and notify
      if (data && data.qtd_atual <= data.qtd_minima && data.qtd_minima > 0) {
        notifyEstoqueBaixo(obraId, data.nome, data.qtd_atual, data.qtd_minima);
      }
    },
  });

  return {
    materiais: materiaisQuery.data ?? [],
    isLoading: materiaisQuery.isLoading,
    error: materiaisQuery.error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    ajustarQuantidade,
  };
}

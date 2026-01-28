import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types/database';

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
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const material = materiaisQuery.data?.find(m => m.id === id);
      if (!material) throw new Error('Material não encontrado');
      
      const novaQtd = Math.max(0, material.qtd_atual + delta);
      
      const { data, error } = await supabase
        .from('materiais')
        .update({ qtd_atual: novaQtd })
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

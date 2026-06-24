import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Medicao, Adiantamento } from '@/types/database';
import { notifyMedicaoCriada } from '@/lib/notifications';

export function useMedicoes(obraId: string) {
  const queryClient = useQueryClient();

  const medicoesQuery = useQuery({
    queryKey: ['medicoes', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicoes')
        .select('*')
        .eq('obra_id', obraId)
        .order('data_medicao', { ascending: false });
      if (error) throw error;
      return data as Medicao[];
    },
    enabled: !!obraId,
  });

  const createMedicao = useMutation({
    mutationFn: async (medicao: {
      obra_id: string;
      fase_id?: string;
      cronograma_item_id?: string;
      data_medicao: string;
      percentual_anterior: number;
      percentual_atual: number;
      valor_contrato_referencia: number;
      valor_bruto_medido: number;
      valor_retencao_tecnica: number;
      retencao_percentual_aplicado: number;
      valor_adiantamentos_descontados: number;
      valor_liquido_a_pagar: number;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('medicoes')
        .insert(medicao)
        .select()
        .single();
      if (error) throw error;
      return data as Medicao;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medicoes', obraId] });
      queryClient.invalidateQueries({ queryKey: ['adiantamentos', obraId] });
      // Notify obra owner
      notifyMedicaoCriada(obraId, `Medição ${variables.data_medicao}`);
    },
  });

  const updateMedicao = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Medicao> & { id: string }) => {
      const { data, error } = await supabase
        .from('medicoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Medicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes', obraId] });
    },
  });

  const deleteMedicao = useMutation({
    mutationFn: async (id: string) => {
      // First unlink adiantamentos
      await supabase
        .from('adiantamentos')
        .update({ abatido_em_medicao_id: null })
        .eq('abatido_em_medicao_id', id);
      
      const { error } = await supabase
        .from('medicoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes', obraId] });
      queryClient.invalidateQueries({ queryKey: ['adiantamentos', obraId] });
    },
  });

  const marcarComoPago = useMutation({
    mutationFn: async ({ id, dataRecebimento }: { id: string; dataRecebimento: string }) => {
      const { data, error } = await supabase
        .from('medicoes')
        .update({ status_pagamento: 'pago', data_recebimento: dataRecebimento })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Medicao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicoes', obraId] });
    },
  });

  return {
    medicoes: medicoesQuery.data ?? [],
    isLoading: medicoesQuery.isLoading,
    createMedicao,
    updateMedicao,
    deleteMedicao,
    marcarComoPago,
  };
}

export function useAdiantamentos(obraId: string) {
  const queryClient = useQueryClient();

  const adiantamentosQuery = useQuery({
    queryKey: ['adiantamentos', obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adiantamentos')
        .select('*')
        .eq('obra_id', obraId)
        .order('data', { ascending: false });
      if (error) throw error;
      return data as Adiantamento[];
    },
    enabled: !!obraId,
  });

  const createAdiantamento = useMutation({
    mutationFn: async (adiantamento: {
      obra_id: string;
      data: string;
      valor: number;
      descricao?: string;
    }) => {
      const { data, error } = await supabase
        .from('adiantamentos')
        .insert(adiantamento)
        .select()
        .single();
      if (error) throw error;
      return data as Adiantamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adiantamentos', obraId] });
    },
  });

  const deleteAdiantamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('adiantamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adiantamentos', obraId] });
    },
  });

  const marcarAbatidos = useMutation({
    mutationFn: async ({ ids, medicaoId }: { ids: string[]; medicaoId: string }) => {
      const { error } = await supabase
        .from('adiantamentos')
        .update({ abatido_em_medicao_id: medicaoId })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adiantamentos', obraId] });
    },
  });

  return {
    adiantamentos: adiantamentosQuery.data ?? [],
    pendentes: (adiantamentosQuery.data ?? []).filter(a => !a.abatido_em_medicao_id),
    isLoading: adiantamentosQuery.isLoading,
    createAdiantamento,
    deleteAdiantamento,
    marcarAbatidos,
  };
}

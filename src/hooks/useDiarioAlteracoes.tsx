import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DiarioAlteracao {
  id: string;
  diario_id: string;
  user_id: string;
  campo_alterado: string;
  valor_anterior?: string;
  valor_novo?: string;
  motivo?: string;
  created_at: string;
}

export function useDiarioAlteracoes(diarioId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const alteracoesQuery = useQuery({
    queryKey: ['diario-alteracoes', diarioId],
    queryFn: async () => {
      if (!diarioId) return [];
      
      const { data, error } = await supabase
        .from('diario_log_alteracoes')
        .select('*')
        .eq('diario_id', diarioId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DiarioAlteracao[];
    },
    enabled: !!diarioId,
  });

  const registrarAlteracao = useMutation({
    mutationFn: async (alteracao: {
      diario_id: string;
      campo_alterado: string;
      valor_anterior?: string;
      valor_novo?: string;
      motivo?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('diario_log_alteracoes')
        .insert({
          ...alteracao,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DiarioAlteracao;
    },
    onSuccess: () => {
      if (diarioId) {
        queryClient.invalidateQueries({ queryKey: ['diario-alteracoes', diarioId] });
      }
    },
  });

  return {
    alteracoes: alteracoesQuery.data ?? [],
    isLoading: alteracoesQuery.isLoading,
    registrarAlteracao,
  };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivationProgress {
  hasObra: boolean;
  hasValorCronograma: boolean;
  hasDiario: boolean;
  hasMedicao: boolean;
  primeiraObraId: string | null;
}

/**
 * Deriva o progresso de ativação do usuário a partir dos dados reais
 * (sem tabela nova): existe obra própria? existe item de cronograma com
 * valor de mão de obra? existe diário? existe medição?
 */
export function useActivationProgress(enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activation-progress', user?.id],
    queryFn: async (): Promise<ActivationProgress> => {
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (obrasError) throw obrasError;

      const ids = (obras ?? []).map(o => o.id);
      if (ids.length === 0) {
        return {
          hasObra: false,
          hasValorCronograma: false,
          hasDiario: false,
          hasMedicao: false,
          primeiraObraId: null,
        };
      }

      const [cron, diario, medicao] = await Promise.all([
        supabase
          .from('cronograma_itens')
          .select('id')
          .in('obra_id', ids)
          .gt('valor_contrato_mao_de_obra', 0)
          .limit(1),
        supabase.from('diario_log').select('id').in('obra_id', ids).limit(1),
        supabase.from('medicoes').select('id').in('obra_id', ids).limit(1),
      ]);

      if (cron.error) throw cron.error;
      if (diario.error) throw diario.error;
      if (medicao.error) throw medicao.error;

      return {
        hasObra: true,
        hasValorCronograma: (cron.data ?? []).length > 0,
        hasDiario: (diario.data ?? []).length > 0,
        hasMedicao: (medicao.data ?? []).length > 0,
        primeiraObraId: ids[0],
      };
    },
    enabled: !!user && enabled,
  });
}

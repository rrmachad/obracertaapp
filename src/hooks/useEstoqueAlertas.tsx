import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Busca em batch os materiais com estoque abaixo do mínimo
 * para todas as obras do usuário, retornando um mapa obra_id -> count.
 */
export function useEstoqueAlertas(obraIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['estoque-alertas', obraIds],
    queryFn: async () => {
      if (!obraIds.length) return {} as Record<string, number>;

      const { data, error } = await supabase
        .from('materiais')
        .select('obra_id, qtd_atual, qtd_minima')
        .in('obra_id', obraIds);

      if (error) throw error;

      const alertas: Record<string, number> = {};
      (data ?? []).forEach((m) => {
        if (m.qtd_atual < m.qtd_minima) {
          alertas[m.obra_id] = (alertas[m.obra_id] ?? 0) + 1;
        }
      });
      return alertas;
    },
    enabled: !!user && obraIds.length > 0,
    staleTime: 60_000, // revalida a cada 1 minuto
  });
}

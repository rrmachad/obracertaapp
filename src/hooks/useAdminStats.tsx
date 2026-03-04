import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfWeek, startOfMonth, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ObraStats {
  id: string;
  nome: string;
  endereco: string;
  status: string;
  progresso: number;
  totalDiarios: number;
  totalMateriais: number;
  totalItensEstoque: number;
  ultimaAtividade: string | null;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'diario' | 'material' | 'cronograma';
  description: string;
  obraName: string;
  obraId: string;
  timestamp: string;
  clima?: string;
}

export function useAdminStats() {
  const { user } = useAuth();

  // Estatísticas gerais
  const statsQuery = useQuery({
    queryKey: ['admin-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar obras com estatísticas
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user.id);

      if (obrasError) throw obrasError;

      const obraIds = obras?.map(o => o.id) || [];

      // Contagem de diários
      const { count: totalDiarios } = await supabase
        .from('diario_log')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : ['']);

      // Contagem de materiais
      const { count: totalMateriais } = await supabase
        .from('materiais')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : ['']);

      // Contagem de itens do cronograma
      const { count: totalCronograma } = await supabase
        .from('cronograma_itens')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : ['']);

      // Itens concluídos
      const { count: itensConcluidos } = await supabase
        .from('cronograma_itens')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : [''])
        .eq('status', 'concluido');

      // Diários desta semana
      const startWeek = startOfWeek(new Date(), { locale: ptBR });
      const { count: diariosSemanais } = await supabase
        .from('diario_log')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : [''])
        .gte('data', format(startWeek, 'yyyy-MM-dd'));

      // Diários deste mês
      const startMonth = startOfMonth(new Date());
      const { count: diariosMensais } = await supabase
        .from('diario_log')
        .select('*', { count: 'exact', head: true })
        .in('obra_id', obraIds.length > 0 ? obraIds : [''])
        .gte('data', format(startMonth, 'yyyy-MM-dd'));

      // Materiais em alerta (abaixo do mínimo)
      const { data: materiaisAlerta } = await supabase
        .from('materiais')
        .select('*')
        .in('obra_id', obraIds.length > 0 ? obraIds : ['']);

      const materiaisEmAlerta = materiaisAlerta?.filter(m => m.qtd_atual < m.qtd_minima).length || 0;

      // Invite stats
      const { data: invites } = await supabase
        .from('user_invites')
        .select('used_by, expires_at')
        .in('obra_id', obraIds.length > 0 ? obraIds : ['']);

      const now = new Date();
      const convitesPendentes = invites?.filter(i => !i.used_by && new Date(i.expires_at) >= now).length || 0;
      const convitesExpirados = invites?.filter(i => !i.used_by && new Date(i.expires_at) < now).length || 0;
      const convitesUtilizados = invites?.filter(i => !!i.used_by).length || 0;

      return {
        totalObras: obras?.length || 0,
        obrasAtivas: obras?.filter(o => o.status === 'em_andamento').length || 0,
        obrasConcluidas: obras?.filter(o => o.status === 'concluida').length || 0,
        obrasPlanejamento: obras?.filter(o => o.status === 'planejamento').length || 0,
        obrasPausadas: obras?.filter(o => o.status === 'pausada').length || 0,
        totalDiarios: totalDiarios || 0,
        totalMateriais: totalMateriais || 0,
        totalCronograma: totalCronograma || 0,
        itensConcluidos: itensConcluidos || 0,
        diariosSemanais: diariosSemanais || 0,
        diariosMensais: diariosMensais || 0,
        materiaisEmAlerta,
        progressoMedio: obras?.length 
          ? Math.round(obras.reduce((acc, o) => acc + (o.progresso || 0), 0) / obras.length)
          : 0,
        convitesPendentes,
        convitesExpirados,
        convitesUtilizados,
      };
    },
    enabled: !!user?.id,
  });

  // Estatísticas por obra
  const obraStatsQuery = useQuery({
    queryKey: ['obra-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: obras, error } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!obras) return [];

      const statsPromises = obras.map(async (obra) => {
        const [diariosRes, materiaisRes] = await Promise.all([
          supabase
            .from('diario_log')
            .select('data', { count: 'exact' })
            .eq('obra_id', obra.id)
            .order('data', { ascending: false })
            .limit(1),
          supabase
            .from('materiais')
            .select('*', { count: 'exact', head: true })
            .eq('obra_id', obra.id),
        ]);

        return {
          id: obra.id,
          nome: obra.nome,
          endereco: obra.endereco,
          status: obra.status,
          progresso: obra.progresso || 0,
          totalDiarios: diariosRes.count || 0,
          totalMateriais: materiaisRes.count || 0,
          totalItensEstoque: materiaisRes.count || 0,
          ultimaAtividade: diariosRes.data?.[0]?.data || null,
        } as ObraStats;
      });

      return Promise.all(statsPromises);
    },
    enabled: !!user?.id,
  });

  // Atividade dos últimos 7 dias
  const activityChartQuery = useQuery({
    queryKey: ['activity-chart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: obras } = await supabase
        .from('obras')
        .select('id')
        .eq('user_id', user.id);

      const obraIds = obras?.map(o => o.id) || [];
      if (obraIds.length === 0) return [];

      const days: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const { count } = await supabase
          .from('diario_log')
          .select('*', { count: 'exact', head: true })
          .in('obra_id', obraIds)
          .eq('data', dateStr);

        days.push({
          date: format(date, 'EEE', { locale: ptBR }),
          count: count || 0,
        });
      }

      return days;
    },
    enabled: !!user?.id,
  });

  // Atividade recente
  const recentActivityQuery = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: obras } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('user_id', user.id);

      const obraIds = obras?.map(o => o.id) || [];
      const obraMap = new Map(obras?.map(o => [o.id, o.nome]) || []);

      if (obraIds.length === 0) return [];

      const { data: diarios } = await supabase
        .from('diario_log')
        .select('id, obra_id, data, atividades_realizadas, clima, created_at')
        .in('obra_id', obraIds)
        .order('created_at', { ascending: false })
        .limit(10);

      const activities: RecentActivity[] = (diarios || []).map(d => ({
        id: d.id,
        type: 'diario' as const,
        description: d.atividades_realizadas.slice(0, 100) + (d.atividades_realizadas.length > 100 ? '...' : ''),
        obraName: obraMap.get(d.obra_id) || 'Obra',
        obraId: d.obra_id,
        timestamp: d.created_at,
        clima: d.clima,
      }));

      return activities;
    },
    enabled: !!user?.id,
  });

  return {
    stats: statsQuery.data,
    obraStats: obraStatsQuery.data || [],
    activityChart: activityChartQuery.data || [],
    recentActivity: recentActivityQuery.data || [],
    isLoading: statsQuery.isLoading || obraStatsQuery.isLoading || activityChartQuery.isLoading,
    refetch: () => {
      statsQuery.refetch();
      obraStatsQuery.refetch();
      activityChartQuery.refetch();
      recentActivityQuery.refetch();
    },
  };
}

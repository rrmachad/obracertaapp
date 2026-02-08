import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription, SubscriptionPlan } from './useSubscription';

export interface PlanLimits {
  maxUsers: number;
  maxObras: number;
  maxDiariosPerObra: number;
  maxMateriaisPerObra: number;
}

export interface PlanUsage {
  usersUsed: number;
  obrasUsed: number;
  diariosUsed: Record<string, number>; // obraId -> count
  materiaisUsed: Record<string, number>; // obraId -> count
}

const planLimitsConfig: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxUsers: 1,
    maxObras: 1,
    maxDiariosPerObra: 10,
    maxMateriaisPerObra: 10,
  },
  start: {
    maxUsers: 1,
    maxObras: -1, // ilimitado
    maxDiariosPerObra: -1, // ilimitado
    maxMateriaisPerObra: -1, // ilimitado
  },
  gold: {
    maxUsers: 3,
    maxObras: -1, // ilimitado
    maxDiariosPerObra: -1, // ilimitado
    maxMateriaisPerObra: -1, // ilimitado
  },
  premium: {
    maxUsers: -1, // ilimitado
    maxObras: -1, // ilimitado
    maxDiariosPerObra: -1, // ilimitado
    maxMateriaisPerObra: -1, // ilimitado
  },
};

export function usePlanLimits() {
  const { user } = useAuth();
  const { plan } = useSubscription();

  // Buscar contagem de obras do usuário
  const obrasQuery = useQuery({
    queryKey: ['obras-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('obras')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  // Buscar contagem de diários por obra
  const diariosQuery = useQuery({
    queryKey: ['diarios-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      // Primeiro buscar as obras do usuário
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id')
        .eq('user_id', user.id);
      
      if (obrasError) throw obrasError;
      if (!obras || obras.length === 0) return {};
      
      const counts: Record<string, number> = {};
      
      for (const obra of obras) {
        const { count, error } = await supabase
          .from('diario_log')
          .select('*', { count: 'exact', head: true })
          .eq('obra_id', obra.id);
        
        if (!error && count !== null) {
          counts[obra.id] = count;
        }
      }
      
      return counts;
    },
    enabled: !!user?.id,
  });

  // Buscar contagem de materiais por obra
  const materiaisQuery = useQuery({
    queryKey: ['materiais-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      // Primeiro buscar as obras do usuário
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id')
        .eq('user_id', user.id);
      
      if (obrasError) throw obrasError;
      if (!obras || obras.length === 0) return {};
      
      const counts: Record<string, number> = {};
      
      for (const obra of obras) {
        const { count, error } = await supabase
          .from('materiais')
          .select('*', { count: 'exact', head: true })
          .eq('obra_id', obra.id);
        
        if (!error && count !== null) {
          counts[obra.id] = count;
        }
      }
      
      return counts;
    },
    enabled: !!user?.id,
  });

  const limits = planLimitsConfig[plan];
  
  const usage: PlanUsage = {
    usersUsed: 1, // Por enquanto apenas o próprio usuário
    obrasUsed: obrasQuery.data ?? 0,
    diariosUsed: diariosQuery.data ?? {},
    materiaisUsed: materiaisQuery.data ?? {},
  };

  // Funções de verificação
  const canCreateObra = () => {
    if (limits.maxObras === -1) return true; // ilimitado
    return usage.obrasUsed < limits.maxObras;
  };

  const canCreateDiario = (obraId: string) => {
    if (limits.maxDiariosPerObra === -1) return true; // ilimitado
    const currentCount = usage.diariosUsed[obraId] ?? 0;
    return currentCount < limits.maxDiariosPerObra;
  };

  const canCreateMaterial = (obraId: string) => {
    if (limits.maxMateriaisPerObra === -1) return true; // ilimitado
    const currentCount = usage.materiaisUsed[obraId] ?? 0;
    return currentCount < limits.maxMateriaisPerObra;
  };

  const getDiarioCount = (obraId: string) => usage.diariosUsed[obraId] ?? 0;
  const getMaterialCount = (obraId: string) => usage.materiaisUsed[obraId] ?? 0;

  // Calcular uso percentual
  const getObrasPercentage = () => {
    if (limits.maxObras === -1) return 0;
    return (usage.obrasUsed / limits.maxObras) * 100;
  };

  const getDiariosPercentage = (obraId: string) => {
    if (limits.maxDiariosPerObra === -1) return 0;
    const count = usage.diariosUsed[obraId] ?? 0;
    return (count / limits.maxDiariosPerObra) * 100;
  };

  const getMateriaisPercentage = (obraId: string) => {
    if (limits.maxMateriaisPerObra === -1) return 0;
    const count = usage.materiaisUsed[obraId] ?? 0;
    return (count / limits.maxMateriaisPerObra) * 100;
  };

  const isLoading = obrasQuery.isLoading || diariosQuery.isLoading || materiaisQuery.isLoading;

  const refetch = () => {
    obrasQuery.refetch();
    diariosQuery.refetch();
    materiaisQuery.refetch();
  };

  return {
    limits,
    usage,
    isLoading,
    refetch,
    // Verificações
    canCreateObra,
    canCreateDiario,
    canCreateMaterial,
    // Contagens
    getDiarioCount,
    getMaterialCount,
    // Percentuais
    getObrasPercentage,
    getDiariosPercentage,
    getMateriaisPercentage,
  };
}

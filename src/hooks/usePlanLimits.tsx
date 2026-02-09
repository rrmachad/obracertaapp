import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription, SubscriptionPlan } from './useSubscription';

export interface PlanLimits {
  maxUsers: number;
  maxObras: number;
  maxDiariosPerObra: number;
  maxMateriaisPerObra: number;
  canAccessFinanceiro: boolean;
  canAccessMedicao: boolean;
  canAccessPortal: boolean;
  canAccessCompras: boolean;
  canAccessDashboardLucratividade: boolean;
}

export interface PlanUsage {
  usersUsed: number;
  obrasUsed: number;
  diariosUsed: Record<string, number>;
  materiaisUsed: Record<string, number>;
}

const planLimitsConfig: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxUsers: 1,
    maxObras: 1,
    maxDiariosPerObra: 10,
    maxMateriaisPerObra: 10,
    canAccessFinanceiro: false,
    canAccessMedicao: false,
    canAccessPortal: false,
    canAccessCompras: false,
    canAccessDashboardLucratividade: false,
  },
  start: { // Autônomo
    maxUsers: 1,
    maxObras: -1,
    maxDiariosPerObra: -1,
    maxMateriaisPerObra: -1,
    canAccessFinanceiro: true,
    canAccessMedicao: false,
    canAccessPortal: false,
    canAccessCompras: false,
    canAccessDashboardLucratividade: false,
  },
  gold: { // Construtora
    maxUsers: 3,
    maxObras: -1,
    maxDiariosPerObra: -1,
    maxMateriaisPerObra: -1,
    canAccessFinanceiro: true,
    canAccessMedicao: true,
    canAccessPortal: false,
    canAccessCompras: false,
    canAccessDashboardLucratividade: false,
  },
  premium: { // Business
    maxUsers: -1,
    maxObras: -1,
    maxDiariosPerObra: -1,
    maxMateriaisPerObra: -1,
    canAccessFinanceiro: true,
    canAccessMedicao: true,
    canAccessPortal: true,
    canAccessCompras: true,
    canAccessDashboardLucratividade: true,
  },
};

// Map plan names for upgrade messages
export const planUpgradeTarget: Record<string, { planName: string; feature: string }> = {
  financeiro: { planName: 'Autônomo', feature: 'Gestão Financeira' },
  medicao: { planName: 'Construtora', feature: 'Medições e Retenção Técnica' },
  portal: { planName: 'Business', feature: 'Portal do Cliente' },
  compras: { planName: 'Business', feature: 'Módulo de Compras' },
  lucratividade: { planName: 'Business', feature: 'Dashboard de Lucratividade' },
};

export function usePlanLimits() {
  const { user } = useAuth();
  const { plan } = useSubscription();

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

  const diariosQuery = useQuery({
    queryKey: ['diarios-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
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
        if (!error && count !== null) counts[obra.id] = count;
      }
      return counts;
    },
    enabled: !!user?.id,
  });

  const materiaisQuery = useQuery({
    queryKey: ['materiais-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
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
        if (!error && count !== null) counts[obra.id] = count;
      }
      return counts;
    },
    enabled: !!user?.id,
  });

  const limits = planLimitsConfig[plan];
  
  const usage: PlanUsage = {
    usersUsed: 1,
    obrasUsed: obrasQuery.data ?? 0,
    diariosUsed: diariosQuery.data ?? {},
    materiaisUsed: materiaisQuery.data ?? {},
  };

  const canCreateObra = () => {
    if (limits.maxObras === -1) return true;
    return usage.obrasUsed < limits.maxObras;
  };

  const canCreateDiario = (obraId: string) => {
    if (limits.maxDiariosPerObra === -1) return true;
    const currentCount = usage.diariosUsed[obraId] ?? 0;
    return currentCount < limits.maxDiariosPerObra;
  };

  const canCreateMaterial = (obraId: string) => {
    if (limits.maxMateriaisPerObra === -1) return true;
    const currentCount = usage.materiaisUsed[obraId] ?? 0;
    return currentCount < limits.maxMateriaisPerObra;
  };

  const getDiarioCount = (obraId: string) => usage.diariosUsed[obraId] ?? 0;
  const getMaterialCount = (obraId: string) => usage.materiaisUsed[obraId] ?? 0;

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
    plan,
    isLoading,
    refetch,
    canCreateObra,
    canCreateDiario,
    canCreateMaterial,
    getDiarioCount,
    getMaterialCount,
    getObrasPercentage,
    getDiariosPercentage,
    getMateriaisPercentage,
  };
}

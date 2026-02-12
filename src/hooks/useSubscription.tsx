import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export type SubscriptionPlan = 'free' | 'start' | 'gold' | 'premium';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  max_users: number;
  created_at: string;
  updated_at: string;
}

const planLimits: Record<SubscriptionPlan, number> = {
  free: 1,
  start: 2,
  gold: 3,
  premium: 5,
};

const planNames: Record<SubscriptionPlan, string> = {
  free: 'Iniciante',
  start: 'Autônomo',
  gold: 'Construtora',
  premium: 'Business',
};

export function useSubscription(overrideUserId?: string | null) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const targetUserId = overrideUserId || user?.id;

  // Buscar subscription do banco de dados
  const subscriptionQuery = useQuery({
    queryKey: ['subscription', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!targetUserId,
  });

  // Verificar subscription no Stripe e sincronizar
  const syncSubscription = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  // Sincronizar subscription ao carregar e periodicamente
  useEffect(() => {
    if (session?.access_token) {
      // Sync on load
      syncSubscription.mutate();
      
      // Sync every 5 minutes
      const interval = setInterval(() => {
        syncSubscription.mutate();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [session?.access_token]);

  // Check for upgrade success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      // Remove query params and sync
      window.history.replaceState({}, '', window.location.pathname);
      syncSubscription.mutate();
    }
  }, []);

  const updatePlan = useMutation({
    mutationFn: async ({ plan, stripeCustomerId, stripeSubscriptionId }: { 
      plan: SubscriptionPlan; 
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updateData: Record<string, unknown> = {
        plan,
        max_users: planLimits[plan],
      };
      
      if (stripeCustomerId) updateData.stripe_customer_id = stripeCustomerId;
      if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    },
  });

  const subscription = subscriptionQuery.data;
  const plan = (subscription?.plan || 'free') as SubscriptionPlan;
  const maxUsers = planLimits[plan];
  const planName = planNames[plan];

  return {
    subscription,
    plan,
    planName,
    maxUsers,
    isLoading: subscriptionQuery.isLoading,
    updatePlan,
    syncSubscription,
    planLimits,
    planNames,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  free: 'Free',
  start: 'Start',
  gold: 'Gold',
  premium: 'Premium',
};

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
  });

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
  const plan = subscription?.plan || 'free';
  const maxUsers = planLimits[plan];
  const planName = planNames[plan];

  return {
    subscription,
    plan,
    planName,
    maxUsers,
    isLoading: subscriptionQuery.isLoading,
    updatePlan,
    planLimits,
    planNames,
  };
}

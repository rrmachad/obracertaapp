import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UpgradePlanoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans: {
  id: SubscriptionPlan;
  name: string;
  price: number;
  users: number;
  features: string[];
  popular?: boolean;
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    users: 1,
    features: [
      '1 usuário (você)',
      'Obras ilimitadas',
      'Diário de obra',
      'Cronograma básico',
    ],
  },
  {
    id: 'start',
    name: 'Start',
    price: 29.90,
    users: 2,
    features: [
      '2 usuários',
      'Tudo do Free',
      'Controle de estoque',
      'Suporte por email',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 59.90,
    users: 3,
    features: [
      '3 usuários',
      'Tudo do Start',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99.90,
    users: 5,
    features: [
      '5 usuários',
      'Tudo do Gold',
      'Criar admins ilimitados',
      'API access',
      'Suporte 24/7',
    ],
  },
];

export function UpgradePlanoDialog({ open, onOpenChange }: UpgradePlanoDialogProps) {
  const { plan: currentPlan, planName } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);

  const handleSelectPlan = async (selectedPlan: SubscriptionPlan) => {
    if (selectedPlan === currentPlan) return;
    
    if (selectedPlan === 'free') {
      toast({
        title: 'Downgrade não disponível',
        description: 'Entre em contato com o suporte para fazer downgrade.',
      });
      return;
    }

    setLoading(selectedPlan);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Erro ao processar',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Escolha seu Plano
          </DialogTitle>
          <DialogDescription>
            Plano atual: <strong>{planName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {plans.map((planOption) => {
            const isCurrentPlan = planOption.id === currentPlan;
            const isDowngrade = plans.findIndex(p => p.id === planOption.id) < plans.findIndex(p => p.id === currentPlan);
            
            return (
              <Card 
                key={planOption.id}
                className={`relative ${planOption.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}
              >
                {planOption.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2">
                    {planOption.id === 'premium' && <Crown className="w-5 h-5 text-warning" />}
                    {planOption.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">
                      {planOption.price === 0 ? 'Grátis' : `R$ ${planOption.price.toFixed(2).replace('.', ',')}`}
                    </span>
                    {planOption.price > 0 && (
                      <span className="text-muted-foreground text-sm">/mês</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {planOption.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    variant={isCurrentPlan ? 'outline' : planOption.popular ? 'default' : 'secondary'}
                    className="w-full"
                    disabled={isCurrentPlan || isDowngrade || loading !== null}
                    onClick={() => handleSelectPlan(planOption.id)}
                  >
                    {loading === planOption.id ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Processando...
                      </span>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : isDowngrade ? (
                      'Downgrade'
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-1" />
                        Escolher
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

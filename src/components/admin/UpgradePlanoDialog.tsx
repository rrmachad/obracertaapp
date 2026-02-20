import { Check, Crown, Sparkles, Zap, Settings, Rocket, Users, Star, MessageCircle, Table2, ShieldCheck, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PlanoComparisonTable } from './PlanoComparisonTable';
import { useCurrency } from '@/hooks/useCurrency';

interface UpgradePlanoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanFeature {
  text: string;
  highlight?: boolean;
  icon?: 'check' | 'rocket' | 'users' | 'star' | 'shield';
}

interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  price: number;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
  buttonTextCurrent?: string;
}

const plans: PlanOption[] = [
  {
    id: 'free',
    name: 'Iniciante',
    price: 0,
    features: [
      { text: '1 Obra Ativa', icon: 'check' },
      { text: 'Cronograma de Fases', icon: 'check' },
      { text: 'Controle Básico de Estoque', icon: 'check' },
      { text: '⚠️ Ideal apenas para testar', icon: 'check' },
    ],
    buttonText: 'Seu Plano Atual',
    buttonTextCurrent: 'Seu Plano Atual',
  },
  {
    id: 'start',
    name: 'Autônomo',
    price: 19.90,
    features: [
      { text: 'Obras Ilimitadas', icon: 'rocket', highlight: true },
      { text: 'Diário de Obra Digital', icon: 'check' },
      { text: 'Controle de Estoque', icon: 'check' },
      { text: 'Cronograma Físico', icon: 'check' },
      { text: '1 Usuário', icon: 'check' },
    ],
    buttonText: 'Organizar Minhas Obras',
    buttonTextCurrent: 'Plano Atual',
  },
  {
    id: 'gold',
    name: 'Construtora',
    price: 39.90,
    features: [
      { text: 'Tudo do Plano Autônomo', icon: 'check', highlight: true },
      { text: 'Medições: Pague o executado', icon: 'shield', highlight: true },
      { text: 'Desconto Automático de Vales', icon: 'shield' },
      { text: 'Retenção Técnica (5%)', icon: 'shield' },
      { text: '3 Usuários', icon: 'users' },
    ],
    buttonText: 'Blindar Meu Caixa',
    buttonTextCurrent: 'Plano Atual',
  },
  {
    id: 'premium',
    name: 'Business',
    price: 79.90,
    popular: true,
    features: [
      { text: 'Tudo do Plano Construtora', icon: 'check', highlight: true },
      { text: 'Portal do Cliente', icon: 'star', highlight: true },
      { text: 'Módulo de Compras', icon: 'check' },
      { text: 'Usuários Ilimitados', icon: 'users', highlight: true },
      { text: 'Dashboard de Lucratividade', icon: 'check' },
      { text: 'Suporte VIP 24h', icon: 'star' },
    ],
    buttonText: 'Escalar Meu Negócio',
    buttonTextCurrent: 'Plano Atual',
  },
];

const planNames: Record<SubscriptionPlan, string> = {
  free: 'Iniciante',
  start: 'Autônomo',
  gold: 'Construtora',
  premium: 'Business',
};

function FeatureIcon({ icon, highlight }: { icon: PlanFeature['icon']; highlight?: boolean }) {
  const className = `w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-primary' : 'text-success'}`;
  
  switch (icon) {
    case 'rocket':
      return <Rocket className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    default:
      return <Check className={className} />;
  }
}

export function UpgradePlanoDialog({ open, onOpenChange }: UpgradePlanoDialogProps) {
  const { plan: currentPlan } = useSubscription();
  const { i18n } = useTranslation();
  const currency = i18n.language === 'pt-BR' ? 'BRL' : 'USD';
  const { session } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<SubscriptionPlan | null>(null);

  const currentPlanName = planNames[currentPlan] || 'Iniciante';

  const getLostFeatures = (targetPlan: SubscriptionPlan): string[] => {
    const currentIdx = plans.findIndex(p => p.id === currentPlan);
    const targetIdx = plans.findIndex(p => p.id === targetPlan);
    const lost: string[] = [];
    for (let i = targetIdx + 1; i <= currentIdx; i++) {
      plans[i].features
        .filter(f => f.highlight)
        .forEach(f => lost.push(f.text));
    }
    return lost;
  };

  const handleDowngradeClick = (targetPlan: SubscriptionPlan) => {
    setDowngradeTarget(targetPlan);
  };

  const confirmDowngrade = () => {
    setDowngradeTarget(null);
    handleManageSubscription();
  };

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
        body: { plan: selectedPlan, currency },
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

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Erro ao abrir portal',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Escolha o Plano Ideal para Você
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Plano atual: <strong>{currentPlanName}</strong></span>
            {currentPlan !== 'free' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <Settings className="w-4 h-4 mr-1" />
                {portalLoading ? 'Abrindo...' : 'Gerenciar Assinatura'}
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Comparar Detalhes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
              {plans.map((planOption, index) => {
                const isCurrentPlan = planOption.id === currentPlan;
                const isDowngrade = plans.findIndex(p => p.id === planOption.id) < plans.findIndex(p => p.id === currentPlan);
                
                return (
                  <Card 
                    key={planOption.id}
                    className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${planOption.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''} ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    {planOption.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Gestão Total
                      </Badge>
                    )}

                    {isCurrentPlan && !planOption.popular && (
                      <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1">
                        Atual
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="flex items-center justify-center gap-2 text-lg">
                        {planOption.id === 'premium' && <Crown className="w-5 h-5 text-warning" />}
                        {planOption.name}
                      </CardTitle>
                      <div className="mt-3">
                        <span className="text-3xl font-bold">
                          {planOption.price === 0 ? 'Grátis' : formatCurrency(planOption.price)}
                        </span>
                        {planOption.price > 0 && (
                          <span className="text-muted-foreground text-sm">/mês</span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex flex-col flex-1 space-y-4">
                      <ul className="space-y-2.5 text-sm flex-1">
                        {planOption.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <FeatureIcon icon={feature.icon} highlight={feature.highlight} />
                            <span className={feature.highlight ? 'font-semibold text-foreground' : ''}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button
                        variant={isCurrentPlan ? 'outline' : planOption.popular ? 'default' : 'secondary'}
                        className={`w-full ${planOption.popular && !isCurrentPlan ? 'bg-primary hover:bg-primary/90' : ''}`}
                        disabled={isCurrentPlan || loading !== null || portalLoading}
                        onClick={() => isDowngrade ? handleDowngradeClick(planOption.id) : handleSelectPlan(planOption.id)}
                      >
                        {loading === planOption.id || (isDowngrade && portalLoading) ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            Processando...
                          </span>
                        ) : isCurrentPlan ? (
                          planOption.buttonTextCurrent
                        ) : isDowngrade ? (
                          'Downgrade'
                        ) : (
                          <>
                            {planOption.id === 'start' && <Rocket className="w-4 h-4 mr-1" />}
                            {planOption.id === 'gold' && <ShieldCheck className="w-4 h-4 mr-1" />}
                            {planOption.id === 'premium' && <Crown className="w-4 h-4 mr-1" />}
                            {planOption.buttonText}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="table" className="animate-fade-in">
            <PlanoComparisonTable onSelectPlan={handleSelectPlan} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

      <AlertDialog open={!!downgradeTarget} onOpenChange={(open) => !open && setDowngradeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirmar Downgrade
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Você está prestes a fazer downgrade de <strong>{currentPlanName}</strong> para{' '}
                  <strong>{downgradeTarget ? planNames[downgradeTarget] : ''}</strong>.
                </p>
                {downgradeTarget && getLostFeatures(downgradeTarget).length > 0 && (
                  <div>
                    <p className="font-medium text-foreground mb-2">Você perderá acesso a:</p>
                    <ul className="space-y-1">
                      {getLostFeatures(downgradeTarget).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-destructive">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado ao portal de gerenciamento para concluir a alteração.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDowngrade}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from 'react';
import { Crown, Users, Building2, CheckCircle2, Unlock, AlertTriangle, FileText, Package, Rocket, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PlanoResumoCardProps {
  onUpgradeClick: () => void;
  ownerUserId?: string | null;
  isInvitedUser?: boolean;
}

const planColors: Record<SubscriptionPlan, string> = {
  free: 'bg-muted text-muted-foreground',
  start: 'bg-primary/10 text-primary',
  gold: 'bg-primary/20 text-primary',
  premium: 'bg-primary/30 text-primary',
};

export function PlanoResumoCard({ onUpgradeClick, ownerUserId, isInvitedUser }: PlanoResumoCardProps) {
  const { t } = useTranslation();
  const { plan, planName, maxUsers } = useSubscription(ownerUserId);
  const { limits, usage, getObrasPercentage, isOnTrial } = usePlanLimits();
  const { session } = useAuth();
  const { toast } = useToast();
  const [managingSubscription, setManagingSubscription] = useState(false);

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;
    setManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  const usersUsed = usage.usersUsed;
  const usersPercentage = (usersUsed / maxUsers) * 100;
  const obrasPercentage = getObrasPercentage();

  const planFeatures: Record<SubscriptionPlan, { included: string[]; locked: string[]; lockedTitle: string }> = {
    free: {
      included: [
        t('planoResumo.feat_free_1'),
        t('planoResumo.feat_free_2'),
        t('planoResumo.feat_free_3'),
        t('planoResumo.feat_free_4'),
      ],
      lockedTitle: t('planoResumo.unlock_start'),
      locked: [
        t('planoResumo.lock_free_1'),
        t('planoResumo.lock_free_2'),
        t('planoResumo.lock_free_3'),
        t('planoResumo.lock_free_4'),
      ],
    },
    start: {
      included: [
        t('planoResumo.feat_start_1'),
        t('planoResumo.feat_start_2'),
        t('planoResumo.feat_start_3'),
        t('planoResumo.feat_start_4'),
        t('planoResumo.feat_start_5'),
      ],
      lockedTitle: t('planoResumo.unlock_gold'),
      locked: [
        t('planoResumo.lock_start_1'),
        t('planoResumo.lock_start_2'),
        t('planoResumo.lock_start_3'),
        t('planoResumo.lock_start_4'),
      ],
    },
    gold: {
      included: [
        t('planoResumo.feat_gold_1'),
        t('planoResumo.feat_gold_2'),
        t('planoResumo.feat_gold_3'),
        t('planoResumo.feat_gold_4'),
        t('planoResumo.lock_gold_1'), // Portal do Cliente — já incluso no gold
        t('planoResumo.lock_gold_3'), // Dashboard de Lucratividade — já incluso no gold
        t('planoResumo.feat_gold_5'),
      ],
      lockedTitle: '',
      locked: [], // Business (premium) não é mais vendido — nenhum bloco de upsell
    },
    premium: {
      included: [
        t('planoResumo.feat_premium_1'),
        t('planoResumo.feat_premium_2'),
        t('planoResumo.feat_premium_3'),
        t('planoResumo.feat_premium_4'),
        t('planoResumo.feat_premium_5'),
        t('planoResumo.feat_premium_6'),
      ],
      lockedTitle: '',
      locked: [],
    },
  };

  const features = planFeatures[plan];

  const isAtUserLimit = usersUsed >= maxUsers;
  const isAtObraLimit = limits.maxObras !== -1 && usage.obrasUsed >= limits.maxObras;
  const isNearUserLimit = usersPercentage >= 80 && !isAtUserLimit;
  const isNearObraLimit = obrasPercentage >= 80 && !isAtObraLimit;
  
  const hasAnyLimit = isAtUserLimit || isAtObraLimit;
  const hasAnyNearLimit = isNearUserLimit || isNearObraLimit;
  const showLimitWarning = hasAnyLimit || hasAnyNearLimit;

  const formatLimit = (value: number) => {
    if (value === -1) return '∞';
    return value.toString();
  };

  const upgradeCtaKey: Record<string, string> = {
    free: 'planoResumo.ctaFree',
    start: 'planoResumo.ctaStart',
    gold: 'planoResumo.ctaGold',
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{isInvitedUser ? t('admin.teamPlan') : t('admin.myPlan')}</CardTitle>
          </div>
          <Badge className={planColors[plan]}>
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showLimitWarning && plan !== 'premium' && (
          <Alert variant={hasAnyLimit ? "destructive" : "default"} className={cn(
            "border",
            hasAnyLimit 
              ? "bg-destructive/10 border-destructive/30" 
              : "bg-primary/5 border-primary/20"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {hasAnyLimit ? (
                <>
                  <span className="font-semibold">{t('admin.growingManagement')}</span>
                  <span className="block text-sm mt-0.5">
                    {t('admin.upgradeToRemoveLimits')}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">{t('admin.growingManagement')}</span>
                  <span className="block text-sm mt-0.5">
                    {t('admin.approachingLimit')}
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Uso de recursos */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-lg p-3 transition-colors",
            isAtObraLimit ? "bg-destructive/10" : isNearObraLimit ? "bg-primary/10" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className={cn(
                "w-4 h-4",
                isAtObraLimit ? "text-destructive" : isNearObraLimit ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">{t('admin.worksLabel')}</span>
            </div>
            <p className="text-2xl font-bold">
              {usage.obrasUsed}
              <span className="text-base font-normal text-muted-foreground">/{formatLimit(limits.maxObras)}</span>
            </p>
            {limits.maxObras !== -1 && (
              <Progress 
                value={obrasPercentage} 
                className={cn(
                  "h-1.5 mt-1",
                  isAtObraLimit && "[&>div]:bg-destructive",
                  isNearObraLimit && !isAtObraLimit && "[&>div]:bg-primary"
                )} 
              />
            )}
          </div>

          <div className={cn(
            "rounded-lg p-3 transition-colors",
            isAtUserLimit ? "bg-destructive/10" : isNearUserLimit ? "bg-primary/10" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Users className={cn(
                "w-4 h-4",
                isAtUserLimit ? "text-destructive" : isNearUserLimit ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">{t('admin.accessLabel')}</span>
            </div>
            <p className="text-2xl font-bold">
              {usersUsed}
              <span className="text-base font-normal text-muted-foreground">/{maxUsers}</span>
            </p>
            <Progress 
              value={usersPercentage} 
              className={cn(
                "h-1.5 mt-1",
                isAtUserLimit && "[&>div]:bg-destructive",
                isNearUserLimit && !isAtUserLimit && "[&>div]:bg-primary"
              )} 
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('admin.diariesLabel')}</span>
            </div>
            <p className="text-lg font-bold">
              {formatLimit(limits.maxDiariosPerObra)}
              <span className="text-sm font-normal text-muted-foreground">{t('admin.perWork')}</span>
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('admin.stockLabel')}</span>
            </div>
            <p className="text-lg font-bold">
              {formatLimit(limits.maxMateriaisPerObra)}
              <span className="text-sm font-normal text-muted-foreground">{t('admin.itemsPerWork')}</span>
            </p>
          </div>
        </div>

        {/* Recursos incluídos */}
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">
            {t('admin.currentPackage', { plan: planName })}
          </p>
          <div className="space-y-1.5">
            {features.included.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recursos bloqueados */}
        {features.locked.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-sm font-semibold mb-2 text-primary flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              {features.lockedTitle}
            </p>
            <div className="space-y-1.5">
              {features.locked.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Unlock className="w-4 h-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de upgrade — apenas para free e start (gold não tem plano superior vendido) */}
        {(plan === 'free' || plan === 'start') && !isInvitedUser && (
          <Button 
            onClick={onUpgradeClick} 
            className={cn(
              "w-full font-semibold",
              showLimitWarning && "animate-pulse"
            )}
            variant="default"
            size="lg"
          >
            <Rocket className="w-4 h-4 mr-2" />
            {t(upgradeCtaKey[plan] || 'planoResumo.ctaFree')}
          </Button>
        )}

        {/* Gerenciar assinatura - only for paid plans (not during trial) */}
        {plan !== 'free' && !isInvitedUser && (
          <Button
            onClick={isOnTrial ? onUpgradeClick : handleManageSubscription}
            disabled={!isOnTrial && managingSubscription}
            variant="outline"
            className="w-full"
          >
            {!isOnTrial && managingSubscription ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {isOnTrial ? 'Ver Planos de Assinatura' : t('planoResumo.manageSubscription')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
import { Lock, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { planUpgradeTarget } from '@/hooks/usePlanLimits';

interface FeatureBlockedOverlayProps {
  featureKey: keyof typeof planUpgradeTarget;
  onUpgradeClick?: () => void;
  isTrialExpired?: boolean;
}

export function FeatureBlockedOverlay({ featureKey, onUpgradeClick, isTrialExpired = false }: FeatureBlockedOverlayProps) {
  const info = planUpgradeTarget[featureKey];

  if (isTrialExpired) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full text-center border-dashed border-2 border-amber-300 dark:border-amber-700">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold">Seu teste grátis expirou</h3>
            <p className="text-muted-foreground">
              Você tinha acesso a <strong>{info.feature}</strong> durante o período de teste.
              Assine o plano <strong>{info.planName}</strong> para continuar usando este recurso.
            </p>
            {onUpgradeClick && (
              <Button onClick={onUpgradeClick} size="lg" className="gap-2 mt-2">
                <Crown className="w-5 h-5" />
                Assinar plano {info.planName}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <Card className="max-w-md w-full text-center border-dashed border-2">
        <CardContent className="p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">
            {info.feature}
          </h3>
          <p className="text-muted-foreground">
            Este recurso está disponível a partir do plano <strong>{info.planName}</strong>.
            Faça upgrade para desbloquear e potencializar sua gestão.
          </p>
          {onUpgradeClick && (
            <Button onClick={onUpgradeClick} size="lg" className="gap-2 mt-2">
              <Crown className="w-5 h-5" />
              Upgrade para {info.planName}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
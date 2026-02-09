import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { planUpgradeTarget } from '@/hooks/usePlanLimits';

interface FeatureBlockedOverlayProps {
  featureKey: keyof typeof planUpgradeTarget;
  onUpgradeClick?: () => void;
}

export function FeatureBlockedOverlay({ featureKey, onUpgradeClick }: FeatureBlockedOverlayProps) {
  const info = planUpgradeTarget[featureKey];
  
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
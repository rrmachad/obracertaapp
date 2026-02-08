import { Crown, Users, Building2, CheckCircle2, Lock, AlertTriangle, FileText, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { cn } from '@/lib/utils';

interface PlanoResumoCardProps {
  onUpgradeClick: () => void;
}

const planFeatures: Record<SubscriptionPlan, { included: string[]; locked: string[] }> = {
  free: {
    included: [
      '1 obra',
      '3 diários por obra',
      '5 itens no estoque',
      'Cronograma de fases',
    ],
    locked: [
      'Obras ilimitadas',
      'Diários ilimitados',
      'Estoque ilimitado',
      'Compartilhar com equipe',
      'Relatórios avançados',
    ],
  },
  start: {
    included: [
      'Até 5 obras',
      '50 diários por obra',
      '30 itens no estoque',
      'Cronograma de fases',
      'Compartilhar com 1 usuário',
    ],
    locked: [
      'Obras ilimitadas',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
  gold: {
    included: [
      'Até 15 obras',
      '100 diários por obra',
      '100 itens no estoque',
      'Cronograma de fases',
      'Compartilhar com 2 usuários',
      'Relatórios avançados',
    ],
    locked: [
      'Obras ilimitadas',
      'Suporte prioritário',
    ],
  },
  premium: {
    included: [
      'Obras ilimitadas',
      'Diários ilimitados',
      'Estoque ilimitado',
      'Cronograma de fases',
      'Compartilhar com 4 usuários',
      'Relatórios avançados',
      'Suporte 24/7',
    ],
    locked: [],
  },
};

const planColors: Record<SubscriptionPlan, string> = {
  free: 'bg-muted text-muted-foreground',
  start: 'bg-primary/10 text-primary',
  gold: 'bg-primary/20 text-primary',
  premium: 'bg-primary/30 text-primary',
};

export function PlanoResumoCard({ onUpgradeClick }: PlanoResumoCardProps) {
  const { plan, planName, maxUsers } = useSubscription();
  const { limits, usage, getObrasPercentage } = usePlanLimits();

  const usersUsed = usage.usersUsed;
  const usersPercentage = (usersUsed / maxUsers) * 100;
  const obrasPercentage = getObrasPercentage();

  const features = planFeatures[plan];

  // Verificar se está no limite em qualquer recurso
  const isAtUserLimit = usersUsed >= maxUsers;
  const isAtObraLimit = limits.maxObras !== -1 && usage.obrasUsed >= limits.maxObras;
  const isNearUserLimit = usersPercentage >= 80 && !isAtUserLimit;
  const isNearObraLimit = obrasPercentage >= 80 && !isAtObraLimit;
  
  const hasAnyLimit = isAtUserLimit || isAtObraLimit;
  const hasAnyNearLimit = isNearUserLimit || isNearObraLimit;
  const showLimitWarning = hasAnyLimit || hasAnyNearLimit;

  // Formatar limite para exibição
  const formatLimit = (value: number) => {
    if (value === -1) return '∞';
    return value.toString();
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Meu Plano</CardTitle>
          </div>
          <Badge className={planColors[plan]}>
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta de limite */}
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
                  <span className="font-semibold">Você atingiu o limite do plano Free!</span>
                  <span className="block text-sm mt-0.5">
                    Faça upgrade para continuar usando todos os recursos.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Quase no limite!</span>
                  <span className="block text-sm mt-0.5">
                    Você está se aproximando do limite do plano Free.
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Uso de recursos - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          {/* Obras */}
          <div className={cn(
            "rounded-lg p-3 transition-colors",
            isAtObraLimit ? "bg-destructive/10" : isNearObraLimit ? "bg-primary/10" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className={cn(
                "w-4 h-4",
                isAtObraLimit ? "text-destructive" : isNearObraLimit ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Obras</span>
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

          {/* Acessos */}
          <div className={cn(
            "rounded-lg p-3 transition-colors",
            isAtUserLimit ? "bg-destructive/10" : isNearUserLimit ? "bg-primary/10" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Users className={cn(
                "w-4 h-4",
                isAtUserLimit ? "text-destructive" : isNearUserLimit ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Acessos</span>
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

          {/* Diários por obra */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Diários</span>
            </div>
            <p className="text-lg font-bold">
              {formatLimit(limits.maxDiariosPerObra)}
              <span className="text-sm font-normal text-muted-foreground">/obra</span>
            </p>
          </div>

          {/* Materiais por obra */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estoque</span>
            </div>
            <p className="text-lg font-bold">
              {formatLimit(limits.maxMateriaisPerObra)}
              <span className="text-sm font-normal text-muted-foreground"> itens/obra</span>
            </p>
          </div>
        </div>

        {/* Recursos incluídos */}
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Incluído no seu plano:</p>
          <div className="space-y-1.5">
            {features.included.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recursos bloqueados */}
        {features.locked.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Disponível em planos superiores:</p>
            <div className="space-y-1.5">
              {features.locked.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de upgrade */}
        {plan !== 'premium' && (
          <Button 
            onClick={onUpgradeClick} 
            className={cn(
              "w-full",
              showLimitWarning && "animate-pulse"
            )}
            variant={hasAnyLimit ? "default" : "outline"}
          >
            <Crown className="w-4 h-4 mr-2" />
            {hasAnyLimit ? "Fazer Upgrade Agora" : "Fazer Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

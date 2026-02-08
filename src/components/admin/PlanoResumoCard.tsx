import { Crown, Users, Building2, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { useObras } from '@/hooks/useObras';
import { cn } from '@/lib/utils';

interface PlanoResumoCardProps {
  onUpgradeClick: () => void;
}

const planFeatures: Record<SubscriptionPlan, { included: string[]; locked: string[] }> = {
  free: {
    included: [
      'Criar obras ilimitadas',
      'Diário de obra',
      'Controle de estoque',
      'Cronograma de fases',
    ],
    locked: [
      'Compartilhar com equipe',
      'Relatórios avançados',
      'Suporte prioritário',
      'Múltiplos administradores',
    ],
  },
  start: {
    included: [
      'Criar obras ilimitadas',
      'Diário de obra',
      'Controle de estoque',
      'Cronograma de fases',
      'Compartilhar com 1 usuário',
    ],
    locked: [
      'Relatórios avançados',
      'Suporte prioritário',
      'Múltiplos administradores',
    ],
  },
  gold: {
    included: [
      'Criar obras ilimitadas',
      'Diário de obra',
      'Controle de estoque',
      'Cronograma de fases',
      'Compartilhar com 2 usuários',
      'Relatórios avançados',
    ],
    locked: [
      'Suporte prioritário',
      'Múltiplos administradores',
    ],
  },
  premium: {
    included: [
      'Criar obras ilimitadas',
      'Diário de obra',
      'Controle de estoque',
      'Cronograma de fases',
      'Compartilhar com 4 usuários',
      'Relatórios avançados',
      'Suporte 24/7',
      'Múltiplos administradores',
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
  const { obras } = useObras();

  const obrasCount = obras.length;
  const usersUsed = 1; // Por enquanto, apenas o usuário atual
  const usersPercentage = (usersUsed / maxUsers) * 100;

  const features = planFeatures[plan];

  // Alerta quando próximo ou no limite
  const isAtLimit = usersUsed >= maxUsers;
  const isNearLimit = usersPercentage >= 80 && !isAtLimit;
  const showLimitWarning = isAtLimit || isNearLimit;

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
          <Alert variant={isAtLimit ? "destructive" : "default"} className={cn(
            "border",
            isAtLimit 
              ? "bg-destructive/10 border-destructive/30" 
              : "bg-primary/5 border-primary/20"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {isAtLimit ? (
                <>
                  <span className="font-semibold">Você atingiu o limite de acessos!</span>
                  <span className="block text-sm mt-0.5">
                    Faça upgrade para adicionar mais pessoas à sua equipe.
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Quase no limite!</span>
                  <span className="block text-sm mt-0.5">
                    Você está usando {usersUsed} de {maxUsers} acessos disponíveis.
                  </span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Uso de recursos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Obras</span>
            </div>
            <p className="text-2xl font-bold">{obrasCount}</p>
            <p className="text-xs text-muted-foreground">Ilimitadas</p>
          </div>
          <div className={cn(
            "rounded-lg p-3 transition-colors",
            isAtLimit ? "bg-destructive/10" : isNearLimit ? "bg-primary/10" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Users className={cn(
                "w-4 h-4",
                isAtLimit ? "text-destructive" : isNearLimit ? "text-primary" : "text-muted-foreground"
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
                isAtLimit && "[&>div]:bg-destructive",
                isNearLimit && !isAtLimit && "[&>div]:bg-primary"
              )} 
            />
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
            variant={isAtLimit ? "default" : "outline"}
          >
            <Crown className="w-4 h-4 mr-2" />
            {isAtLimit ? "Fazer Upgrade Agora" : "Fazer Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

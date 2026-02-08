import { Crown, Users, Building2, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { useObras } from '@/hooks/useObras';

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
  start: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  gold: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  premium: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export function PlanoResumoCard({ onUpgradeClick }: PlanoResumoCardProps) {
  const { plan, planName, maxUsers } = useSubscription();
  const { obras } = useObras();

  const obrasCount = obras.length;
  const usersUsed = 1; // Por enquanto, apenas o usuário atual
  const usersPercentage = (usersUsed / maxUsers) * 100;

  const features = planFeatures[plan];

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
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Acessos</span>
            </div>
            <p className="text-2xl font-bold">{usersUsed}<span className="text-base font-normal text-muted-foreground">/{maxUsers}</span></p>
            <Progress value={usersPercentage} className="h-1.5 mt-1" />
          </div>
        </div>

        {/* Recursos incluídos */}
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Incluído no seu plano:</p>
          <div className="space-y-1.5">
            {features.included.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
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
            className="w-full"
            variant="outline"
          >
            <Crown className="w-4 h-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

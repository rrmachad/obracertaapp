import { Users, UserPlus, Ban, Shield, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMetrics } from '@/hooks/useAdminUsers';

interface UserMetricsCardsProps {
  metrics: UserMetrics;
  isLoading?: boolean;
}

export function UserMetricsCards({ metrics, isLoading }: UserMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Total de usuários */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.total}</p>
              <p className="text-xs text-muted-foreground">Total de usuários</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Novos este mês */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <UserPlus className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.newThisMonth}</p>
              <p className="text-xs text-muted-foreground">Novos este mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Por plano */}
      <Card className="col-span-2 md:col-span-1">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Crown className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Por plano</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Free: {metrics.byPlan.free}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Start: {metrics.byPlan.start}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Gold: {metrics.byPlan.gold}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Premium: {metrics.byPlan.premium}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Shield className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.admins}</p>
              <p className="text-xs text-muted-foreground">Administradores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloqueados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Ban className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.blocked}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

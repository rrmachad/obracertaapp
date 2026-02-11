import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  FileText, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  stats: {
    totalObras: number;
    obrasAtivas: number;
    obrasConcluidas: number;
    obrasPlanejamento: number;
    obrasPausadas: number;
    totalDiarios: number;
    totalMateriais: number;
    totalCronograma: number;
    itensConcluidos: number;
    diariosSemanais: number;
    diariosMensais: number;
    materiaisEmAlerta: number;
    progressoMedio: number;
  } | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function StatCard({ title, value, subtitle, icon, trend, trendValue, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-primary/5 border-primary/20',
    warning: 'bg-chart-3/10 border-chart-3/30',
    destructive: 'bg-destructive/5 border-destructive/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-primary',
    warning: 'text-chart-3',
    destructive: 'text-destructive',
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend === 'up' && "text-primary",
                trend === 'down' && "text-destructive",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  trend === 'down' && "rotate-180"
                )} />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg bg-muted/50", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-24">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const progressoCronograma = stats.totalCronograma > 0 
    ? Math.round((stats.itensConcluidos / stats.totalCronograma) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('admin.totalWorks')}
          value={stats.totalObras}
          subtitle={t('admin.inProgressCount', { count: stats.obrasAtivas })}
          icon={<Building2 className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title={t('admin.diaryRecords')}
          value={stats.totalDiarios}
          subtitle={`${stats.diariosSemanais} ${t('admin.thisWeek')}`}
          icon={<FileText className="w-5 h-5" />}
          variant="success"
          trend={stats.diariosSemanais > 0 ? 'up' : 'neutral'}
          trendValue={stats.diariosSemanais > 0 ? t('admin.plusThisWeek', { count: stats.diariosSemanais }) : t('admin.noRecords')}
        />
        <StatCard
          title={t('admin.registeredMaterials')}
          value={stats.totalMateriais}
          subtitle={stats.materiaisEmAlerta > 0 ? t('admin.inAlert', { count: stats.materiaisEmAlerta }) : t('admin.stockOk')}
          icon={<Package className="w-5 h-5" />}
          variant={stats.materiaisEmAlerta > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title={t('admin.averageProgress')}
          value={`${stats.progressoMedio}%`}
          subtitle={t('admin.ofYourWorks')}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('admin.activeWorks')}
          value={stats.obrasAtivas}
          icon={<Clock className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title={t('admin.completedWorks')}
          value={stats.obrasConcluidas}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title={t('admin.monthlyDiaries')}
          value={stats.diariosMensais}
          icon={<Calendar className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title={t('admin.materialsInAlert')}
          value={stats.materiaisEmAlerta}
          subtitle={stats.materiaisEmAlerta > 0 ? t('admin.lowStock') : t('admin.allGood')}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={stats.materiaisEmAlerta > 0 ? 'destructive' : 'default'}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {t('admin.scheduleProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={progressoCronograma} className="flex-1" />
            <span className="text-sm font-medium min-w-16 text-right">
              {t('admin.itemsCount', { done: stats.itensConcluidos, total: stats.totalCronograma })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('admin.tasksCompleted', { pct: progressoCronograma })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

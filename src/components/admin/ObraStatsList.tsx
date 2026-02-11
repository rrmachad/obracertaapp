import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Clock, CheckCircle2, Pause, FileText, ExternalLink, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ObraStats } from '@/hooks/useAdminStats';

interface ObraStatsListProps {
  obras: ObraStats[];
  isLoading: boolean;
}

const localeMap: Record<string, Locale> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': es };

export function ObraStatsList({ obras, isLoading }: ObraStatsListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = localeMap[i18n.language] || ptBR;

  const statusConfig = {
    planejamento: { label: t('status.planning'), icon: Clock, color: 'bg-muted text-muted-foreground' },
    em_andamento: { label: t('status.inProgress'), icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    concluida: { label: t('status.completed'), icon: CheckCircle2, color: 'bg-chart-2/10 text-chart-2' },
    pausada: { label: t('status.paused'), icon: Pause, color: 'bg-chart-3/10 text-chart-3' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {t('admin.yourWorks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          {t('admin.yourWorks')}
        </CardTitle>
        <CardDescription>{t('admin.worksOverview')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {obras.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{t('admin.noWorksRegistered')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard')}>
              {t('admin.registerFirst')}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {obras.map((obra) => {
                const status = statusConfig[obra.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;

                return (
                  <div 
                    key={obra.id}
                    className="group p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/obra/${obra.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{obra.nome}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{obra.endereco}</span>
                        </div>
                      </div>
                      <Badge className={cn("ml-2 shrink-0", status?.color)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{t('admin.progress')}</span>
                        <span>{obra.progresso}%</span>
                      </div>
                      <Progress value={obra.progresso} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{obra.totalDiarios} {t('admin.diaries')}</span>
                        </div>
                        {obra.ultimaAtividade && (
                          <span className="text-muted-foreground/60">
                            {t('admin.last')} {format(new Date(obra.ultimaAtividade), 'dd/MM', { locale: dateLocale })}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {t('admin.open')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

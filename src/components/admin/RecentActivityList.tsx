import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Package, 
  Clock, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { RecentActivity } from '@/hooks/useAdminStats';

interface RecentActivityListProps {
  activities: RecentActivity[];
  isLoading: boolean;
}

const climaIcons: Record<string, React.ReactNode> = {
  ensolarado: <Sun className="w-3 h-3 text-chart-4" />,
  nublado: <Cloud className="w-3 h-3 text-muted-foreground" />,
  chuvoso: <CloudRain className="w-3 h-3 text-chart-1" />,
  parcialmente_nublado: <CloudSun className="w-3 h-3 text-chart-3" />,
};

const localeMap: Record<string, Locale> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': es };

export function RecentActivityList({ activities, isLoading }: RecentActivityListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = localeMap[i18n.language] || ptBR;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('admin.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diario': return <FileText className="w-4 h-4 text-primary" />;
      case 'material': return <Package className="w-4 h-4 text-chart-2" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diario': return t('admin.typeDiary');
      case 'material': return t('admin.typeStock');
      default: return t('admin.typeSchedule');
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          {t('admin.recentActivity')}
        </CardTitle>
        <CardDescription>{t('admin.latestRecords')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{t('admin.noActivityYet')}</p>
            <p className="text-xs text-muted-foreground">{t('admin.startAddingDiary')}</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3 pr-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="group flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/obra/${activity.obraId}`)}
                >
                  <div className="p-2 rounded-full bg-background border">
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {getTypeLabel(activity.type)}
                      </Badge>
                      {activity.clima && climaIcons[activity.clima]}
                    </div>
                    <p className="text-sm font-medium truncate">{activity.obraName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: dateLocale })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

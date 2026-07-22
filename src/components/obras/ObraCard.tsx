import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, ChevronRight, AlertTriangle, NotebookPen, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Obra, ObraStatus } from '@/types/database';

interface ObraCardProps {
  obra: Obra;
  lowStockCount?: number;
  diarioHojeLancado?: boolean;
}

export function ObraCard({ obra, lowStockCount = 0, diarioHojeLancado = false }: ObraCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const statusConfig: Record<ObraStatus, { label: string; className: string }> = {
    planejamento: { label: t('status.planning'), className: 'bg-muted text-muted-foreground' },
    em_andamento: { label: t('status.inProgress'), className: 'bg-primary text-primary-foreground' },
    concluida: { label: t('status.completed'), className: 'bg-success text-success-foreground' },
    pausada: { label: t('status.paused'), className: 'bg-warning text-warning-foreground' },
  };

  const status = statusConfig[obra.status];

  const dateLocale = i18n.language === 'en-US' ? 'en-US' : i18n.language === 'es-ES' ? 'es-ES' : 'pt-BR';

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 active:scale-[0.98]"
      onClick={() => navigate(`/obra/${obra.id}`)}
    >
      <CardContent className="p-0">
        {/* Foto de capa */}
        <div className="relative h-32 bg-muted overflow-hidden rounded-t-lg">
          {obra.foto_capa ? (
            <img 
              src={obra.foto_capa} 
              alt={obra.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <div className="text-4xl font-bold text-primary/40">
                {obra.nome.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${status.className}`}>
            {status.label}
          </Badge>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{obra.nome}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{obra.endereco}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('admin.progress')}</span>
              <span className="font-semibold text-primary">{obra.progresso}%</span>
            </div>
            <Progress value={obra.progresso} className="h-3" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{t('obraCard.createdAt')} {new Date(obra.created_at).toLocaleDateString(dateLocale)}</span>
            </div>
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs shrink-0">
                <AlertTriangle className="w-3 h-3" />
                {lowStockCount}
              </Badge>
            )}
          </div>

          {/* Ação rápida: diário de hoje */}
          <Button
            variant={diarioHojeLancado ? 'ghost' : 'outline'}
            size="sm"
            className={`w-full ${diarioHojeLancado ? 'text-success hover:text-success' : 'border-primary/40 text-primary hover:bg-primary/5 hover:text-primary'}`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/obra/${obra.id}?tab=diario`);
            }}
          >
            {diarioHojeLancado ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {t('obraCard.diaryTodayDone')}
              </>
            ) : (
              <>
                <NotebookPen className="w-4 h-4 mr-2" />
                {t('obraCard.launchDiaryToday')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
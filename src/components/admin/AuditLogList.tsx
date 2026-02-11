import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { History, FileText, Calendar, ArrowRight, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface AlteracaoComDetalhes {
  id: string;
  diario_id: string;
  user_id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  motivo: string | null;
  created_at: string;
  obra_nome?: string;
  diario_data?: string;
}

const localeMap: Record<string, Locale> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': es };

export function AuditLogList() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const dateLocale = localeMap[i18n.language] || ptBR;

  const { data: alteracoes, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data: alteracoesData, error: alteracoesError } = await supabase
        .from('diario_log_alteracoes')
        .select(`*, diario_log:diario_id ( data, obra_id, obras:obra_id ( nome ) )`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (alteracoesError) throw alteracoesError;

      return (alteracoesData || []).map((item: any) => ({
        id: item.id, diario_id: item.diario_id, user_id: item.user_id,
        campo_alterado: item.campo_alterado, valor_anterior: item.valor_anterior,
        valor_novo: item.valor_novo, motivo: item.motivo, created_at: item.created_at,
        obra_nome: item.diario_log?.obras?.nome || t('admin.unknownWork'),
        diario_data: item.diario_log?.data,
      })) as AlteracaoComDetalhes[];
    },
  });

  const campoLabels: Record<string, string> = {
    data: t('admin.fieldDate'), clima: t('admin.fieldWeather'),
    atividades_realizadas: t('admin.fieldActivities'), observacoes: t('admin.fieldObservations'),
    profissionais: t('admin.fieldProfessionals'), fotos: t('admin.fieldPhotos'),
  };

  const formatCampo = (campo: string) => campoLabels[campo] || campo;

  const formatValor = (campo: string, valor: string | null): string => {
    if (!valor) return t('admin.empty');
    if (campo === 'profissionais') {
      try {
        const profs = JSON.parse(valor);
        if (Array.isArray(profs) && profs.length > 0) return profs.map((p: any) => `${p.quantidade}x ${p.funcao}`).join(', ');
        return t('admin.none');
      } catch { return valor; }
    }
    if (campo === 'clima') {
      const climaLabels: Record<string, string> = {
        ensolarado: t('admin.weatherSunny'), parcialmente_nublado: t('admin.weatherPartly'),
        nublado: t('admin.weatherCloudy'), chuvoso: t('admin.weatherRainy'),
      };
      return climaLabels[valor] || valor;
    }
    if (valor.length > 60) return valor.substring(0, 60) + '...';
    return valor;
  };

  const filteredAlteracoes = alteracoes?.filter((alt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return alt.obra_nome?.toLowerCase().includes(term) || alt.campo_alterado.toLowerCase().includes(term) || alt.motivo?.toLowerCase().includes(term);
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            {t('admin.auditHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            {t('admin.auditHistory')}
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('admin.searchAudit')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full sm:w-64" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlteracoes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('admin.noChangesYet')}</p>
            <p className="text-sm">{t('admin.changesAppearHere')}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredAlteracoes?.map((alteracao) => (
                <div key={alteracao.id} className="border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="gap-1"><FileText className="w-3 h-3" />{alteracao.obra_nome}</Badge>
                      {alteracao.diario_data && (
                        <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" />{format(parseISO(alteracao.diario_data), 'dd/MM/yyyy')}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(alteracao.created_at), `dd/MM/yy '${t('admin.atTime')}' HH:mm`, { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">{formatCampo(alteracao.campo_alterado)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="text-muted-foreground line-through">{formatValor(alteracao.campo_alterado, alteracao.valor_anterior)}</span>
                      <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-medium">{formatValor(alteracao.campo_alterado, alteracao.valor_novo)}</span>
                    </div>
                    {alteracao.motivo && (
                      <p className="text-xs text-muted-foreground mt-1 italic border-l-2 border-primary/30 pl-2">"{alteracao.motivo}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

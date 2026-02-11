import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, type Locale } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { 
  FileText, Calendar, Users, Cloud, ChevronLeft, ChevronRight, Sun, CloudSun, 
  CloudRain, RotateCcw, ChevronDown, ChevronUp, Image, Download, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DiarioLog, ClimaTipo } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import {
  generateMonthlyReportPDF, MonthlyReportData, PDFOptions,
} from '@/lib/relatorioExport';
import { GraficosComparativos } from './GraficosComparativos';
import { CompartilharPDFDialog } from './CompartilharPDFDialog';
import jsPDF from 'jspdf';

interface RelatorioMensalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registros: DiarioLog[];
  obraNome: string;
  pdfOptions?: PDFOptions;
}

const climaIcons: Record<ClimaTipo, React.ReactNode> = {
  ensolarado: <Sun className="w-4 h-4 text-primary" />,
  parcialmente_nublado: <CloudSun className="w-4 h-4 text-primary" />,
  nublado: <Cloud className="w-4 h-4 text-muted-foreground" />,
  chuvoso: <CloudRain className="w-4 h-4 text-primary" />,
};

const dateLocales: Record<string, Locale> = { 'pt-BR': ptBR, 'en-US': enUS, 'es-ES': es };

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function RelatorioMensalDialog({ 
  open, onOpenChange, registros, obraNome, pdfOptions
}: RelatorioMensalDialogProps) {
  const { t, i18n } = useTranslation();
  const locale = dateLocales[i18n.language] || ptBR;
  const [monthOffset, setMonthOffset] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedRegistro, setSelectedRegistro] = useState<DiarioLog | null>(null);
  const [viewMode, setViewMode] = useState<'resumo' | 'graficos'>('resumo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [generatedPDF, setGeneratedPDF] = useState<jsPDF | null>(null);
  const [pdfFilename, setPdfFilename] = useState('');
  const { toast } = useToast();

  const climaLabels: Record<ClimaTipo, string> = {
    ensolarado: t('diary.sunny'),
    parcialmente_nublado: t('diary.partlyCloudy'),
    nublado: t('diary.cloudy'),
    chuvoso: t('diary.rainy'),
  };

  const mesAtual = useMemo(() => {
    const baseDate = subMonths(new Date(), monthOffset);
    const inicio = startOfMonth(baseDate);
    const fim = endOfMonth(baseDate);
    return { inicio, fim, base: baseDate };
  }, [monthOffset]);

  const registrosMes = useMemo(() => {
    return registros.filter(r => {
      const dataRegistro = parseDateOnlyAsLocal(r.data);
      return dataRegistro >= mesAtual.inicio && dataRegistro <= mesAtual.fim;
    });
  }, [registros, mesAtual]);

  const diasComRegistro = useMemo(() => {
    return registrosMes.map(registro => ({
      dia: parseDateOnlyAsLocal(registro.data),
      registro,
    })).sort((a, b) => b.dia.getTime() - a.dia.getTime());
  }, [registrosMes]);

  const estatisticas = useMemo(() => {
    const totalProfissionais: Record<string, number> = {};
    let totalDias = 0;
    const climaContagem: Record<ClimaTipo, number> = {
      ensolarado: 0, parcialmente_nublado: 0, nublado: 0, chuvoso: 0,
    };

    registrosMes.forEach(registro => {
      totalDias++;
      climaContagem[registro.clima]++;
      registro.profissionais?.forEach(prof => {
        totalProfissionais[prof.funcao] = (totalProfissionais[prof.funcao] || 0) + prof.quantidade;
      });
    });

    return {
      diasTrabalhados: totalDias,
      diasNoMes: getDaysInMonth(mesAtual.base),
      profissionais: totalProfissionais,
      clima: climaContagem,
      totalProfissionais: Object.values(totalProfissionais).reduce((a, b) => a + b, 0),
    };
  }, [registrosMes, mesAtual]);

  const toggleDay = (diaKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(diaKey)) next.delete(diaKey); else next.add(diaKey);
      return next;
    });
  };

  const getReportData = (): MonthlyReportData => ({
    obraNome, mes: mesAtual.base, estatisticas, registros: registrosMes,
  });

  const exportarPDF = async () => {
    setIsGenerating(true);
    try {
      const data = getReportData();
      const doc = await generateMonthlyReportPDF(data, pdfOptions);
      const filename = `relatorio-mensal-${format(mesAtual.base, 'MM-yyyy')}.pdf`;
      setGeneratedPDF(doc);
      setPdfFilename(filename);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: t('diary.errorGeneratingPDF'),
        description: t('diary.couldNotGeneratePDF'),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getOffsetLabel = () => {
    if (monthOffset === 0) return t('dialogs.thisMonth');
    if (monthOffset === 1) return t('dialogs.lastMonth');
    return t('dialogs.monthsAgo', { count: monthOffset });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6 text-primary" />
              {t('dialogs.monthlyReport')}
            </DialogTitle>
            <DialogDescription>{t('dialogs.monthlyReportDesc')}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <Button variant="outline" size="icon" onClick={() => setMonthOffset(m => m + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center flex flex-col items-center gap-1">
              <p className="font-semibold capitalize">
                {format(mesAtual.base, "MMMM yyyy", { locale })}
              </p>
              <p className="text-sm text-muted-foreground">{getOffsetLabel()}</p>
              {monthOffset > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMonthOffset(0)} className="text-xs h-6 px-2 gap-1">
                  <RotateCcw className="w-3 h-3" />
                  {t('dialogs.backToToday')}
                </Button>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => setMonthOffset(m => m - 1)} disabled={monthOffset === 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'resumo' | 'graficos')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo" className="gap-1">
                <FileText className="w-4 h-4" />
                {t('dialogs.summary')}
              </TabsTrigger>
              <TabsTrigger value="graficos" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                {t('dialogs.charts')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{estatisticas.diasTrabalhados}</div>
                    <p className="text-xs text-muted-foreground">{t('dialogs.daysWorked')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{estatisticas.diasNoMes}</div>
                    <p className="text-xs text-muted-foreground">{t('dialogs.daysInMonth')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{estatisticas.totalProfissionais}</div>
                    <p className="text-xs text-muted-foreground">{t('dialogs.attendances')}</p>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(estatisticas.profissionais).length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t('dialogs.monthlyStaff')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(estatisticas.profissionais).map(([funcao, qtd]) => (
                        <Badge key={funcao} variant="secondary">{qtd}× {funcao}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    {t('dialogs.monthlyWeather')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(estatisticas.clima)
                      .filter(([, count]) => count > 0)
                      .map(([clima, count]) => (
                        <Badge key={clima} variant="outline" className="gap-1">
                          {climaIcons[clima as ClimaTipo]}
                          {count} {t('dialogs.days')}
                        </Badge>
                      ))}
                    {Object.values(estatisticas.clima).every(c => c === 0) && (
                      <span className="text-sm text-muted-foreground">{t('dialogs.noRecordsThisMonth')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('dialogs.dailyActivities')} ({registrosMes.length} {t('dialogs.records')})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {diasComRegistro.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('dialogs.noRecords')}</p>
                  ) : (
                    diasComRegistro.map(({ dia, registro }) => {
                      const diaKey = dia.toISOString();
                      const isExpanded = expandedDays.has(diaKey);
                      const diaFormatado = format(dia, "EEEE, dd/MM", { locale });
                      
                      return (
                        <Collapsible key={diaKey} open={isExpanded} onOpenChange={() => toggleDay(diaKey)}>
                          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                            <CollapsibleTrigger asChild>
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium bg-primary/10 text-primary">
                                    <span>{format(dia, "EEE", { locale })}</span>
                                    <span className="text-lg font-bold leading-none">{format(dia, "dd")}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium capitalize">{diaFormatado}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{registro.atividades_realizadas}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {climaIcons[registro.clima]}
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedRegistro(registro); }}>
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="px-3 pb-3 pt-0">
                                <Separator className="mb-3" />
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <p className="font-medium text-xs text-muted-foreground mb-1">{t('diary.activities')}</p>
                                    <p className="whitespace-pre-wrap">{registro.atividades_realizadas}</p>
                                  </div>
                                  {registro.observacoes && (
                                    <div>
                                      <p className="font-medium text-xs text-muted-foreground mb-1">{t('diary.observations')}</p>
                                      <p>{registro.observacoes}</p>
                                    </div>
                                  )}
                                  {registro.profissionais && registro.profissionais.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {registro.profissionais.map((prof, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{prof.quantidade}× {prof.funcao}</Badge>
                                      ))}
                                    </div>
                                  )}
                                  {registro.fotos && registro.fotos.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <Image className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{registro.fotos.length} {t('diary.photos').toLowerCase()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="graficos" className="mt-4">
              <GraficosComparativos registros={registros} obraNome={obraNome} />
            </TabsContent>
          </Tabs>

          <Button onClick={exportarPDF} className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <><span className="animate-spin mr-2">⏳</span>{t('dialogs.generatingPdf')}</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />{t('dialogs.exportPdf')}</>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      <CompartilharPDFDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        pdfDoc={generatedPDF}
        filename={pdfFilename}
        titulo={`${t('dialogs.monthlyReport')} - ${obraNome}`}
      />

      <Sheet open={!!selectedRegistro} onOpenChange={() => setSelectedRegistro(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedRegistro && climaIcons[selectedRegistro.clima]}
              {selectedRegistro && format(parseDateOnlyAsLocal(selectedRegistro.data), "EEEE, dd MMMM", { locale })}
            </SheetTitle>
            <SheetDescription>{t('dialogs.fullDiaryRecord')}</SheetDescription>
          </SheetHeader>
          
          {selectedRegistro && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('dialogs.climate')}</h4>
                <Badge variant="outline" className="gap-1">
                  {climaIcons[selectedRegistro.clima]}
                  {climaLabels[selectedRegistro.clima]}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('diary.activities')}</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedRegistro.atividades_realizadas}</p>
              </div>

              {selectedRegistro.profissionais && selectedRegistro.profissionais.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {t('diary.professionals')} ({selectedRegistro.profissionais.reduce((sum, p) => sum + p.quantidade, 0)})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegistro.profissionais.map((prof, index) => (
                      <Badge key={index} variant="secondary">{prof.quantidade}× {prof.funcao}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRegistro.observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('diary.observations')}</h4>
                  <p className="text-sm">{selectedRegistro.observacoes}</p>
                </div>
              )}

              {selectedRegistro.fotos && selectedRegistro.fotos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {t('diary.photos')} ({selectedRegistro.fotos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRegistro.fotos.map((foto, index) => (
                      <div key={index} className="space-y-1">
                        <img src={foto.url} alt={foto.legenda || `${t('diary.photo')} ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        {foto.legenda && <p className="text-xs text-muted-foreground line-clamp-1">{foto.legenda}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

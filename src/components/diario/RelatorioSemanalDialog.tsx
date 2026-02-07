import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, Calendar, Users, Cloud, ChevronLeft, ChevronRight, Copy, Sun, CloudSun, 
  CloudRain, RotateCcw, ChevronDown, ChevronUp, Image, Download, Share2, Mail, MessageCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DiarioLog, ClimaTipo } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import {
  generateWeeklyReportPDF,
  downloadPDF,
  generateWeeklyShareText,
  shareContent,
  canShare,
  shareViaWhatsApp,
  shareViaEmail,
} from '@/lib/relatorioExport';

interface RelatorioSemanalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registros: DiarioLog[];
  obraNome: string;
}

const climaIcons: Record<ClimaTipo, React.ReactNode> = {
  ensolarado: <Sun className="w-4 h-4 text-primary" />,
  parcialmente_nublado: <CloudSun className="w-4 h-4 text-primary" />,
  nublado: <Cloud className="w-4 h-4 text-muted-foreground" />,
  chuvoso: <CloudRain className="w-4 h-4 text-primary" />,
};

const climaLabels: Record<ClimaTipo, string> = {
  ensolarado: 'Ensolarado',
  parcialmente_nublado: 'Parcialmente nublado',
  nublado: 'Nublado',
  chuvoso: 'Chuvoso',
};

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function RelatorioSemanalDialog({ 
  open, 
  onOpenChange, 
  registros, 
  obraNome 
}: RelatorioSemanalDialogProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [selectedRegistro, setSelectedRegistro] = useState<DiarioLog | null>(null);
  const { toast } = useToast();

  // Calcular intervalo da semana
  const semanaAtual = useMemo(() => {
    const baseDate = subWeeks(new Date(), weekOffset);
    const inicio = startOfWeek(baseDate, { weekStartsOn: 1 }); // Segunda
    const fim = endOfWeek(baseDate, { weekStartsOn: 1 }); // Domingo
    return { inicio, fim };
  }, [weekOffset]);

  // Filtrar registros da semana
  const registrosSemana = useMemo(() => {
    return registros.filter(r => {
      const dataRegistro = parseDateOnlyAsLocal(r.data);
      return dataRegistro >= semanaAtual.inicio && dataRegistro <= semanaAtual.fim;
    });
  }, [registros, semanaAtual]);

  // Dias da semana com registro
  const diasSemana = useMemo(() => {
    const dias = eachDayOfInterval({ start: semanaAtual.inicio, end: semanaAtual.fim });
    return dias.map(dia => {
      const registro = registrosSemana.find(r => 
        isSameDay(parseDateOnlyAsLocal(r.data), dia)
      );
      return { dia, registro };
    });
  }, [semanaAtual, registrosSemana]);

  // Estatísticas da semana
  const estatisticas = useMemo(() => {
    const totalProfissionais: Record<string, number> = {};
    let totalDias = 0;
    const climaContagem: Record<ClimaTipo, number> = {
      ensolarado: 0,
      parcialmente_nublado: 0,
      nublado: 0,
      chuvoso: 0,
    };

    registrosSemana.forEach(registro => {
      totalDias++;
      climaContagem[registro.clima]++;
      
      registro.profissionais?.forEach(prof => {
        totalProfissionais[prof.funcao] = 
          (totalProfissionais[prof.funcao] || 0) + prof.quantidade;
      });
    });

    return {
      diasTrabalhados: totalDias,
      diasSemRegistro: 7 - totalDias,
      profissionais: totalProfissionais,
      clima: climaContagem,
      totalProfissionais: Object.values(totalProfissionais).reduce((a, b) => a + b, 0),
    };
  }, [registrosSemana]);

  // Toggle expanded day
  const toggleDay = (diaKey: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(diaKey)) {
        next.delete(diaKey);
      } else {
        next.add(diaKey);
      }
      return next;
    });
  };

  // Gerar dados do relatório para export
  const getReportData = () => ({
    obraNome,
    periodo: semanaAtual,
    estatisticas,
    registros: registrosSemana,
  });

  // Export PDF
  const exportarPDF = () => {
    const data = getReportData();
    const doc = generateWeeklyReportPDF(data);
    const filename = `relatorio-semanal-${format(semanaAtual.inicio, 'dd-MM')}-a-${format(semanaAtual.fim, 'dd-MM-yyyy')}.pdf`;
    downloadPDF(doc, filename);
    toast({
      title: "PDF gerado!",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  // Share report
  const compartilharRelatorio = async () => {
    const data = getReportData();
    const texto = generateWeeklyShareText(data);
    
    if (canShare()) {
      const shared = await shareContent(
        `Relatório Semanal - ${obraNome}`,
        texto
      );
      if (shared) {
        toast({
          title: "Compartilhado!",
          description: "Relatório compartilhado com sucesso.",
        });
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(texto);
      toast({
        title: "Relatório copiado!",
        description: "Use Ctrl+V para colar e compartilhar.",
      });
    }
  };

  // Share via WhatsApp
  const compartilharWhatsApp = () => {
    const data = getReportData();
    const texto = generateWeeklyShareText(data);
    shareViaWhatsApp(texto);
  };

  // Share via Email
  const compartilharEmail = () => {
    const data = getReportData();
    const texto = generateWeeklyShareText(data);
    const subject = `Relatório Semanal - ${obraNome} - ${format(semanaAtual.inicio, 'dd/MM')} a ${format(semanaAtual.fim, 'dd/MM/yyyy')}`;
    shareViaEmail(subject, texto);
  };

  // Copy report
  const copiarRelatorio = async () => {
    const data = getReportData();
    const texto = generateWeeklyShareText(data);
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Relatório copiado!",
      description: "O relatório foi copiado para a área de transferência.",
    });
  };

  const voltarParaHoje = () => {
    setWeekOffset(0);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="w-6 h-6 text-primary" />
              Relatório Semanal
            </DialogTitle>
            <DialogDescription>
              Resumo consolidado das atividades da semana
            </DialogDescription>
          </DialogHeader>

          {/* Navegação de semana */}
          <div className="flex items-center justify-between py-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(w => w + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center flex flex-col items-center gap-1">
              <p className="font-semibold">
                {format(semanaAtual.inicio, "dd/MM")} - {format(semanaAtual.fim, "dd/MM/yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {weekOffset === 0 ? 'Esta semana' : 
                 weekOffset === 1 ? 'Semana passada' : 
                 `${weekOffset} semanas atrás`}
              </p>
              {weekOffset > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={voltarParaHoje}
                  className="text-xs h-6 px-2 gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Voltar para hoje
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(w => w - 1)}
              disabled={weekOffset === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {estatisticas.diasTrabalhados}
                </div>
                <p className="text-sm text-muted-foreground">Dias trabalhados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">
                  {estatisticas.totalProfissionais}
                </div>
                <p className="text-sm text-muted-foreground">Presenças</p>
              </CardContent>
            </Card>
          </div>

          {/* Profissionais da semana */}
          {Object.keys(estatisticas.profissionais).length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Efetivo da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(estatisticas.profissionais).map(([funcao, qtd]) => (
                    <Badge key={funcao} variant="secondary">
                      {qtd}× {funcao}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clima da semana */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Clima da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {Object.entries(estatisticas.clima)
                  .filter(([, count]) => count > 0)
                  .map(([clima, count]) => (
                    <Badge key={clima} variant="outline" className="gap-1">
                      {climaIcons[clima as ClimaTipo]}
                      {count} dia(s)
                    </Badge>
                  ))}
                {Object.values(estatisticas.clima).every(c => c === 0) && (
                  <span className="text-sm text-muted-foreground">Sem registros nesta semana</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Atividades diárias expandíveis */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Atividades Diárias
            </h4>
            <div className="space-y-2">
              {diasSemana.map(({ dia, registro }) => {
                const diaKey = dia.toISOString();
                const isExpanded = expandedDays.has(diaKey);
                const diaFormatado = format(dia, "EEEE, dd/MM", { locale: ptBR });
                
                return (
                  <Collapsible 
                    key={diaKey} 
                    open={isExpanded && !!registro}
                    onOpenChange={() => registro && toggleDay(diaKey)}
                  >
                    <Card className={`transition-colors ${registro ? 'cursor-pointer hover:bg-accent/50' : 'opacity-60'}`}>
                      <CollapsibleTrigger asChild disabled={!registro}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-medium ${
                              registro 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <span>{format(dia, "EEE", { locale: ptBR })}</span>
                              <span className="text-lg font-bold leading-none">{format(dia, "dd")}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize">{diaFormatado}</p>
                              {registro ? (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {registro.atividades_realizadas}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">Sem registro</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {registro && climaIcons[registro.clima]}
                            {registro && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRegistro(registro);
                                }}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            )}
                            {registro && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        {registro && (
                          <div className="px-3 pb-3 pt-0">
                            <Separator className="mb-3" />
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Atividades:</p>
                                <p className="whitespace-pre-wrap">{registro.atividades_realizadas}</p>
                              </div>
                              {registro.observacoes && (
                                <div>
                                  <p className="font-medium text-xs text-muted-foreground mb-1">Observações:</p>
                                  <p>{registro.observacoes}</p>
                                </div>
                              )}
                              {registro.profissionais && registro.profissionais.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {registro.profissionais.map((prof, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {prof.quantidade}× {prof.funcao}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {registro.fotos && registro.fotos.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Image className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{registro.fotos.length} foto(s)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button onClick={exportarPDF} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canShare() && (
                  <>
                    <DropdownMenuItem onClick={compartilharRelatorio}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={compartilharWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={compartilharEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copiarRelatorio}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar texto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet para detalhes completos do dia */}
      <Sheet open={!!selectedRegistro} onOpenChange={() => setSelectedRegistro(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedRegistro && climaIcons[selectedRegistro.clima]}
              {selectedRegistro && format(parseDateOnlyAsLocal(selectedRegistro.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </SheetTitle>
            <SheetDescription>
              Registro completo do diário de obra
            </SheetDescription>
          </SheetHeader>
          
          {selectedRegistro && (
            <div className="space-y-6 mt-6">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Clima</h4>
                <Badge variant="outline" className="gap-1">
                  {climaIcons[selectedRegistro.clima]}
                  {climaLabels[selectedRegistro.clima]}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Atividades Realizadas</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedRegistro.atividades_realizadas}</p>
              </div>

              {selectedRegistro.profissionais && selectedRegistro.profissionais.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Profissionais ({selectedRegistro.profissionais.reduce((sum, p) => sum + p.quantidade, 0)})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegistro.profissionais.map((prof, index) => (
                      <Badge key={index} variant="secondary">
                        {prof.quantidade}× {prof.funcao}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedRegistro.observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Observações</h4>
                  <p className="text-sm">{selectedRegistro.observacoes}</p>
                </div>
              )}

              {selectedRegistro.fotos && selectedRegistro.fotos.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Fotos ({selectedRegistro.fotos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRegistro.fotos.map((foto, index) => (
                      <img
                        key={index}
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
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

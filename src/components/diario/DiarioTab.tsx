import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Sun, Cloud, CloudRain, CloudSun, Calendar, Save, Loader2, ChevronDown, Image as ImageIcon, Pencil, Settings, History, ArrowUpDown, Users, FileText, Share2, Building2, Crown, AlertTriangle, Wrench, PackagePlus, PackageMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useDiario } from '@/hooks/useDiario';
import { useCronogramaItens, useFases } from '@/hooks/useCronograma';
import { useMateriais } from '@/hooks/useMateriais';
import { useMovimentacaoEstoque } from '@/hooks/useMovimentacaoEstoque';
import { useObraPin } from '@/hooks/useObraPin';
import { useDiarioAlteracoes } from '@/hooks/useDiarioAlteracoes';
import { useUserSettings } from '@/hooks/useUserSettings';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useToast } from '@/hooks/use-toast';
import { ClimaTipo, DiarioLog, Profissional, FotoComLegenda, Equipamento } from '@/types/database';
import { FotoUpload } from './FotoUpload';
import { PinDialog } from './PinDialog';
import { EditarDiarioDialog } from './EditarDiarioDialog';
import { ProfissionaisInput } from './ProfissionaisInput';
import { EquipamentosInput } from './EquipamentosInput';
import { RelatorioSemanalDialog } from './RelatorioSemanalDialog';
import { RelatorioMensalDialog } from './RelatorioMensalDialog';
import { ConfiguracaoEmpresaDialog } from './ConfiguracaoEmpresaDialog';
import { SelecionarFotosDialog } from './SelecionarFotosDialog';
import { generateDailyReportPDF } from '@/lib/relatorioExport';
import { CompartilharPDFDialog } from './CompartilharPDFDialog';
import jsPDF from 'jspdf';

interface DiarioTabProps {
  obraId: string;
  onUpgradeClick?: () => void;
}

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function DiarioTab({ obraId, onUpgradeClick }: DiarioTabProps) {
  const { registros, isLoading, createDiario, updateDiario } = useDiario(obraId);
  const { itens: cronogramaItens } = useCronogramaItens(obraId);
  const { data: fases } = useFases();
  const { materiais } = useMateriais(obraId);
  const { movimentacoes, createMovimentacao } = useMovimentacaoEstoque(obraId);
  const { hasPin, validatePin, createPin, updatePin } = useObraPin(obraId);
  const { registrarAlteracao } = useDiarioAlteracoes();
  const { settings } = useUserSettings();
  const { canCreateDiario, getDiarioCount, limits } = usePlanLimits();
  const { toast } = useToast();
  const { t } = useTranslation();

  const canCreate = canCreateDiario(obraId);
  const diarioCount = getDiarioCount(obraId);

  const climaOptions: { value: ClimaTipo; label: string; icon: React.ReactNode }[] = [
    { value: 'ensolarado', label: t('diary.sunny'), icon: <Sun className="w-6 h-6" /> },
    { value: 'parcialmente_nublado', label: t('diary.partlyCloudy'), icon: <CloudSun className="w-6 h-6" /> },
    { value: 'nublado', label: t('diary.cloudy'), icon: <Cloud className="w-6 h-6" /> },
    { value: 'chuvoso', label: t('diary.rainy'), icon: <CloudRain className="w-6 h-6" /> },
  ];

  const [clima, setClima] = useState<ClimaTipo>('ensolarado');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<FotoComLegenda[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [saving, setSaving] = useState(false);
  const [relatorioSemanalOpen, setRelatorioSemanalOpen] = useState(false);
  const [relatorioMensalOpen, setRelatorioMensalOpen] = useState(false);
  const [empresaConfigOpen, setEmpresaConfigOpen] = useState(false);
  const [selecionarFotosOpen, setSelecionarFotosOpen] = useState(false);
  const [registroParaExportar, setRegistroParaExportar] = useState<DiarioLog | null>(null);
  
  const [compartilharPDFOpen, setCompartilharPDFOpen] = useState(false);
  const [diarioPDF, setDiarioPDF] = useState<jsPDF | null>(null);
  const [diarioPDFFilename, setDiarioPDFFilename] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<'validate' | 'create' | 'change'>('validate');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<DiarioLog | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Gerar resumo automático das atividades do dia anterior
  useEffect(() => {
    if (atividades) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    const itensConcluidos = cronogramaItens.filter(
      item => item.status === 'concluido' && (item.data_conclusao === today || item.data_conclusao === yesterday)
    );

    const movsRecentes = movimentacoes.filter(
      m => m.data === yesterday || m.data === today
    );

    const linhas: string[] = [];

    if (itensConcluidos.length > 0) {
      linhas.push(t('diary.completedActivities'));
      itensConcluidos.forEach(item => {
        const fase = fases?.find(f => f.id === item.fase_id);
        linhas.push(`• ${item.descricao}${fase ? ` (${fase.nome})` : ''}`);
      });
    }

    const movsEntrada = movimentacoes.filter(
      m => (m.data === yesterday || m.data === today) && m.tipo === 'entrada'
    );
    const movsSaida = movimentacoes.filter(
      m => (m.data === yesterday || m.data === today) && m.tipo === 'saida'
    );

    if (movsEntrada.length > 0) {
      if (linhas.length > 0) linhas.push('');
      linhas.push(`📦 ${t('diary.materialsReceived', 'Materiais Recebidos')}:`);
      movsEntrada.forEach(mov => {
        const material = materiais.find(m => m.id === mov.material_id);
        if (material) {
          linhas.push(`  ➕ ${material.nome}: ${mov.quantidade} ${material.unidade}`);
        }
      });
    }

    if (movsSaida.length > 0) {
      if (linhas.length > 0) linhas.push('');
      linhas.push(`🔧 ${t('diary.materialsUsed', 'Materiais Utilizados')}:`);
      movsSaida.forEach(mov => {
        const material = materiais.find(m => m.id === mov.material_id);
        if (material) {
          linhas.push(`  ➖ ${material.nome}: ${mov.quantidade} ${material.unidade}`);
        }
      });
    }

    if (linhas.length > 0) {
      setAtividades(linhas.join('\n'));
    }
  }, [cronogramaItens, movimentacoes, materiais, fases]);

  const handleSave = async () => {
    if (!atividades.trim()) {
      toast({
        title: t('diary.requiredField'),
        description: t('diary.describeActivities'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await createDiario.mutateAsync({
        obra_id: obraId,
        clima,
        atividades_realizadas: atividades.trim(),
        observacoes: observacoes.trim() || undefined,
        fotos: fotos,
        profissionais: profissionais,
        equipamentos: equipamentos,
      });

      toast({
        title: t('diary.reportSaved'),
        description: t('diary.diaryOfDate', { date: new Date().toLocaleDateString() }),
      });

      setAtividades('');
      setObservacoes('');
      setFotos([]);
      setProfissionais([]);
      setEquipamentos([]);
      setClima('ensolarado');
    } catch (error) {
      toast({
        title: t('diary.errorSaving'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (registro: DiarioLog) => {
    setSelectedRegistro(registro);
    
    if (!hasPin) {
      setPinDialogMode('create');
      setPendingAction(() => () => {
        setEditDialogOpen(true);
      });
      setPinDialogOpen(true);
    } else {
      setPinDialogMode('validate');
      setPendingAction(() => () => {
        setEditDialogOpen(true);
      });
      setPinDialogOpen(true);
    }
  };

  const handlePinValidated = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCreateOrUpdatePin = async (pin: string) => {
    if (hasPin) {
      await updatePin.mutateAsync(pin);
    } else {
      await createPin.mutateAsync(pin);
    }
    toast({
      title: t('diary.pinConfigured'),
      description: t('diary.pinSavedSuccess'),
    });
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSaveEdit = async (
    updates: {
      data?: string;
      clima?: ClimaTipo;
      atividades_realizadas?: string;
      observacoes?: string;
      profissionais?: Profissional[];
      equipamentos?: Equipamento[];
    },
    motivo?: string
  ) => {
    if (!selectedRegistro) return;

    try {
      for (const [campo, valorNovo] of Object.entries(updates)) {
        if (campo === 'profissionais' || campo === 'equipamentos') {
          const valorAnterior = JSON.stringify((selectedRegistro as any)[campo] || []);
          const valorNovoStr = JSON.stringify(valorNovo || []);
          if (valorAnterior !== valorNovoStr) {
            await registrarAlteracao.mutateAsync({
              diario_id: selectedRegistro.id,
              campo_alterado: campo,
              valor_anterior: valorAnterior,
              valor_novo: valorNovoStr,
              motivo,
            });
          }
        } else {
          const valorAnterior = selectedRegistro[campo as keyof DiarioLog]?.toString();
          await registrarAlteracao.mutateAsync({
            diario_id: selectedRegistro.id,
            campo_alterado: campo,
            valor_anterior: valorAnterior,
            valor_novo: valorNovo?.toString(),
            motivo,
          });
        }
      }

      await updateDiario.mutateAsync({
        id: selectedRegistro.id,
        ...updates,
      });

      toast({
        title: t('diary.recordUpdated'),
        description: t('diary.changesSavedToLog'),
      });
    } catch (error) {
      toast({
        title: t('diary.errorUpdating'),
        description: t('diary.couldNotSaveChanges'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleConfigurePin = () => {
    setPinDialogMode(hasPin ? 'change' : 'create');
    setPendingAction(null);
    setPinDialogOpen(true);
  };

  const getClimaIcon = (climaValue: ClimaTipo) => {
    const option = climaOptions.find(c => c.value === climaValue);
    return option?.icon;
  };

  const getClimaLabel = (climaValue: ClimaTipo) => {
    const option = climaOptions.find(c => c.value === climaValue);
    return option?.label;
  };

  const handleExportarPDFClick = (registro: DiarioLog) => {
    setRegistroParaExportar(registro);
    setSelecionarFotosOpen(true);
  };

  const exportarDiarioPDF = async (registro: DiarioLog, fotosSelecionadas: FotoComLegenda[]) => {
    setIsGeneratingPDF(true);
    
    try {
      const pdfOptions = {
        logoUrl: settings?.empresa_logo_url,
        empresaNome: settings?.empresa_nome,
      };
      const registroComFotos = {
        ...registro,
        fotos: fotosSelecionadas,
      };
      const doc = await generateDailyReportPDF(registroComFotos, 'Obra', pdfOptions);
      const filename = `diario-${format(parseDateOnlyAsLocal(registro.data), 'dd-MM-yyyy')}.pdf`;
      
      setDiarioPDF(doc);
      setDiarioPDFFilename(filename);
      setCompartilharPDFOpen(true);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: t('diary.errorGeneratingPDF'),
        description: t('diary.couldNotGeneratePDF'),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleFotosSelecionadas = (fotosSelecionadas: FotoComLegenda[]) => {
    if (registroParaExportar) {
      exportarDiarioPDF(registroParaExportar, fotosSelecionadas);
      setRegistroParaExportar(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com config de PIN e Relatório Semanal */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant={hasPin ? 'default' : 'secondary'} className="gap-1">
            <Settings className="w-3 h-3" />
            {hasPin ? t('diary.pinActive') : t('diary.noPin')}
          </Badge>
          {settings?.empresa_nome && (
            <Badge variant="outline" className="gap-1">
              <Building2 className="w-3 h-3" />
              {settings.empresa_nome}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRelatorioSemanalOpen(true)}
          >
            <FileText className="w-4 h-4 mr-1" />
            {t('diary.weekly')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRelatorioMensalOpen(true)}
          >
            <Calendar className="w-4 h-4 mr-1" />
            {t('diary.monthly')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                {t('diary.settings')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleConfigurePin}>
                <Settings className="w-4 h-4 mr-2" />
                {hasPin ? t('diary.changePin') : t('diary.configurePin')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEmpresaConfigOpen(true)}>
                <Building2 className="w-4 h-4 mr-2" />
                {t('diary.configureCompany')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Formulário do dia */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            {t('diary.todayRecord')} - {new Date().toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alerta de limite atingido */}
          {!canCreate && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">{t('diary.freeLimitReached')}</span>
                <span className="block text-sm mt-0.5">
                  {t('diary.diaryLimitDesc', { used: diarioCount, max: limits.maxDiariosPerObra })}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Contador de diários */}
          {limits.maxDiariosPerObra !== -1 && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('diary.diariesUsed')}</span>
              <Badge variant={canCreate ? "outline" : "destructive"}>
                {diarioCount}/{limits.maxDiariosPerObra}
              </Badge>
            </div>
          )}

          {/* Seletor de clima */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{t('diary.weather')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {climaOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={clima === option.value ? 'default' : 'outline'}
                  className={`h-14 flex items-center gap-2 justify-start ${
                    clima === option.value ? '' : 'text-muted-foreground'
                  }`}
                  onClick={() => setClima(option.value)}
                  disabled={!canCreate}
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Atividades */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="atividades" className="text-base font-medium">
                {t('diary.whatWasDone')}
              </Label>
              {atividades && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <ArrowUpDown className="w-3 h-3" />
                  {t('diary.preFilled')}
                </Badge>
              )}
            </div>
            <Textarea
              id="atividades"
              placeholder={t('diary.activitiesPlaceholder')}
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              className="min-h-28 text-base"
              disabled={!canCreate}
            />
            <p className="text-xs text-muted-foreground">
              {t('diary.autoFillHint')}
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-base font-medium">
              {t('diary.observationsOptional')}
            </Label>
            <Textarea
              id="observacoes"
              placeholder={t('diary.observationsPlaceholder')}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-20 text-base"
              disabled={!canCreate}
            />
          </div>

          {/* Profissionais na obra */}
          <ProfissionaisInput
            value={profissionais}
            onChange={setProfissionais}
            disabled={saving || !canCreate}
          />

          {/* Máquinas e Equipamentos */}
          <EquipamentosInput
            value={equipamentos}
            onChange={setEquipamentos}
            disabled={saving || !canCreate}
          />

          {/* Upload de fotos */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{t('diary.sitePhotos')}</Label>
            <FotoUpload
              fotos={fotos}
              onFotosChange={setFotos}
              obraId={obraId}
              disabled={saving || !canCreate}
            />
          </div>

          {/* Botão salvar ou upgrade */}
          {canCreate ? (
            <Button
              onClick={handleSave}
              className="w-full h-14 text-lg font-semibold"
              disabled={saving || !atividades.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t('diary.saveReport')}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onUpgradeClick}
              className="w-full h-14 text-lg font-semibold"
            >
              <Crown className="w-5 h-5 mr-2" />
              {t('diary.upgradeToContine')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      {registros.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            {t('diary.history')}
          </h3>
          {registros.map((registro) => (
            <Collapsible key={registro.id}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-primary">
                          {getClimaIcon(registro.clima)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {parseDateOnlyAsLocal(registro.data).toLocaleDateString(undefined, {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getClimaLabel(registro.clima)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportarPDFClick(registro);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(registro);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{t('diary.activities')}</p>
                      <p className="whitespace-pre-wrap">{registro.atividades_realizadas}</p>
                    </div>
                    {registro.profissionais && registro.profissionais.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {t('diary.professionals')} ({registro.profissionais.reduce((sum, p) => sum + p.quantidade, 0)})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {registro.profissionais.map((prof, index) => (
                            <Badge key={index} variant="secondary">
                              {prof.quantidade} {prof.funcao}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {registro.equipamentos && registro.equipamentos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Wrench className="w-4 h-4" />
                          {t('diary.equipment', 'Equipamentos')} ({registro.equipamentos.reduce((sum, e) => sum + e.quantidade, 0)})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {registro.equipamentos.map((equip, index) => (
                            <Badge key={index} variant="outline" className="border-primary/30">
                              {equip.quantidade} {equip.nome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {registro.observacoes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{t('diary.observations')}</p>
                        <p className="whitespace-pre-wrap">{registro.observacoes}</p>
                      </div>
                    )}
                    {registro.fotos && registro.fotos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          {t('diary.photos')} ({registro.fotos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {registro.fotos.map((foto, index) => (
                            <a
                              key={index}
                              href={foto.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={foto.url}
                                alt={foto.legenda || `${t('diary.photo')} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {foto.legenda && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                                  <p className="text-[10px] text-white line-clamp-1">{foto.legenda}</p>
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* PIN Dialog */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onValidPin={handlePinValidated}
        validatePin={validatePin}
        mode={pinDialogMode}
        onCreatePin={handleCreateOrUpdatePin}
      />

      {/* Edit Dialog */}
      {selectedRegistro && (
        <EditarDiarioDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          registro={selectedRegistro}
          onSave={handleSaveEdit}
          requiresMotivo={true}
        />
      )}

      {/* Relatório Semanal Dialog */}
      <RelatorioSemanalDialog
        open={relatorioSemanalOpen}
        onOpenChange={setRelatorioSemanalOpen}
        registros={registros}
        obraNome="Obra"
      />

      {/* Relatório Mensal Dialog */}
      <RelatorioMensalDialog
        open={relatorioMensalOpen}
        onOpenChange={setRelatorioMensalOpen}
        registros={registros}
        obraNome="Obra"
        pdfOptions={{
          logoUrl: settings?.empresa_logo_url,
          empresaNome: settings?.empresa_nome,
        }}
      />

      {/* Configuração de Empresa Dialog */}
      <ConfiguracaoEmpresaDialog
        open={empresaConfigOpen}
        onOpenChange={setEmpresaConfigOpen}
      />

      {/* Selecionar Fotos para PDF Dialog */}
      {registroParaExportar && (
        <SelecionarFotosDialog
          open={selecionarFotosOpen}
          onOpenChange={(open) => {
            if (!isGeneratingPDF) {
              setSelecionarFotosOpen(open);
              if (!open) setRegistroParaExportar(null);
            }
          }}
          fotos={registroParaExportar.fotos || []}
          onConfirm={handleFotosSelecionadas}
          isLoading={isGeneratingPDF}
        />
      )}

      {/* Compartilhar PDF do Diário Individual */}
      <CompartilharPDFDialog
        open={compartilharPDFOpen}
        onOpenChange={setCompartilharPDFOpen}
        pdfDoc={diarioPDF}
        filename={diarioPDFFilename}
        titulo={t('diary.diaryReport')}
      />
    </div>
  );
}

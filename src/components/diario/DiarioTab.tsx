import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sun, Cloud, CloudRain, CloudSun, Calendar, Save, Loader2, ChevronDown, Image as ImageIcon, Pencil, Settings, History, ArrowUpDown, Users, FileText, Download, Share2, Mail, MessageCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { ClimaTipo, DiarioLog, Profissional } from '@/types/database';
import { FotoUpload } from './FotoUpload';
import { PinDialog } from './PinDialog';
import { EditarDiarioDialog } from './EditarDiarioDialog';
import { ProfissionaisInput } from './ProfissionaisInput';
import { RelatorioSemanalDialog } from './RelatorioSemanalDialog';
import { RelatorioMensalDialog } from './RelatorioMensalDialog';
import {
  generateDailyReportPDF,
  downloadPDF,
  generateDailyShareText,
  shareContent,
  canShare,
  shareViaWhatsApp,
  shareViaEmail,
} from '@/lib/relatorioExport';

interface DiarioTabProps {
  obraId: string;
}

const climaOptions: { value: ClimaTipo; label: string; icon: React.ReactNode }[] = [
  { value: 'ensolarado', label: 'Ensolarado', icon: <Sun className="w-6 h-6" /> },
  { value: 'parcialmente_nublado', label: 'Parcialmente nublado', icon: <CloudSun className="w-6 h-6" /> },
  { value: 'nublado', label: 'Nublado', icon: <Cloud className="w-6 h-6" /> },
  { value: 'chuvoso', label: 'Chuvoso', icon: <CloudRain className="w-6 h-6" /> },
];

function parseDateOnlyAsLocal(dateStr: string) {
  const safe = dateStr?.split('T')[0] ?? '';
  const [y, m, d] = safe.split('-').map((v) => Number(v));
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d);
}

export function DiarioTab({ obraId }: DiarioTabProps) {
  const { registros, isLoading, createDiario, updateDiario } = useDiario(obraId);
  const { itens: cronogramaItens } = useCronogramaItens(obraId);
  const { data: fases } = useFases();
  const { materiais } = useMateriais(obraId);
  const { movimentacoes, createMovimentacao } = useMovimentacaoEstoque(obraId);
  const { hasPin, validatePin, createPin, updatePin } = useObraPin(obraId);
  const { registrarAlteracao } = useDiarioAlteracoes();
  const { toast } = useToast();

  const [clima, setClima] = useState<ClimaTipo>('ensolarado');
  const [atividades, setAtividades] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [saving, setSaving] = useState(false);
  const [relatorioSemanalOpen, setRelatorioSemanalOpen] = useState(false);
  const [relatorioMensalOpen, setRelatorioMensalOpen] = useState(false);

  // Estado para diálogos
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<'validate' | 'create' | 'change'>('validate');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<DiarioLog | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Gerar resumo automático das atividades do dia anterior
  useEffect(() => {
    if (atividades) return; // Não sobrescrever se já tem conteúdo

    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');

    // Itens do cronograma concluídos ontem
    const itensConcluidos = cronogramaItens.filter(
      item => item.status === 'concluido' && item.data_conclusao === yesterday
    );

    // Movimentações de estoque de ontem ou hoje
    const movsRecentes = movimentacoes.filter(
      m => m.data === yesterday || m.data === today
    );

    const linhas: string[] = [];

    // Adicionar itens concluídos
    if (itensConcluidos.length > 0) {
      linhas.push('📋 ATIVIDADES CONCLUÍDAS:');
      itensConcluidos.forEach(item => {
        const fase = fases?.find(f => f.id === item.fase_id);
        linhas.push(`• ${item.descricao}${fase ? ` (${fase.nome})` : ''}`);
      });
    }

    // Adicionar movimentações de estoque
    if (movsRecentes.length > 0) {
      if (linhas.length > 0) linhas.push('');
      linhas.push('📦 MOVIMENTAÇÃO DE MATERIAIS:');
      movsRecentes.forEach(mov => {
        const material = materiais.find(m => m.id === mov.material_id);
        if (material) {
          const emoji = mov.tipo === 'entrada' ? '➕' : '➖';
          linhas.push(`${emoji} ${material.nome}: ${mov.quantidade} ${material.unidade} (${mov.tipo})`);
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
        title: 'Campo obrigatório',
        description: 'Descreva as atividades realizadas hoje.',
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
      });

      toast({
        title: 'Relatório salvo!',
        description: `Diário de ${new Date().toLocaleDateString('pt-BR')} registrado.`,
      });

      setAtividades('');
      setObservacoes('');
      setFotos([]);
      setProfissionais([]);
      setClima('ensolarado');
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (registro: DiarioLog) => {
    setSelectedRegistro(registro);
    
    if (!hasPin) {
      // Se não tem PIN configurado, pedir para criar
      setPinDialogMode('create');
      setPendingAction(() => () => {
        setEditDialogOpen(true);
      });
      setPinDialogOpen(true);
    } else {
      // Validar PIN antes de editar
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
      title: 'PIN configurado!',
      description: 'PIN de segurança salvo com sucesso.',
    });
    // Executar ação pendente após criar PIN
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
    },
    motivo?: string
  ) => {
    if (!selectedRegistro) return;

    try {
      // Registrar alterações no log
      for (const [campo, valorNovo] of Object.entries(updates)) {
        const valorAnterior = selectedRegistro[campo as keyof DiarioLog]?.toString();
        await registrarAlteracao.mutateAsync({
          diario_id: selectedRegistro.id,
          campo_alterado: campo,
          valor_anterior: valorAnterior,
          valor_novo: valorNovo?.toString(),
          motivo,
        });
      }

      // Atualizar o registro
      await updateDiario.mutateAsync({
        id: selectedRegistro.id,
        ...updates,
      });

      toast({
        title: 'Registro atualizado',
        description: 'As alterações foram salvas e registradas no log.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações.',
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

  // Export and share functions for daily reports
  const exportarDiarioPDF = async (registro: DiarioLog) => {
    const doc = await generateDailyReportPDF(registro, 'Obra');
    const filename = `diario-${format(parseDateOnlyAsLocal(registro.data), 'dd-MM-yyyy')}.pdf`;
    downloadPDF(doc, filename);
    toast({
      title: "PDF gerado!",
      description: "O diário foi baixado com sucesso.",
    });
  };

  const compartilharDiario = async (registro: DiarioLog) => {
    const texto = generateDailyShareText(registro, 'Obra');
    
    if (canShare()) {
      const shared = await shareContent(
        `Diário de Obra - ${format(parseDateOnlyAsLocal(registro.data), 'dd/MM/yyyy')}`,
        texto
      );
      if (shared) {
        toast({
          title: "Compartilhado!",
          description: "Diário compartilhado com sucesso.",
        });
      }
    } else {
      await navigator.clipboard.writeText(texto);
      toast({
        title: "Diário copiado!",
        description: "Use Ctrl+V para colar e compartilhar.",
      });
    }
  };

  const compartilharDiarioWhatsApp = (registro: DiarioLog) => {
    const texto = generateDailyShareText(registro, 'Obra');
    shareViaWhatsApp(texto);
  };

  const compartilharDiarioEmail = (registro: DiarioLog) => {
    const texto = generateDailyShareText(registro, 'Obra');
    const subject = `Diário de Obra - ${format(parseDateOnlyAsLocal(registro.data), 'dd/MM/yyyy')}`;
    shareViaEmail(subject, texto);
  };

  const copiarDiario = async (registro: DiarioLog) => {
    const texto = generateDailyShareText(registro, 'Obra');
    await navigator.clipboard.writeText(texto);
    toast({
      title: "Diário copiado!",
      description: "O diário foi copiado para a área de transferência.",
    });
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={hasPin ? 'default' : 'secondary'} className="gap-1">
            <Settings className="w-3 h-3" />
            {hasPin ? 'PIN Ativo' : 'Sem PIN'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRelatorioSemanalOpen(true)}
          >
            <FileText className="w-4 h-4 mr-1" />
            Semanal
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRelatorioMensalOpen(true)}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Mensal
          </Button>
          <Button variant="ghost" size="sm" onClick={handleConfigurePin}>
            <Settings className="w-4 h-4 mr-1" />
            {hasPin ? 'Alterar PIN' : 'Configurar PIN'}
          </Button>
        </div>
      </div>

      {/* Formulário do dia */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Registro de Hoje - {new Date().toLocaleDateString('pt-BR')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de clima */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Clima</Label>
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
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Atividades - com pré-preenchimento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="atividades" className="text-base font-medium">
                O que foi feito hoje?
              </Label>
              {atividades && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <ArrowUpDown className="w-3 h-3" />
                  Pré-preenchido
                </Badge>
              )}
            </div>
            <Textarea
              id="atividades"
              placeholder="Descreva as atividades realizadas..."
              value={atividades}
              onChange={(e) => setAtividades(e.target.value)}
              className="min-h-28 text-base"
            />
            <p className="text-xs text-muted-foreground">
              💡 Atividades do cronograma e movimentações de estoque são preenchidas automaticamente.
            </p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-base font-medium">
              Observações (opcional)
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Problemas, pendências, materiais utilizados..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="min-h-20 text-base"
            />
          </div>

          {/* Profissionais na obra */}
          <ProfissionaisInput
            value={profissionais}
            onChange={setProfissionais}
            disabled={saving}
          />

          {/* Upload de fotos */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Fotos da Obra</Label>
            <FotoUpload
              fotos={fotos}
              onFotosChange={setFotos}
              obraId={obraId}
              disabled={saving}
            />
          </div>

          {/* Botão salvar */}
          <Button
            onClick={handleSave}
            className="w-full h-14 text-lg font-semibold"
            disabled={saving || !atividades.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      {registros.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico
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
                            {parseDateOnlyAsLocal(registro.data).toLocaleDateString('pt-BR', {
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
                        {/* Export/Share dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => exportarDiarioPDF(registro)}>
                              <Download className="w-4 h-4 mr-2" />
                              Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canShare() && (
                              <>
                                <DropdownMenuItem onClick={() => compartilharDiario(registro)}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Compartilhar...
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => compartilharDiarioWhatsApp(registro)}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => compartilharDiarioEmail(registro)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copiarDiario(registro)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar texto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <p className="text-sm font-medium text-muted-foreground mb-1">Atividades:</p>
                      <p className="whitespace-pre-wrap">{registro.atividades_realizadas}</p>
                    </div>
                    {registro.profissionais && registro.profissionais.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Profissionais ({registro.profissionais.reduce((sum, p) => sum + p.quantidade, 0)})
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
                    {registro.observacoes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Observações:</p>
                        <p className="whitespace-pre-wrap">{registro.observacoes}</p>
                      </div>
                    )}
                    {registro.fotos && registro.fotos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          Fotos ({registro.fotos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {registro.fotos.map((foto, index) => (
                            <a
                              key={index}
                              href={foto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={foto}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
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
      />
    </div>
  );
}

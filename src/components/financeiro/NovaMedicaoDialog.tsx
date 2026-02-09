import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFases, useCronogramaItens } from '@/hooks/useCronograma';
import { useMedicoes, useAdiantamentos } from '@/hooks/useMedicoes';
import { useToast } from '@/hooks/use-toast';
import { Calculator, ArrowRight, Check } from 'lucide-react';

interface NovaMedicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  retencaoPercentual: number;
}

type Step = 'selecao' | 'calculo' | 'deducoes' | 'resultado';

export function NovaMedicaoDialog({ open, onOpenChange, obraId, retencaoPercentual }: NovaMedicaoDialogProps) {
  const { data: fases } = useFases();
  const { itens } = useCronogramaItens(obraId);
  const { medicoes, createMedicao } = useMedicoes(obraId);
  const { pendentes, marcarAbatidos } = useAdiantamentos(obraId);
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('selecao');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [percentualAtual, setPercentualAtual] = useState('');
  const [adiantamentosSelecionados, setAdiantamentosSelecionados] = useState<string[]>([]);
  const [dataMedicao, setDataMedicao] = useState(new Date().toISOString().split('T')[0]);

  // Items that have valor_contrato
  const itensComValor = useMemo(() => {
    return itens.filter(i => i.valor_contrato_mao_de_obra && i.valor_contrato_mao_de_obra > 0);
  }, [itens]);

  const selectedItem = itensComValor.find(i => i.id === selectedItemId);

  // Get last measurement for this item
  const ultimaMedicao = useMemo(() => {
    if (!selectedItemId) return null;
    return medicoes.find(m => m.cronograma_item_id === selectedItemId);
  }, [selectedItemId, medicoes]);

  const percentualAnterior = ultimaMedicao?.percentual_atual ?? 0;
  const valorContrato = selectedItem?.valor_contrato_mao_de_obra ?? 0;
  const percAtual = parseFloat(percentualAtual) || 0;
  const avancoPeriodo = Math.max(0, percAtual - percentualAnterior);
  const valorBruto = (avancoPeriodo / 100) * valorContrato;
  const valorRetencao = (retencaoPercentual / 100) * valorBruto;
  
  const totalAdiantamentos = useMemo(() => {
    return pendentes
      .filter(a => adiantamentosSelecionados.includes(a.id))
      .reduce((sum, a) => sum + Number(a.valor), 0);
  }, [pendentes, adiantamentosSelecionados]);

  const valorLiquido = valorBruto - valorRetencao - totalAdiantamentos;

  const getFaseName = (faseId: string) => fases?.find(f => f.id === faseId)?.nome ?? '';

  const handleReset = () => {
    setStep('selecao');
    setSelectedItemId('');
    setPercentualAtual('');
    setAdiantamentosSelecionados([]);
    setDataMedicao(new Date().toISOString().split('T')[0]);
  };

  const handleConfirm = async () => {
    try {
      const result = await createMedicao.mutateAsync({
        obra_id: obraId,
        cronograma_item_id: selectedItemId,
        fase_id: selectedItem?.fase_id,
        data_medicao: dataMedicao,
        percentual_anterior: percentualAnterior,
        percentual_atual: percAtual,
        valor_contrato_referencia: valorContrato,
        valor_bruto_medido: valorBruto,
        valor_retencao_tecnica: valorRetencao,
        retencao_percentual_aplicado: retencaoPercentual,
        valor_adiantamentos_descontados: totalAdiantamentos,
        valor_liquido_a_pagar: valorLiquido,
      });

      if (adiantamentosSelecionados.length > 0) {
        await marcarAbatidos.mutateAsync({
          ids: adiantamentosSelecionados,
          medicaoId: result.id,
        });
      }

      toast({ title: 'Medição registrada!', description: `Valor líquido: R$ ${valorLiquido.toFixed(2)}` });
      handleReset();
      onOpenChange(false);
    } catch {
      toast({ title: 'Erro ao registrar medição', variant: 'destructive' });
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const toggleAdiantamento = (id: string) => {
    setAdiantamentosSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleReset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Nova Medição
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1 text-xs">
          {(['selecao', 'calculo', 'deducoes', 'resultado'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              <Badge variant={step === s ? 'default' : 'secondary'} className="text-xs">
                {['Seleção', 'Cálculo', 'Deduções', 'Resultado'][i]}
              </Badge>
            </div>
          ))}
        </div>

        <Separator />

        {/* Step A: Selection */}
        {step === 'selecao' && (
          <div className="space-y-4">
            <div>
              <Label>Data da Medição</Label>
              <Input type="date" value={dataMedicao} onChange={e => setDataMedicao(e.target.value)} />
            </div>

            {itensComValor.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="font-medium">Nenhum item com valor de contrato definido.</p>
                <p className="text-sm mt-1">Defina o valor de mão de obra nos itens do cronograma primeiro.</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Tarefa / Item do Cronograma</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itensComValor.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {getFaseName(item.fase_id)} — {item.descricao} ({formatCurrency(item.valor_contrato_mao_de_obra!)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor do Contrato:</span>
                      <span className="font-semibold">{formatCurrency(valorContrato)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">% Acumulado Anterior:</span>
                      <span className="font-semibold">{percentualAnterior}%</span>
                    </div>
                  </div>
                )}

                {selectedItem && (
                  <div>
                    <Label>% Acumulado Atual</Label>
                    <Input
                      type="number"
                      min={percentualAnterior}
                      max={100}
                      step="0.1"
                      placeholder={`De ${percentualAnterior}% até 100%`}
                      value={percentualAtual}
                      onChange={e => setPercentualAtual(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            <Button
              className="w-full"
              disabled={!selectedItem || !percAtual || percAtual <= percentualAnterior}
              onClick={() => setStep('calculo')}
            >
              Calcular <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step B: Calculation */}
        {step === 'calculo' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Resumo da Medição</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Avanço no período:</span>
                <span className="text-right font-medium">{percentualAnterior}% → {percAtual}% (+{avancoPeriodo.toFixed(1)}%)</span>
                <span className="text-muted-foreground">Valor do contrato:</span>
                <span className="text-right font-medium">{formatCurrency(valorContrato)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Executado no Período:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(valorBruto)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('selecao')} className="flex-1">Voltar</Button>
              <Button onClick={() => setStep('deducoes')} className="flex-1">
                Deduções <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step C: Deductions */}
        {step === 'deducoes' && (
          <div className="space-y-4">
            {/* Retenção */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-sm">Retenção Técnica ({retencaoPercentual}%)</span>
                  <p className="text-xs text-muted-foreground">Liberada ao final da obra</p>
                </div>
                <Badge variant="outline" className="text-warning border-warning">
                  - {formatCurrency(valorRetencao)}
                </Badge>
              </div>
            </div>

            {/* Adiantamentos */}
            <div>
              <Label className="mb-2 block">Adiantamentos (Vales) Pendentes</Label>
              {pendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Nenhum adiantamento pendente.</p>
              ) : (
                <div className="space-y-2">
                  {pendentes.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                      <Checkbox
                        checked={adiantamentosSelecionados.includes(a.id)}
                        onCheckedChange={() => toggleAdiantamento(a.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.descricao || 'Adiantamento'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge variant="outline" className="text-destructive border-destructive">
                        - {formatCurrency(Number(a.valor))}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalAdiantamentos > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">Total Adiantamentos</span>
                  <Badge variant="outline" className="text-destructive border-destructive">
                    - {formatCurrency(totalAdiantamentos)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('calculo')} className="flex-1">Voltar</Button>
              <Button onClick={() => setStep('resultado')} className="flex-1">
                Ver Resultado <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step D: Result */}
        {step === 'resultado' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valor Bruto Medido</span>
                <span className="font-medium">{formatCurrency(valorBruto)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span>Retenção Técnica ({retencaoPercentual}%)</span>
                <span>- {formatCurrency(valorRetencao)}</span>
              </div>
              {totalAdiantamentos > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Adiantamentos Descontados</span>
                  <span>- {formatCurrency(totalAdiantamentos)}</span>
                </div>
              )}
              <Separator />
            </div>

            <div className="bg-success/10 border-2 border-success/40 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Valor Líquido a Pagar</p>
              <p className="text-3xl font-bold text-success">{formatCurrency(valorLiquido)}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('deducoes')} className="flex-1">Voltar</Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                disabled={createMedicao.isPending}
              >
                <Check className="w-4 h-4 mr-2" /> Confirmar Medição
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

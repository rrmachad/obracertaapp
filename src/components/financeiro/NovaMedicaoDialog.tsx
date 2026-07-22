import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useCurrency } from '@/hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import { Calculator, ArrowRight, Check, ClipboardList } from 'lucide-react';

interface NovaMedicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  retencaoPercentual: number;
}

type Step = 'selecao' | 'calculo' | 'deducoes' | 'resultado';

export function NovaMedicaoDialog({ open, onOpenChange, obraId, retencaoPercentual }: NovaMedicaoDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: fases } = useFases(obraId);
  const { itens } = useCronogramaItens(obraId);
  const { medicoes, createMedicao } = useMedicoes(obraId);
  const { pendentes, marcarAbatidos } = useAdiantamentos(obraId);
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('selecao');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [percentualAtual, setPercentualAtual] = useState('');
  const [adiantamentosSelecionados, setAdiantamentosSelecionados] = useState<string[]>([]);
  const [dataMedicao, setDataMedicao] = useState(new Date().toISOString().split('T')[0]);

  const itensComValor = useMemo(() => {
    return itens.filter(i => i.valor_contrato_mao_de_obra && i.valor_contrato_mao_de_obra > 0);
  }, [itens]);

  const selectedItem = itensComValor.find(i => i.id === selectedItemId);

  const ultimaMedicao = useMemo(() => {
    if (!selectedItemId) return null;
    // Sort descending by date to guarantee the most recent is picked, regardless of query order
    return [...medicoes]
      .sort((a, b) => new Date(b.data_medicao).getTime() - new Date(a.data_medicao).getTime())
      .find(m => m.cronograma_item_id === selectedItemId) ?? null;
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

      toast({ title: t('financial.billingRegistered'), description: t('financial.netValue', { value: formatCurrency(valorLiquido) }) });
      handleReset();
      onOpenChange(false);
    } catch {
      toast({ title: t('financial.errorRegistering'), variant: 'destructive' });
    }
  };

  const toggleAdiantamento = (id: string) => {
    setAdiantamentosSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const stepLabels = [
    t('financial.stepSelection'),
    t('financial.stepCalculation'),
    t('financial.stepDeductions'),
    t('financial.stepResult'),
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleReset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {t('financial.billingTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 text-xs">
          {(['selecao', 'calculo', 'deducoes', 'resultado'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              <Badge variant={step === s ? 'default' : 'secondary'} className="text-xs">
                {stepLabels[i]}
              </Badge>
            </div>
          ))}
        </div>

        <Separator />

        {step === 'selecao' && (
          <div className="space-y-4">
            <div>
              <Label>{t('financial.billingDate')}</Label>
              <Input type="date" value={dataMedicao} onChange={e => setDataMedicao(e.target.value)} />
            </div>

            {itensComValor.length === 0 ? (
              <div className="text-center py-6 space-y-4">
                <div className="text-muted-foreground">
                  <p className="font-medium">{t('financial.noContractItems')}</p>
                  <p className="text-sm mt-1">{t('financial.defineContractFirst')}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    handleReset();
                    onOpenChange(false);
                    navigate(`/obra/${obraId}?tab=cronograma&destacar=sem-valor`);
                  }}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  {t('financial.goToScheduleValues')}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label>{t('financial.scheduleItem')}</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('financial.selectItem')} />
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
                      <span className="text-muted-foreground">{t('financial.contractValueLabel')}</span>
                      <span className="font-semibold">{formatCurrency(valorContrato)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('financial.previousAccumulated')}</span>
                      <span className="font-semibold">{percentualAnterior}%</span>
                    </div>
                  </div>
                )}

                {selectedItem && (
                  <div>
                    <Label>{t('financial.currentAccumulated')}</Label>
                    <Input
                      type="number"
                      min={percentualAnterior}
                      max={100}
                      step="0.1"
                      placeholder={t('financial.fromTo', { from: percentualAnterior })}
                      value={percentualAtual}
                      onChange={e => setPercentualAtual(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {itensComValor.length > 0 && (
              <Button
                className="w-full"
                disabled={!selectedItem || !percAtual || percAtual <= percentualAnterior}
                onClick={() => setStep('calculo')}
              >
                {t('financial.calculate')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {step === 'calculo' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">{t('financial.billingSummary')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">{t('financial.periodProgress')}</span>
                <span className="text-right font-medium">{percentualAnterior}% → {percAtual}% (+{avancoPeriodo.toFixed(1)}%)</span>
                <span className="text-muted-foreground">{t('financial.contractValueLabel')}</span>
                <span className="text-right font-medium">{formatCurrency(valorContrato)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('financial.executedValue')}</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(valorBruto)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('selecao')} className="flex-1">{t('common.back')}</Button>
              <Button onClick={() => setStep('deducoes')} className="flex-1">
                {t('financial.stepDeductions')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'deducoes' && (
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-sm">{t('financial.technicalRetention', { pct: retencaoPercentual })}</span>
                  <p className="text-xs text-muted-foreground">{t('financial.releasedAtEnd')}</p>
                </div>
                <Badge variant="outline" className="text-warning border-warning">
                  - {formatCurrency(valorRetencao)}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{t('financial.pendingAdvancesVouchers')}</Label>
              {pendentes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t('financial.noPendingAdvances')}</p>
              ) : (
                <div className="space-y-2">
                  {pendentes.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                      <Checkbox
                        checked={adiantamentosSelecionados.includes(a.id)}
                        onCheckedChange={() => toggleAdiantamento(a.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.descricao || t('financial.advance')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString()}</p>
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
                  <span className="font-medium text-sm">{t('financial.totalAdvances')}</span>
                  <Badge variant="outline" className="text-destructive border-destructive">
                    - {formatCurrency(totalAdiantamentos)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('calculo')} className="flex-1">{t('common.back')}</Button>
              <Button onClick={() => setStep('resultado')} className="flex-1">
                {t('financial.seeResult')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'resultado' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('financial.grossMeasured')}</span>
                <span className="font-medium">{formatCurrency(valorBruto)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span>{t('financial.technicalRetention', { pct: retencaoPercentual })}</span>
                <span>- {formatCurrency(valorRetencao)}</span>
              </div>
              {totalAdiantamentos > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>{t('financial.advancesDeducted')}</span>
                  <span>- {formatCurrency(totalAdiantamentos)}</span>
                </div>
              )}
              <Separator />
            </div>

            {valorLiquido < 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                <strong>Atenção:</strong> Os adiantamentos e deduções superam o valor bruto desta medição. O valor líquido não pode ser negativo — volte e revise os adiantamentos selecionados antes de confirmar.
              </div>
            )}

            <div className={`${valorLiquido < 0 ? 'bg-destructive/10 border-2 border-destructive/40' : 'bg-success/10 border-2 border-success/40'} rounded-xl p-6 text-center`}>
              <p className="text-sm text-muted-foreground mb-1">{t('financial.netToPay')}</p>
              <p className={`text-3xl font-bold ${valorLiquido < 0 ? 'text-destructive' : 'text-success'}`}>{formatCurrency(valorLiquido)}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('deducoes')} className="flex-1">{t('common.back')}</Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                disabled={createMedicao.isPending || valorLiquido < 0}
              >
                <Check className="w-4 h-4 mr-2" /> {t('financial.confirmBilling')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

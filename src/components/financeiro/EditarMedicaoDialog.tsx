import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMedicoes } from '@/hooks/useMedicoes';
import { useToast } from '@/hooks/use-toast';
import { Medicao } from '@/types/database';
import { Pencil, Loader2 } from 'lucide-react';

interface EditarMedicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicao: Medicao;
  obraId: string;
  retencaoPercentual: number;
}

export function EditarMedicaoDialog({ open, onOpenChange, medicao, obraId, retencaoPercentual }: EditarMedicaoDialogProps) {
  const { updateMedicao } = useMedicoes(obraId);
  const { toast } = useToast();

  const [dataMedicao, setDataMedicao] = useState(medicao.data_medicao);
  const [percentualAtual, setPercentualAtual] = useState(String(medicao.percentual_atual));
  const [observacoes, setObservacoes] = useState(medicao.observacoes || '');

  useEffect(() => {
    setDataMedicao(medicao.data_medicao);
    setPercentualAtual(String(medicao.percentual_atual));
    setObservacoes(medicao.observacoes || '');
  }, [medicao]);

  const percAtual = parseFloat(percentualAtual) || 0;
  const percentualAnterior = Number(medicao.percentual_anterior);
  const valorContrato = Number(medicao.valor_contrato_referencia);
  const avancoPeriodo = Math.max(0, percAtual - percentualAnterior);
  const valorBruto = (avancoPeriodo / 100) * valorContrato;
  const valorRetencao = (retencaoPercentual / 100) * valorBruto;
  const valorAdiantamentos = Number(medicao.valor_adiantamentos_descontados);
  const valorLiquido = valorBruto - valorRetencao - valorAdiantamentos;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSave = async () => {
    try {
      await updateMedicao.mutateAsync({
        id: medicao.id,
        data_medicao: dataMedicao,
        percentual_atual: percAtual,
        percentual_avanco_periodo: avancoPeriodo,
        valor_bruto_medido: valorBruto,
        valor_retencao_tecnica: valorRetencao,
        retencao_percentual_aplicado: retencaoPercentual,
        valor_liquido_a_pagar: valorLiquido,
        observacoes: observacoes || null,
      });
      toast({ title: 'Medição atualizada!' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Medição
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data da Medição</Label>
            <Input type="date" value={dataMedicao} onChange={e => setDataMedicao(e.target.value)} />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor do Contrato:</span>
              <span className="font-semibold">{formatCurrency(valorContrato)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">% Anterior:</span>
              <span className="font-semibold">{percentualAnterior}%</span>
            </div>
          </div>

          <div>
            <Label>% Acumulado Atual</Label>
            <Input
              type="number"
              min={percentualAnterior}
              max={100}
              step="0.1"
              value={percentualAtual}
              onChange={e => setPercentualAtual(e.target.value)}
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre esta medição..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Bruto:</span>
              <span className="font-medium">{formatCurrency(valorBruto)}</span>
            </div>
            <div className="flex justify-between text-warning">
              <span>Retenção ({retencaoPercentual}%):</span>
              <span>- {formatCurrency(valorRetencao)}</span>
            </div>
            {valorAdiantamentos > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Adiantamentos:</span>
                <span>- {formatCurrency(valorAdiantamentos)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-success pt-1 border-t">
              <span>Líquido:</span>
              <span>{formatCurrency(valorLiquido)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={updateMedicao.isPending || percAtual <= percentualAnterior}
            >
              {updateMedicao.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

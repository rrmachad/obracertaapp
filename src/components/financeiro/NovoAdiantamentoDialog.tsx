import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdiantamentos } from '@/hooks/useMedicoes';
import { useToast } from '@/hooks/use-toast';

interface NovoAdiantamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
}

export function NovoAdiantamentoDialog({ open, onOpenChange, obraId }: NovoAdiantamentoDialogProps) {
  const { createAdiantamento } = useAdiantamentos(obraId);
  const { toast } = useToast();
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) return;

    try {
      await createAdiantamento.mutateAsync({
        obra_id: obraId,
        data,
        valor: valorNum,
        descricao: descricao || undefined,
      });
      toast({ title: 'Adiantamento registrado!', description: `R$ ${valorNum.toFixed(2)}` });
      setValor('');
      setDescricao('');
      onOpenChange(false);
    } catch {
      toast({ title: 'Erro ao registrar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Adiantamento (Vale)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={e => setValor(e.target.value)}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Vale para almoço"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!valor || createAdiantamento.isPending}>
            Registrar Adiantamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

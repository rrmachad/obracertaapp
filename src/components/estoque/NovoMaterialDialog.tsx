import { useState } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMateriais } from '@/hooks/useMateriais';

interface NovoMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
}

const unidades = [
  { value: 'un', label: 'Unidades (un)' },
  { value: 'sc', label: 'Sacos (sc)' },
  { value: 'kg', label: 'Quilos (kg)' },
  { value: 'm³', label: 'Metro cúbico (m³)' },
  { value: 'm²', label: 'Metro quadrado (m²)' },
  { value: 'm', label: 'Metro linear (m)' },
  { value: 'lt', label: 'Litros (lt)' },
  { value: 'pc', label: 'Peças (pc)' },
];

export function NovoMaterialDialog({ open, onOpenChange, obraId }: NovoMaterialDialogProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [qtdAtual, setQtdAtual] = useState('0');
  const [qtdMinima, setQtdMinima] = useState('0');
  const [loading, setLoading] = useState(false);

  const { createMaterial } = useMateriais(obraId);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do material.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await createMaterial.mutateAsync({
        obra_id: obraId,
        nome: nome.trim(),
        unidade,
        qtd_atual: parseFloat(qtdAtual) || 0,
        qtd_minima: parseFloat(qtdMinima) || 0,
      });

      toast({
        title: 'Material adicionado!',
        description: nome,
      });

      // Limpar e fechar
      setNome('');
      setUnidade('un');
      setQtdAtual('0');
      setQtdMinima('0');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" />
            Novo Material
          </DialogTitle>
          <DialogDescription>
            Adicione um material ao estoque desta obra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">
              Nome do material
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Cimento CP II"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Unidade</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtdAtual" className="text-base font-medium">
                Qtd. atual
              </Label>
              <Input
                id="qtdAtual"
                type="number"
                step="0.01"
                min="0"
                value={qtdAtual}
                onChange={(e) => setQtdAtual(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qtdMinima" className="text-base font-medium">
                Qtd. mínima
              </Label>
              <Input
                id="qtdMinima"
                type="number"
                step="0.01"
                min="0"
                value={qtdMinima}
                onChange={(e) => setQtdMinima(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

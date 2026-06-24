import { useState, useEffect } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMateriais } from '@/hooks/useMateriais';
import { isUnidadeInteira } from './NovoMaterialDialog';
import { Material } from '@/types/database';
import { useTranslation } from 'react-i18next';

const unidadesMetricas = [
  { value: 'un', labelKey: 'inventory.unitsMetric' },
  { value: 'sc', labelKey: 'inventory.bagsMetric' },
  { value: 'kg', labelKey: 'inventory.kgMetric' },
  { value: 'm³', labelKey: 'inventory.cubicMeterMetric' },
  { value: 'm²', labelKey: 'inventory.squareMeterMetric' },
  { value: 'm', labelKey: 'inventory.linearMeterMetric' },
  { value: 'lt', labelKey: 'inventory.litersMetric' },
  { value: 'pc', labelKey: 'inventory.piecesMetric' },
];

const unidadesImperiais = [
  { value: 'un', labelKey: 'inventory.unitsImperial' },
  { value: 'bag', labelKey: 'inventory.bagsImperial' },
  { value: 'lbs', labelKey: 'inventory.poundsImperial' },
  { value: 'yd³', labelKey: 'inventory.cubicYardImperial' },
  { value: 'ft²', labelKey: 'inventory.squareFootImperial' },
  { value: 'ft', labelKey: 'inventory.footImperial' },
  { value: 'gal', labelKey: 'inventory.gallonsImperial' },
  { value: 'pc', labelKey: 'inventory.piecesImperial' },
];

interface EditarMaterialDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  sistemaMedidas?: 'metrico' | 'imperial';
}

export function EditarMaterialDialog({ material, open, onOpenChange, obraId, sistemaMedidas = 'metrico' }: EditarMaterialDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateMaterial } = useMateriais(obraId);

  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [qtdMinima, setQtdMinima] = useState('0');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [loading, setLoading] = useState(false);

  const unidades = sistemaMedidas === 'imperial' ? unidadesImperiais : unidadesMetricas;

  useEffect(() => {
    if (material) {
      setNome(material.nome);
      setUnidade(material.unidade);
      setQtdMinima(String(material.qtd_minima));
      setPrecoUnitario(material.preco_unitario != null ? String(material.preco_unitario) : '');
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast({ title: t('inventory.nameRequired'), description: t('inventory.enterMaterialName'), variant: 'destructive' });
      return;
    }
    if (!material) return;

    setLoading(true);
    try {
      const usarInteiro = isUnidadeInteira(unidade);
      const parsedPreco = precoUnitario !== '' ? parseFloat(precoUnitario) : null;
      await updateMaterial.mutateAsync({
        id: material.id,
        nome: nome.trim(),
        unidade,
        qtd_minima: usarInteiro ? Math.round(parseFloat(qtdMinima) || 0) : parseFloat(qtdMinima) || 0,
        preco_unitario: parsedPreco !== null && !isNaN(parsedPreco) ? parsedPreco : undefined,
      });
      toast({ title: t('inventory.materialUpdated'), description: nome.trim() });
      onOpenChange(false);
    } catch {
      toast({ title: t('inventory.errorUpdating'), description: t('common.tryAgain'), variant: 'destructive' });
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
            {t('inventory.editMaterial')}
          </DialogTitle>
          <DialogDescription>{t('inventory.editMaterialDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome" className="text-base font-medium">{t('inventory.materialName')}</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-12 text-base"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">{t('inventory.unitLabel')}</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{t(u.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-qtd-minima" className="text-base font-medium">{t('inventory.minQty')}</Label>
            <Input
              id="edit-qtd-minima"
              type="number"
              step={isUnidadeInteira(unidade) ? '1' : '0.01'}
              min="0"
              value={qtdMinima}
              onChange={(e) => setQtdMinima(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-preco-unitario" className="text-base font-medium">Preço unitário <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="edit-preco-unitario"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                className="pl-9 h-12 text-base"
              />
            </div>
            <p className="text-xs text-muted-foreground">Preencha retroativamente para que este material apareça no cálculo de custo da lucratividade.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 h-12" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

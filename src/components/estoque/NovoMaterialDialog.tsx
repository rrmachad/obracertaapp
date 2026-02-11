import { useState, useMemo } from 'react';
import { Package, Loader2, Search, Check, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMateriais } from '@/hooks/useMateriais';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { getMateriaisPorFase, getTodosMateriais, MaterialSugerido } from './MateriaisSugeridos';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface NovoMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  sistemaMedidas?: 'metrico' | 'imperial';
  onUpgradeClick?: () => void;
}

const unidadesMetricas = [
  { value: 'un', labelKey: 'inventory.unitsMetric', inteiro: true },
  { value: 'sc', labelKey: 'inventory.bagsMetric', inteiro: true },
  { value: 'kg', labelKey: 'inventory.kgMetric', inteiro: false },
  { value: 'm³', labelKey: 'inventory.cubicMeterMetric', inteiro: false },
  { value: 'm²', labelKey: 'inventory.squareMeterMetric', inteiro: false },
  { value: 'm', labelKey: 'inventory.linearMeterMetric', inteiro: false },
  { value: 'lt', labelKey: 'inventory.litersMetric', inteiro: false },
  { value: 'pc', labelKey: 'inventory.piecesMetric', inteiro: true },
];

const unidadesImperiais = [
  { value: 'un', labelKey: 'inventory.unitsImperial', inteiro: true },
  { value: 'bag', labelKey: 'inventory.bagsImperial', inteiro: true },
  { value: 'lbs', labelKey: 'inventory.poundsImperial', inteiro: false },
  { value: 'yd³', labelKey: 'inventory.cubicYardImperial', inteiro: false },
  { value: 'ft²', labelKey: 'inventory.squareFootImperial', inteiro: false },
  { value: 'ft', labelKey: 'inventory.footImperial', inteiro: false },
  { value: 'gal', labelKey: 'inventory.gallonsImperial', inteiro: false },
  { value: 'pc', labelKey: 'inventory.piecesImperial', inteiro: true },
];

export const isUnidadeInteira = (unidade: string): boolean => {
  const allUnidades = [...unidadesMetricas, ...unidadesImperiais];
  const found = allUnidades.find(u => u.value === unidade);
  return found?.inteiro ?? false;
};

export function NovoMaterialDialog({ open, onOpenChange, obraId, sistemaMedidas = 'metrico', onUpgradeClick }: NovoMaterialDialogProps) {
  const { t } = useTranslation();
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [qtdAtual, setQtdAtual] = useState('0');
  const [qtdMinima, setQtdMinima] = useState('0');
  const [loading, setLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedFase, setSelectedFase] = useState<string>('all');
  const unidades = sistemaMedidas === 'imperial' ? unidadesImperiais : unidadesMetricas;
  const currentMateriaisPorFase = useMemo(() => getMateriaisPorFase('pt-BR', sistemaMedidas), [sistemaMedidas]);
  const currentTodosMateriais = useMemo(() => getTodosMateriais('pt-BR', sistemaMedidas), [sistemaMedidas]);

  const { createMaterial, materiais } = useMateriais(obraId);
  const { canCreateMaterial, getMaterialCount, limits } = usePlanLimits();
  const { toast } = useToast();

  const canCreate = canCreateMaterial(obraId);
  const materialCount = getMaterialCount(obraId);

  const materiaisFiltrados = useMemo(() => {
    if (selectedFase === 'all') return currentTodosMateriais;
    const fase = currentMateriaisPorFase.find(f => f.faseNome === selectedFase);
    return fase?.materiais ?? currentTodosMateriais;
  }, [selectedFase, currentTodosMateriais, currentMateriaisPorFase]);

  const materiaisExistentes = useMemo(() => new Set(materiais.map(m => m.nome.toLowerCase())), [materiais]);

  const handleSelectMaterial = (material: MaterialSugerido) => { setNome(material.nome); setUnidade(material.unidade); setComboboxOpen(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast({ title: t('inventory.nameRequired'), description: t('inventory.enterMaterialName'), variant: 'destructive' }); return; }
    setLoading(true);
    const usarInteiro = isUnidadeInteira(unidade);
    try {
      await createMaterial.mutateAsync({ obra_id: obraId, nome: nome.trim(), unidade, qtd_atual: usarInteiro ? Math.round(parseFloat(qtdAtual) || 0) : parseFloat(qtdAtual) || 0, qtd_minima: usarInteiro ? Math.round(parseFloat(qtdMinima) || 0) : parseFloat(qtdMinima) || 0 });
      toast({ title: t('inventory.materialAdded'), description: nome });
      setNome(''); setUnidade('un'); setQtdAtual('0'); setQtdMinima('0'); setSelectedFase('all'); onOpenChange(false);
    } catch { toast({ title: t('inventory.errorAdding'), description: t('common.tryAgain'), variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><Package className="w-6 h-6 text-primary" />{t('inventory.newMaterial')}</DialogTitle>
          <DialogDescription>{t('inventory.selectOrType')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!canCreate && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">{t('inventory.stockLimitReached')}</span>
                <span className="block text-sm mt-0.5">{t('inventory.stockLimitDesc', { used: materialCount, max: limits.maxMateriaisPerObra })}</span>
              </AlertDescription>
            </Alert>
          )}

          {limits.maxMateriaisPerObra !== -1 && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('inventory.stockItems')}</span>
              <Badge variant={canCreate ? "outline" : "destructive"}>{materialCount}/{limits.maxMateriaisPerObra}</Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-base font-medium">{t('inventory.filterByPhase')}</Label>
            <Select value={selectedFase} onValueChange={setSelectedFase} disabled={!canCreate}>
              <SelectTrigger className="h-11"><SelectValue placeholder={t('inventory.allPhases')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inventory.allPhases')}</SelectItem>
                {currentMateriaisPorFase.map((fase) => (<SelectItem key={fase.faseNome} value={fase.faseNome}>{fase.faseNome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">{t('inventory.materialName')}</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full h-12 justify-between text-base font-normal">
                  {nome || t('inventory.selectOrTypeSearch')}<Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('inventory.searchMaterial')} value={nome} onValueChange={setNome} />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-sm text-center">
                        <p className="text-muted-foreground mb-2">{t('inventory.materialNotFound')}</p>
                        {nome.trim() && (<Button type="button" variant="secondary" size="sm" onClick={() => setComboboxOpen(false)}>{t('inventory.use')} "{nome.trim()}"</Button>)}
                      </div>
                    </CommandEmpty>
                    {currentMateriaisPorFase.filter(f => selectedFase === 'all' || f.faseNome === selectedFase).map((fase) => (
                      <CommandGroup key={fase.faseNome} heading={fase.faseNome}>
                        {fase.materiais.map((material) => {
                          const jaExiste = materiaisExistentes.has(material.nome.toLowerCase());
                          return (
                            <CommandItem key={`${fase.faseNome}-${material.nome}`} value={`${material.nome} ${material.categoria}`} onSelect={() => handleSelectMaterial(material)} disabled={jaExiste} className={cn(jaExiste && 'opacity-50')}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Check className={cn("h-4 w-4", nome === material.nome ? "opacity-100" : "opacity-0")} />
                                  <span>{material.nome}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{material.unidade}</Badge>
                                  {jaExiste && <Badge variant="secondary" className="text-xs">{t('inventory.alreadyAdded')}</Badge>}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">{t('inventory.materialsHint')}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">{t('inventory.unitLabel')}</Label>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (<SelectItem key={u.value} value={u.value}>{t(u.labelKey)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtdAtual" className="text-base font-medium">{t('inventory.currentQty')}</Label>
              <Input id="qtdAtual" type="number" step={isUnidadeInteira(unidade) ? "1" : "0.01"} min="0" value={qtdAtual} onChange={(e) => setQtdAtual(e.target.value)} className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtdMinima" className="text-base font-medium">{t('inventory.minQty')}</Label>
              <Input id="qtdMinima" type="number" step={isUnidadeInteira(unidade) ? "1" : "0.01"} min="0" value={qtdMinima} onChange={(e) => setQtdMinima(e.target.value)} className="h-12 text-base" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)} disabled={loading}>{t('common.cancel')}</Button>
            {canCreate ? (
              <Button type="submit" className="flex-1 h-12" disabled={loading}>
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>) : t('common.add')}
              </Button>
            ) : (
              <Button type="button" className="flex-1 h-12" onClick={() => { onOpenChange(false); onUpgradeClick?.(); }}>
                <Crown className="w-4 h-4 mr-2" />{t('common.upgrade')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Check, Circle, Clock, Plus, ChevronDown, Shovel, Hammer, Building2, Home, Zap, Paintbrush, LucideIcon, DollarSign, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFases, useCronogramaItens } from '@/hooks/useCronograma';
import { useToast } from '@/hooks/use-toast';
import { CronogramaItem, ItemStatus } from '@/types/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/hooks/useCurrency';
import { GerenciarFasesDialog } from './GerenciarFasesDialog';

interface CronogramaTabProps {
  obraId: string;
  /** Vindo do fluxo de medição: destaca itens sem valor de mão de obra definido */
  destacarSemValor?: boolean;
}

const temValor = (item: CronogramaItem) =>
  !!item.valor_contrato_mao_de_obra && Number(item.valor_contrato_mao_de_obra) > 0;

const iconMap: Record<string, LucideIcon> = {
  Shovel,
  Hammer,
  Building2,
  Home,
  Zap,
  Paintbrush,
};

export function CronogramaTab({ obraId, destacarSemValor = false }: CronogramaTabProps) {
  const { data: fases, isLoading: fasesLoading } = useFases(obraId);
  const { itens, isLoading: itensLoading, updateItem, createItem } = useCronogramaItens(obraId);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { formatCurrency: fmtCurrency } = useCurrency();
  
  const [novoItemFaseId, setNovoItemFaseId] = useState<string | null>(null);
  const [novoItemDescricao, setNovoItemDescricao] = useState('');
  const [gerenciarFasesOpen, setGerenciarFasesOpen] = useState(false);

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const getItensByFase = (faseId: string) => {
    return itens.filter(item => item.fase_id === faseId);
  };

  const calcularProgressoFase = (faseId: string) => {
    const itensFase = getItensByFase(faseId);
    if (itensFase.length === 0) return 0;
    const concluidos = itensFase.filter(item => item.status === 'concluido').length;
    return Math.round((concluidos / itensFase.length) * 100);
  };

  const calcularValorFase = (faseId: string) => {
    const itensFase = getItensByFase(faseId);
    return itensFase.reduce((sum, item) => sum + (Number(item.valor_contrato_mao_de_obra) || 0), 0);
  };

  const calcularValorConcluidoFase = (faseId: string) => {
    const itensFase = getItensByFase(faseId);
    return itensFase
      .filter(item => item.status === 'concluido')
      .reduce((sum, item) => sum + (Number(item.valor_contrato_mao_de_obra) || 0), 0);
  };

  const handleDistribuirValorFase = async (faseId: string, valorTotal: number, modo: 'igual' | 'proporcional') => {
    const itensFase = getItensByFase(faseId);
    if (itensFase.length === 0) return;

    try {
      if (modo === 'igual') {
        const valorPorItem = Math.round((valorTotal / itensFase.length) * 100) / 100;
        const valorUltimoItem = Math.round((valorTotal - valorPorItem * (itensFase.length - 1)) * 100) / 100;
        for (let i = 0; i < itensFase.length; i++) {
          const val = i === itensFase.length - 1 ? valorUltimoItem : valorPorItem;
          await updateItem.mutateAsync({ id: itensFase[i].id, valor_contrato_mao_de_obra: val as any });
        }
      } else {
        const existingTotal = itensFase.reduce((s, i) => s + (Number(i.valor_contrato_mao_de_obra) || 0), 0);
        
        if (existingTotal > 0) {
          for (let i = 0; i < itensFase.length; i++) {
            const currentVal = Number(itensFase[i].valor_contrato_mao_de_obra) || 0;
            const proportion = currentVal / existingTotal;
            const newVal = Math.round(proportion * valorTotal * 100) / 100;
            await updateItem.mutateAsync({ id: itensFase[i].id, valor_contrato_mao_de_obra: newVal as any });
          }
        } else {
          const valorPorItem = Math.round((valorTotal / itensFase.length) * 100) / 100;
          const valorUltimoItem = Math.round((valorTotal - valorPorItem * (itensFase.length - 1)) * 100) / 100;
          for (let i = 0; i < itensFase.length; i++) {
            const val = i === itensFase.length - 1 ? valorUltimoItem : valorPorItem;
            await updateItem.mutateAsync({ id: itensFase[i].id, valor_contrato_mao_de_obra: val as any });
          }
        }
      }
      toast({ title: modo === 'igual' ? t('schedule.distributedEqually') : t('schedule.distributedProportionally') });
    } catch {
      toast({ title: t('schedule.errorDistributing'), variant: 'destructive' });
    }
  };

  const handleToggleItem = async (item: CronogramaItem) => {
    const novoStatus: ItemStatus = item.status === 'concluido' ? 'pendente' : 'concluido';
    
    try {
      await updateItem.mutateAsync({ id: item.id, status: novoStatus });
      toast({
        title: novoStatus === 'concluido' ? t('schedule.itemCompleted') : t('schedule.itemReopened'),
        description: item.descricao,
      });
    } catch (error) {
      toast({
        title: t('schedule.errorUpdating'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const handleAddItem = async (faseId: string) => {
    if (!novoItemDescricao.trim()) return;

    try {
      await createItem.mutateAsync({
        obra_id: obraId,
        fase_id: faseId,
        descricao: novoItemDescricao.trim(),
      });
      toast({
        title: t('schedule.itemAdded'),
        description: novoItemDescricao,
      });
      setNovoItemDescricao('');
      setNovoItemFaseId(null);
    } catch (error) {
      toast({
        title: t('schedule.errorAdding'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (v: number) =>
    v > 0 ? fmtCurrency(v) : '';

  if (fasesLoading || itensLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const fasesComItemSemValor = (fases ?? [])
    .filter(f => getItensByFase(f.id).some(i => !temValor(i)))
    .map(f => f.id);

  return (
    <div className="space-y-2">
      {destacarSemValor && fasesComItemSemValor.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-sm">{t('schedule.highlightMissingValues')}</p>
        </div>
      )}
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={() => setGerenciarFasesOpen(true)}>
          <Settings2 className="w-4 h-4 mr-2" />
          {t('schedule.managePhases')}
        </Button>
      </div>
      <GerenciarFasesDialog
        open={gerenciarFasesOpen}
        onOpenChange={setGerenciarFasesOpen}
        obraId={obraId}
        itens={itens}
      />
      <Accordion type="multiple" className="space-y-2" defaultValue={destacarSemValor ? fasesComItemSemValor : undefined}>
        {fases?.map((fase) => {
          const progresso = calcularProgressoFase(fase.id);
          const itensFase = getItensByFase(fase.id);
          const concluidos = itensFase.filter(i => i.status === 'concluido').length;
          const valorFase = calcularValorFase(fase.id);
          const valorConcluido = calcularValorConcluidoFase(fase.id);

          return (
            <AccordionItem 
              key={fase.id} 
              value={fase.id}
              className="border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {fase.icone && getIconComponent(fase.icone)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fase.ordem}. {t(`phases.${fase.nome}`, fase.nome)}</span>
                      <Badge variant={progresso === 100 ? 'default' : 'secondary'} className="text-xs">
                        {concluidos}/{itensFase.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progresso} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{progresso}%</span>
                    </div>
                    {valorFase > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primary font-medium">
                          {formatCurrency(valorFase)}
                        </span>
                        {valorConcluido > 0 && (
                          <span className="text-xs text-success">
                            ({t('schedule.completed')}: {formatCurrency(valorConcluido)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {/* Phase value editor */}
                  <FaseValorEditor
                    faseId={fase.id}
                    valorFase={valorFase}
                    qtdItens={itensFase.length}
                    onDistribuir={handleDistribuirValorFase}
                  />

                  {itensFase.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        item.status === 'concluido'
                          ? 'bg-success/10 border-success/30'
                          : destacarSemValor && !temValor(item)
                          ? 'bg-warning/5 border-warning ring-1 ring-warning/40 hover:bg-warning/10'
                          : 'bg-background hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={item.status === 'concluido'}
                        onCheckedChange={() => handleToggleItem(item)}
                        className="w-6 h-6 rounded-md"
                      />
                      <span className={`flex-1 ${item.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                        {item.descricao}
                      </span>
                      {temValor(item) ? (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {fmtCurrency(Number(item.valor_contrato_mao_de_obra))}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-warning border-warning/40">
                          {t('schedule.noValueSet')}
                        </Badge>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="end">
                          <div className="space-y-2">
                            <Label className="text-xs">{t('schedule.contractValue')}</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="R$ 0,00"
                              defaultValue={item.valor_contrato_mao_de_obra ?? ''}
                              onBlur={async (e) => {
                                const val = parseFloat(e.target.value) || null;
                                try {
                                  await updateItem.mutateAsync({ id: item.id, valor_contrato_mao_de_obra: val as any });
                                  toast({ title: t('schedule.valueUpdated') });
                                } catch {
                                  toast({ title: t('schedule.errorUpdating'), variant: 'destructive' });
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">{t('schedule.usedInBilling')}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {item.status === 'concluido' && item.data_conclusao && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.data_conclusao).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Adicionar novo item */}
                  {novoItemFaseId === fase.id ? (
                    <div className="flex items-center gap-2 p-2">
                      <Input
                        value={novoItemDescricao}
                        onChange={(e) => setNovoItemDescricao(e.target.value)}
                        placeholder={t('schedule.itemDescription')}
                        className="flex-1 h-10"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(fase.id)}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleAddItem(fase.id)}
                        disabled={!novoItemDescricao.trim()}
                      >
                        {t('common.add')}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setNovoItemFaseId(null);
                          setNovoItemDescricao('');
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setNovoItemFaseId(fase.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('schedule.addItem')}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// Sub-component for phase value editor with distribution mode
function FaseValorEditor({ faseId, valorFase, qtdItens, onDistribuir }: {
  faseId: string;
  valorFase: number;
  qtdItens: number;
  onDistribuir: (faseId: string, valor: number, modo: 'igual' | 'proporcional') => Promise<void>;
}) {
  const [modo, setModo] = useState<'igual' | 'proporcional'>('igual');
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
      <DollarSign className="w-4 h-4 text-primary shrink-0" />
      <Label className="text-xs text-primary whitespace-nowrap">{t('schedule.phaseValue')}</Label>
      <span className="text-sm font-semibold text-primary flex-1">
        {valorFase > 0 ? formatCurrency(valorFase) : t('schedule.notDefined')}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            {t('schedule.setTotal')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <Label className="text-xs font-medium">{t('schedule.totalPhaseValue')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="R$ 0,00"
              defaultValue={valorFase > 0 ? valorFase : ''}
              id={`fase-valor-${faseId}`}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">{t('schedule.distributionMode')}</Label>
              <Select value={modo} onValueChange={(v) => setModo(v as 'igual' | 'proporcional')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="igual">{t('schedule.equalAmongItems')}</SelectItem>
                  <SelectItem value="proporcional">{t('schedule.proportionalToWeight')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {modo === 'igual'
                  ? t('schedule.equalDistributionDesc', { count: qtdItens })
                  : t('schedule.proportionalDistributionDesc')}
              </p>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                const input = document.getElementById(`fase-valor-${faseId}`) as HTMLInputElement;
                const val = parseFloat(input?.value) || 0;
                if (val > 0) onDistribuir(faseId, val, modo);
              }}
            >
              {t('schedule.distributeAmongItems')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

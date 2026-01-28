import { useState } from 'react';
import { Check, Circle, Clock, Plus, ChevronDown, Shovel, Hammer, Building2, Home, Zap, Paintbrush, LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFases, useCronogramaItens } from '@/hooks/useCronograma';
import { useToast } from '@/hooks/use-toast';
import { CronogramaItem, ItemStatus } from '@/types/database';

interface CronogramaTabProps {
  obraId: string;
}

const iconMap: Record<string, LucideIcon> = {
  Shovel,
  Hammer,
  Building2,
  Home,
  Zap,
  Paintbrush,
};

export function CronogramaTab({ obraId }: CronogramaTabProps) {
  const { data: fases, isLoading: fasesLoading } = useFases();
  const { itens, isLoading: itensLoading, updateItem, createItem } = useCronogramaItens(obraId);
  const { toast } = useToast();
  
  const [novoItemFaseId, setNovoItemFaseId] = useState<string | null>(null);
  const [novoItemDescricao, setNovoItemDescricao] = useState('');

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

  const handleToggleItem = async (item: CronogramaItem) => {
    const novoStatus: ItemStatus = item.status === 'concluido' ? 'pendente' : 'concluido';
    
    try {
      await updateItem.mutateAsync({ id: item.id, status: novoStatus });
      toast({
        title: novoStatus === 'concluido' ? '✓ Item concluído!' : 'Item reaberto',
        description: item.descricao,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente.',
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
        title: 'Item adicionado!',
        description: novoItemDescricao,
      });
      setNovoItemDescricao('');
      setNovoItemFaseId(null);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (fasesLoading || itensLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Accordion type="multiple" className="space-y-2">
        {fases?.map((fase) => {
          const progresso = calcularProgressoFase(fase.id);
          const itensFase = getItensByFase(fase.id);
          const concluidos = itensFase.filter(i => i.status === 'concluido').length;

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
                      <span className="font-semibold">{fase.ordem}. {fase.nome}</span>
                      <Badge variant={progresso === 100 ? 'default' : 'secondary'} className="text-xs">
                        {concluidos}/{itensFase.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progresso} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{progresso}%</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {itensFase.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        item.status === 'concluido' 
                          ? 'bg-success/10 border-success/30' 
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
                      {item.status === 'concluido' && item.data_conclusao && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.data_conclusao).toLocaleDateString('pt-BR')}
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
                        placeholder="Descrição do item"
                        className="flex-1 h-10"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(fase.id)}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleAddItem(fase.id)}
                        disabled={!novoItemDescricao.trim()}
                      >
                        Adicionar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setNovoItemFaseId(null);
                          setNovoItemDescricao('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setNovoItemFaseId(fase.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar item
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

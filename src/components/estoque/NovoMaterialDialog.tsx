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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMateriais } from '@/hooks/useMateriais';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { materiaisPorFase, todosMateriais, MaterialSugerido } from './MateriaisSugeridos';
import { cn } from '@/lib/utils';

interface NovoMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obraId: string;
  onUpgradeClick?: () => void;
}

const unidades = [
  { value: 'un', label: 'Unidades (un)', inteiro: true },
  { value: 'sc', label: 'Sacos (sc)', inteiro: true },
  { value: 'kg', label: 'Quilos (kg)', inteiro: false },
  { value: 'm³', label: 'Metro cúbico (m³)', inteiro: false },
  { value: 'm²', label: 'Metro quadrado (m²)', inteiro: false },
  { value: 'm', label: 'Metro linear (m)', inteiro: false },
  { value: 'lt', label: 'Litros (lt)', inteiro: false },
  { value: 'pc', label: 'Peças (pc)', inteiro: true },
];

// Função helper para verificar se unidade usa números inteiros
export const isUnidadeInteira = (unidade: string): boolean => {
  const found = unidades.find(u => u.value === unidade);
  return found?.inteiro ?? false;
};

export function NovoMaterialDialog({ open, onOpenChange, obraId, onUpgradeClick }: NovoMaterialDialogProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [qtdAtual, setQtdAtual] = useState('0');
  const [qtdMinima, setQtdMinima] = useState('0');
  const [loading, setLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedFase, setSelectedFase] = useState<string>('all');

  const { createMaterial, materiais } = useMateriais(obraId);
  const { canCreateMaterial, getMaterialCount, limits } = usePlanLimits();
  const { toast } = useToast();

  const canCreate = canCreateMaterial(obraId);
  const materialCount = getMaterialCount(obraId);

  // Filtrar materiais por fase selecionada
  const materiaisFiltrados = useMemo(() => {
    if (selectedFase === 'all') return todosMateriais;
    const fase = materiaisPorFase.find(f => f.faseNome === selectedFase);
    return fase?.materiais ?? todosMateriais;
  }, [selectedFase]);

  // Materiais já cadastrados (para evitar duplicatas)
  const materiaisExistentes = useMemo(() => 
    new Set(materiais.map(m => m.nome.toLowerCase())),
    [materiais]
  );

  const handleSelectMaterial = (material: MaterialSugerido) => {
    setNome(material.nome);
    setUnidade(material.unidade);
    setComboboxOpen(false);
  };

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

    const usarInteiro = isUnidadeInteira(unidade);

    try {
      await createMaterial.mutateAsync({
        obra_id: obraId,
        nome: nome.trim(),
        unidade,
        qtd_atual: usarInteiro ? Math.round(parseFloat(qtdAtual) || 0) : parseFloat(qtdAtual) || 0,
        qtd_minima: usarInteiro ? Math.round(parseFloat(qtdMinima) || 0) : parseFloat(qtdMinima) || 0,
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
      setSelectedFase('all');
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" />
            Novo Material
          </DialogTitle>
          <DialogDescription>
            Selecione um material sugerido ou digite um novo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alerta de limite atingido */}
          {!canCreate && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <span className="font-semibold">Limite do plano Free atingido!</span>
                <span className="block text-sm mt-0.5">
                  Você já adicionou {materialCount} de {limits.maxMateriaisPerObra} item(ns) no estoque desta obra.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Contador de materiais */}
          {limits.maxMateriaisPerObra !== -1 && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Itens no estoque desta obra:</span>
              <Badge variant={canCreate ? "outline" : "destructive"}>
                {materialCount}/{limits.maxMateriaisPerObra}
              </Badge>
            </div>
          )}

          {/* Filtro por fase */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Filtrar por fase</Label>
            <Select value={selectedFase} onValueChange={setSelectedFase} disabled={!canCreate}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Todas as fases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                {materiaisPorFase.map((fase) => (
                  <SelectItem key={fase.faseNome} value={fase.faseNome}>
                    {fase.faseNome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de material com busca */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-base font-medium">
              Nome do material
            </Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full h-12 justify-between text-base font-normal"
                >
                  {nome || 'Selecione ou digite...'}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Buscar material..." 
                    value={nome}
                    onValueChange={setNome}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-sm text-center">
                        <p className="text-muted-foreground mb-2">Material não encontrado</p>
                        {nome.trim() && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setComboboxOpen(false)}
                          >
                            Usar "{nome.trim()}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    {materiaisPorFase
                      .filter(f => selectedFase === 'all' || f.faseNome === selectedFase)
                      .map((fase) => (
                        <CommandGroup key={fase.faseNome} heading={fase.faseNome}>
                          {fase.materiais.map((material) => {
                            const jaExiste = materiaisExistentes.has(material.nome.toLowerCase());
                            return (
                              <CommandItem
                                key={`${fase.faseNome}-${material.nome}`}
                                value={`${material.nome} ${material.categoria}`}
                                onSelect={() => handleSelectMaterial(material)}
                                disabled={jaExiste}
                                className={cn(jaExiste && 'opacity-50')}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        nome === material.nome ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span>{material.nome}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {material.unidade}
                                    </Badge>
                                    {jaExiste && (
                                      <Badge variant="secondary" className="text-xs">
                                        Já adicionado
                                      </Badge>
                                    )}
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
            <p className="text-xs text-muted-foreground">
              💡 Materiais comuns já vêm com a unidade correta
            </p>
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
                step={isUnidadeInteira(unidade) ? "1" : "0.01"}
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
                step={isUnidadeInteira(unidade) ? "1" : "0.01"}
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
            {canCreate ? (
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
            ) : (
              <Button
                type="button"
                className="flex-1 h-12"
                onClick={() => {
                  onOpenChange(false);
                  onUpgradeClick?.();
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Fazer Upgrade
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

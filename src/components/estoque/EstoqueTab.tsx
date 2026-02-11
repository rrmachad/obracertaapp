import { useState, useMemo } from 'react';
import { Package, Plus, AlertTriangle, Trash2, Filter, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMateriais } from '@/hooks/useMateriais';
import { useToast } from '@/hooks/use-toast';
import { NovoMaterialDialog, isUnidadeInteira } from './NovoMaterialDialog';
import { AjusteQuantidadePopover } from './AjusteQuantidadePopover';
import { Material } from '@/types/database';

// Formata quantidade conforme unidade (inteiro ou decimal)
const formatarQuantidade = (qtd: number, unidade: string): string => {
  if (isUnidadeInteira(unidade)) {
    return Math.round(qtd).toString();
  }
  return qtd.toFixed(2);
};

// Categorias disponíveis
const CATEGORIAS = [
  { value: 'all', label: 'Todas categorias', icon: '📦' },
  { value: 'alvenaria', label: 'Alvenaria', icon: '🧱' },
  { value: 'hidraulica', label: 'Hidráulica', icon: '🚿' },
  { value: 'eletrica', label: 'Elétrica', icon: '⚡' },
  { value: 'estrutural', label: 'Estrutural', icon: '🏗️' },
  { value: 'acabamento', label: 'Acabamento', icon: '🎨' },
  { value: 'ferramentas', label: 'Ferramentas', icon: '🔧' },
  { value: 'outros', label: 'Outros', icon: '📋' },
];

// Detectar categoria com base no nome do material
const detectarCategoria = (nome: string): string => {
  const nomeLower = nome.toLowerCase();
  
  if (/tijolo|bloco|argamassa|cimento|areia|brita|concreto|cal|reboco/i.test(nomeLower)) {
    return 'alvenaria';
  }
  if (/tubo|pvc|conexão|joelho|tê|luva|registro|caixa d'?água|sifão|vaso|torneira/i.test(nomeLower)) {
    return 'hidraulica';
  }
  if (/fio|cabo|disjuntor|tomada|interruptor|quadro|eletroduto|conduíte/i.test(nomeLower)) {
    return 'eletrica';
  }
  if (/ferro|aço|vergalhão|treliça|viga|pilar|laje|forma/i.test(nomeLower)) {
    return 'estrutural';
  }
  if (/tinta|verniz|massa|lixa|piso|azulejo|rejunte|porcelanato|cerâmica|rodapé/i.test(nomeLower)) {
    return 'acabamento';
  }
  if (/martelo|chave|serra|furadeira|trena|nível|colher|desempenadeira/i.test(nomeLower)) {
    return 'ferramentas';
  }
  
  return 'outros';
};

interface EstoqueTabProps {
  obraId: string;
  sistemaMedidas?: 'metrico' | 'imperial';
  onUpgradeClick?: () => void;
}

export function EstoqueTab({ obraId, sistemaMedidas = 'metrico', onUpgradeClick }: EstoqueTabProps) {
  const { materiais, isLoading, ajustarQuantidade, deleteMaterial } = useMateriais(obraId);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');

  // Agrupar materiais por categoria
  const materiaisAgrupados = useMemo(() => {
    const grupos: Record<string, Material[]> = {};
    
    materiais.forEach(material => {
      const categoria = material.categoria || detectarCategoria(material.nome);
      if (!grupos[categoria]) {
        grupos[categoria] = [];
      }
      grupos[categoria].push(material);
    });
    
    return grupos;
  }, [materiais]);

  // Filtrar por categoria selecionada
  const materiaisFiltrados = useMemo(() => {
    if (categoriaFiltro === 'all') return materiais;
    return materiais.filter(m => {
      const categoria = m.categoria || detectarCategoria(m.nome);
      return categoria === categoriaFiltro;
    });
  }, [materiais, categoriaFiltro]);

  // Contadores por categoria
  const contadorCategorias = useMemo(() => {
    const contagem: Record<string, number> = {};
    materiais.forEach(material => {
      const categoria = material.categoria || detectarCategoria(material.nome);
      contagem[categoria] = (contagem[categoria] || 0) + 1;
    });
    return contagem;
  }, [materiais]);

  const handleAjuste = async (material: Material, delta: number) => {
    try {
      await ajustarQuantidade.mutateAsync({ id: material.id, delta });
      toast({
        title: delta > 0 ? 'Entrada registrada' : 'Saída registrada',
        description: `${Math.abs(delta)} ${material.unidade} de ${material.nome}`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao ajustar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      throw error; // Re-throw para o popover saber que falhou
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`Remover "${material.nome}" do estoque?`)) return;
    
    try {
      await deleteMaterial.mutateAsync(material.id);
      toast({
        title: 'Material removido',
        description: material.nome,
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getCategoriaInfo = (categoria: string) => {
    return CATEGORIAS.find(c => c.value === categoria) || CATEGORIAS[CATEGORIAS.length - 1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com indicador de sistema de medidas */}
      <div className="flex items-center justify-between gap-2">
        <Button
          onClick={() => setDialogOpen(true)}
          className="flex-1 h-14 text-base font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Material
        </Button>
        <Badge variant="outline" className="h-14 px-3 flex items-center gap-1.5 shrink-0">
          <Ruler className="w-4 h-4" />
          <span className="text-xs font-medium">
            {sistemaMedidas === 'imperial' ? t('measurementSystem.imperial') : t('measurementSystem.metric')}
          </span>
        </Badge>
      </div>

      {/* Filtro por categoria */}
      {materiais.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {cat.value !== 'all' && contadorCategorias[cat.value] && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {contadorCategorias[cat.value]}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resumo por categoria */}
      {materiais.length > 0 && categoriaFiltro === 'all' && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(contadorCategorias).map(([categoria, count]) => {
            const info = getCategoriaInfo(categoria);
            return (
              <Badge
                key={categoria}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => setCategoriaFiltro(categoria)}
              >
                <span className="mr-1">{info.icon}</span>
                {info.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Lista de materiais */}
      {materiais.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum material cadastrado</p>
            <p className="text-sm">Adicione materiais para controlar seu estoque</p>
          </CardContent>
        </Card>
      ) : materiaisFiltrados.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Filter className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium">Nenhum material nesta categoria</p>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setCategoriaFiltro('all')}
            >
              Ver todos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materiaisFiltrados.map((material) => {
            const isLow = material.qtd_atual < material.qtd_minima;
            const categoria = material.categoria || detectarCategoria(material.nome);
            const categoriaInfo = getCategoriaInfo(categoria);
            
            return (
              <Card 
                key={material.id} 
                className={`border-2 ${isLow ? 'border-destructive/50 bg-destructive/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoriaInfo.icon}</span>
                        <h4 className="font-semibold truncate">{material.nome}</h4>
                        {isLow && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Baixo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {formatarQuantidade(material.qtd_minima, material.unidade)} {material.unidade}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botão diminuir com popover */}
                      <AjusteQuantidadePopover
                        tipo="saida"
                        onAjuste={(delta) => handleAjuste(material, delta)}
                        disabled={material.qtd_atual <= 0}
                        unidade={material.unidade}
                        qtdAtual={material.qtd_atual}
                      />

                      {/* Quantidade atual */}
                      <div className="w-20 text-center">
                        <div className={`text-2xl font-bold ${isLow ? 'text-destructive' : ''}`}>
                          {formatarQuantidade(material.qtd_atual, material.unidade)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {material.unidade}
                        </div>
                      </div>

                      {/* Botão aumentar com popover */}
                      <AjusteQuantidadePopover
                        tipo="entrada"
                        onAjuste={(delta) => handleAjuste(material, delta)}
                        unidade={material.unidade}
                        qtdAtual={material.qtd_atual}
                      />

                      {/* Botão excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovoMaterialDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        obraId={obraId}
        sistemaMedidas={sistemaMedidas}
        onUpgradeClick={onUpgradeClick}
      />
    </div>
  );
}

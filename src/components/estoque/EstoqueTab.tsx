import { useState, useMemo } from 'react';
import { Package, Plus, AlertTriangle, Trash2, Filter, Ruler, Search, X } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { translateMaterialName } from '@/lib/translateMaterial';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMateriais } from '@/hooks/useMateriais';
import { useToast } from '@/hooks/use-toast';
import { NovoMaterialDialog, isUnidadeInteira } from './NovoMaterialDialog';
import { EditarMaterialDialog } from './EditarMaterialDialog';

import { AjusteQuantidadePopover } from './AjusteQuantidadePopover';
import { Material } from '@/types/database';

// Formata quantidade conforme unidade (inteiro ou decimal)
const formatarQuantidade = (qtd: number, unidade: string): string => {
  if (isUnidadeInteira(unidade)) {
    return Math.round(qtd).toString();
  }
  return qtd.toFixed(2);
};

// Categorias disponíveis — keys mapped to i18n
const CATEGORIA_KEYS: { value: string; i18nKey: string; icon: string }[] = [
  { value: 'all', i18nKey: 'inventory.allCategories', icon: '📦' },
  { value: 'alvenaria', i18nKey: 'inventory.masonry', icon: '🧱' },
  { value: 'hidraulica', i18nKey: 'inventory.plumbing', icon: '🚿' },
  { value: 'eletrica', i18nKey: 'inventory.electrical', icon: '⚡' },
  { value: 'estrutural', i18nKey: 'inventory.structural', icon: '🏗️' },
  { value: 'acabamento', i18nKey: 'inventory.finishing', icon: '🎨' },
  { value: 'ferramentas', i18nKey: 'inventory.tools', icon: '🔧' },
  { value: 'outros', i18nKey: 'inventory.other', icon: '📋' },
];

// Mapa de strings brutas do banco → value normalizado (inclui variantes PT/EN/ES)
const CATEGORIA_NORMALIZE_MAP: Record<string, string> = {
  // Alvenaria / Masonry / Albañilería
  'alvenaria': 'alvenaria', 'masonry': 'alvenaria', 'albañilería': 'alvenaria',
  'concreto': 'alvenaria', 'concrete': 'alvenaria', 'hormigón': 'alvenaria',
  'agregado': 'alvenaria', 'aggregate': 'alvenaria',
  'terraplanagem': 'alvenaria', 'earthwork': 'alvenaria', 'movimiento de tierras': 'alvenaria',
  'forma': 'alvenaria', 'formwork': 'alvenaria', 'encofrado': 'alvenaria',
  'amarração': 'alvenaria', 'ties': 'alvenaria', 'amarre': 'alvenaria',
  'telhas': 'alvenaria', 'tiles': 'alvenaria', 'tejas': 'alvenaria',
  // Hidráulica / Plumbing
  'hidráulica': 'hidraulica', 'hidraulica': 'hidraulica', 'plumbing': 'hidraulica', 'hidráulico': 'hidraulica',
  'reservatório': 'hidraulica', 'tank': 'hidraulica', 'depósito': 'hidraulica',
  'metais': 'hidraulica', 'fixtures': 'hidraulica', 'grifería': 'hidraulica',
  // Elétrica / Electrical
  'elétrica': 'eletrica', 'eletrica': 'eletrica', 'electrical': 'eletrica', 'eléctrica': 'eletrica',
  // Estrutural / Structural
  'estrutural': 'estrutural', 'structural': 'estrutural',
  'ferragem': 'estrutural', 'rebar': 'estrutural', 'acero': 'estrutural',
  'fixação': 'estrutural', 'fasteners': 'estrutural', 'fijación': 'estrutural',
  'infraestrutura': 'estrutural', 'infrastructure': 'estrutural', 'infraestructura': 'estrutural',
  // Acabamento / Finishing
  'acabamento': 'acabamento', 'finishing': 'acabamento', 'acabados': 'acabamento',
  'revestimento': 'acabamento', 'coating': 'acabamento', 'revestimiento': 'acabamento',
  'vedação': 'acabamento', 'sealing': 'acabamento', 'sellado': 'acabamento',
  'vidros': 'acabamento', 'glass': 'acabamento', 'vidrios': 'acabamento',
  // Ferramentas / Tools
  'ferramentas': 'ferramentas', 'tools': 'ferramentas', 'herramientas': 'ferramentas',
  // Outros
  'esquadrias': 'outros', 'doors & windows': 'outros', 'carpintería': 'outros',
  'louças': 'outros', 'sanitarios': 'outros',
  'segurança': 'outros', 'security': 'outros', 'seguridad': 'outros',
  'lazer': 'outros', 'leisure': 'outros', 'ocio': 'outros',
};

function normalizarCategoria(categoria: string): string {
  const key = categoria.toLowerCase().trim();
  return CATEGORIA_NORMALIZE_MAP[key] ?? 'outros';
}


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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');

  const [busca, setBusca] = useState('');


  // Agrupar materiais por categoria
  const materiaisAgrupados = useMemo(() => {
    const grupos: Record<string, Material[]> = {};
    materiais.forEach(material => {
      const categoria = normalizarCategoria(material.categoria || detectarCategoria(material.nome));
      if (!grupos[categoria]) grupos[categoria] = [];
      grupos[categoria].push(material);
    });
    return grupos;
  }, [materiais]);

  // Filtrar por categoria selecionada
  const materiaisFiltrados = useMemo(() => {
    let lista = materiais;
    if (categoriaFiltro !== 'all') {
      lista = lista.filter(m => {
        const categoria = normalizarCategoria(m.categoria || detectarCategoria(m.nome));
        return categoria === categoriaFiltro;
      });
    }
    if (busca.trim()) {
      const buscaLower = busca.trim().toLowerCase();
      lista = lista.filter(m => {
        const nomeOriginal = m.nome.toLowerCase();
        const nomeTraduzido = translateMaterialName(m.nome, lang).toLowerCase();
        return nomeOriginal.includes(buscaLower) || nomeTraduzido.includes(buscaLower);
      });
    }
    return lista;
  }, [materiais, categoriaFiltro, busca, lang]);

  // Contadores por categoria
  const contadorCategorias = useMemo(() => {
    const contagem: Record<string, number> = {};
    materiais.forEach(material => {
      const categoria = normalizarCategoria(material.categoria || detectarCategoria(material.nome));
      contagem[categoria] = (contagem[categoria] || 0) + 1;
    });
    return contagem;
  }, [materiais]);


  const handleAjuste = async (material: Material, delta: number) => {
    try {
      await ajustarQuantidade.mutateAsync({ id: material.id, delta });
      toast({
        title: delta > 0 ? t('inventory.entryRegistered') : t('inventory.exitRegistered'),
        description: `${Math.abs(delta)} ${material.unidade} de ${material.nome}`,
      });
    } catch (error) {
      toast({
        title: t('inventory.errorAdjusting'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(t('inventory.removeFromStock', { name: material.nome }))) return;
    
    try {
      await deleteMaterial.mutateAsync(material.id);
      toast({
        title: t('inventory.materialRemoved'),
        description: material.nome,
      });
    } catch (error) {
      toast({
        title: t('inventory.errorRemoving'),
        description: t('common.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const getCategoriaInfo = (categoria: string) => {
    return CATEGORIA_KEYS.find(c => c.value === categoria) || CATEGORIA_KEYS[CATEGORIA_KEYS.length - 1];
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
          {t('inventory.addMaterial')}
        </Button>
        <Badge variant="outline" className="h-14 px-3 flex items-center gap-1.5 shrink-0">
          <Ruler className="w-4 h-4" />
          <span className="text-xs font-medium">
            {sistemaMedidas === 'imperial' ? t('measurementSystem.imperial') : t('measurementSystem.metric')}
          </span>
        </Badge>
      </div>

      {/* Campo de busca */}
      {materiais.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('inventory.searchMaterial')}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 pr-9"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Filtro por categoria */}
      {materiais.length > 0 && (

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIA_KEYS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{t(cat.i18nKey)}</span>
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
                {t(info.i18nKey)}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Contador de resultados */}
      {materiais.length > 0 && (busca.trim() || categoriaFiltro !== 'all') && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {materiaisFiltrados.length} {materiaisFiltrados.length === 1 ? t('inventory.result') : t('inventory.results')}
            {materiais.length !== materiaisFiltrados.length && (
              <span className="ml-1 opacity-60">/ {materiais.length}</span>
            )}
          </span>
          <button
            onClick={() => { setBusca(''); setCategoriaFiltro('all'); }}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            {t('inventory.clearFilters')}
          </button>
        </div>
      )}

      {/* Lista de materiais */}
      {materiais.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('inventory.noMaterialsRegistered')}</p>
            <p className="text-sm">{t('inventory.addMaterialsToTrack')}</p>
          </CardContent>
        </Card>
      ) : materiaisFiltrados.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            {busca.trim() ? (
              <>
                <Search className="w-10 h-10 mb-3 opacity-50" />
                <p className="font-medium">{t('inventory.materialNotFound')}</p>
                <Button variant="link" size="sm" onClick={() => setBusca('')}>
                  {t('common.viewAll')}
                </Button>
              </>
            ) : (
              <>
                <Filter className="w-10 h-10 mb-3 opacity-50" />
                <p className="font-medium">{t('inventory.noMaterialsInCategory')}</p>
                <Button variant="link" size="sm" onClick={() => setCategoriaFiltro('all')}>
                  {t('common.viewAll')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materiaisFiltrados.map((material) => {
            const isLow = material.qtd_atual < material.qtd_minima;
            const categoria = normalizarCategoria(material.categoria || detectarCategoria(material.nome));
            const categoriaInfo = getCategoriaInfo(categoria);

            
            return (
              <Card 
                key={material.id} 
                className={`border-2 ${isLow ? 'border-destructive/50 bg-destructive/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    {/* Nome e badge de alerta — clicável para editar */}
                    <div
                      className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
                      onClick={() => setEditMaterial(material)}
                      title={t('inventory.editMaterial')}
                    >
                      <span className="text-lg shrink-0">{categoriaInfo.icon}</span>
                      <h4 className="font-semibold flex-1 min-w-0 break-words">{translateMaterialName(material.nome, lang)}</h4>
                      {isLow && (
                        <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          {t('inventory.low')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('inventory.minimum')} {formatarQuantidade(material.qtd_minima, material.unidade)} {material.unidade}
                    </p>


                    {/* Controles de quantidade */}
                    <div className="flex items-center justify-between gap-2">
                      <AjusteQuantidadePopover
                        tipo="saida"
                        onAjuste={(delta) => handleAjuste(material, delta)}
                        disabled={material.qtd_atual <= 0}
                        unidade={material.unidade}
                        qtdAtual={material.qtd_atual}
                      />

                      <div className="flex-1 text-center">
                        <div className={`text-2xl font-bold ${isLow ? 'text-destructive' : ''}`}>
                          {formatarQuantidade(material.qtd_atual, material.unidade)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {material.unidade}
                        </div>
                      </div>

                      <AjusteQuantidadePopover
                        tipo="entrada"
                        onAjuste={(delta) => handleAjuste(material, delta)}
                        unidade={material.unidade}
                        qtdAtual={material.qtd_atual}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 text-muted-foreground hover:text-destructive shrink-0"
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
      <EditarMaterialDialog
        material={editMaterial}
        open={!!editMaterial}
        onOpenChange={(open) => { if (!open) setEditMaterial(null); }}
        obraId={obraId}
        sistemaMedidas={sistemaMedidas}
      />
    </div>
  );
}


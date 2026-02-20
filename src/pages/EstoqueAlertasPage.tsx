import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, AlertTriangle, Package, Search, Filter, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SuporteVipButton } from '@/components/SuporteVipButton';
import { useObras } from '@/hooks/useObras';
import { isUnidadeInteira } from '@/components/estoque/NovoMaterialDialog';

interface MaterialAlerta {
  id: string;
  nome: string;
  unidade: string;
  categoria: string | null;
  qtd_atual: number;
  qtd_minima: number;
  qtd_faltante: number;
  obra_nome: string;
  obra_id: string;
}

function formatQty(qtd: number, unidade: string): string {
  return isUnidadeInteira(unidade) ? Math.round(qtd).toString() : qtd.toFixed(2);
}

export function EstoqueAlertasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { obras } = useObras();

  const [searchTerm, setSearchTerm] = useState('');
  const [obraFiltro, setObraFiltro] = useState<string>('todas');

  const obraIds = obras.map(o => o.id);

  const alertasQuery = useQuery({
    queryKey: ['estoque-alertas-page', user?.id, obraIds],
    queryFn: async () => {
      if (!obraIds.length) return [] as MaterialAlerta[];

      const { data: materiais, error } = await supabase
        .from('materiais')
        .select('id, nome, unidade, categoria, qtd_atual, qtd_minima, obra_id')
        .in('obra_id', obraIds)
        .filter('qtd_atual', 'lt', 'qtd_minima');

      if (error) throw error;

      const obraMap = Object.fromEntries(obras.map(o => [o.id, o.nome]));

      return (materiais || [])
        .filter(m => Number(m.qtd_atual) < Number(m.qtd_minima))
        .map(m => ({
          id: m.id,
          nome: m.nome,
          unidade: m.unidade,
          categoria: m.categoria,
          qtd_atual: Number(m.qtd_atual),
          qtd_minima: Number(m.qtd_minima),
          qtd_faltante: Number(m.qtd_minima) - Number(m.qtd_atual),
          obra_nome: obraMap[m.obra_id] ?? 'Obra',
          obra_id: m.obra_id,
        })) as MaterialAlerta[];
    },
    enabled: !!user?.id && obraIds.length > 0,
  });

  const alertas = alertasQuery.data ?? [];

  const obrasComAlertas = useMemo(() => {
    const ids = new Set(alertas.map(a => a.obra_id));
    return obras.filter(o => ids.has(o.id));
  }, [alertas, obras]);

  const filtrados = useMemo(() => {
    return alertas.filter(a => {
      const matchObra = obraFiltro === 'todas' || a.obra_id === obraFiltro;
      const matchSearch =
        !searchTerm ||
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.obra_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.categoria ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchObra && matchSearch;
    });
  }, [alertas, obraFiltro, searchTerm]);

  // Group by obra for display
  const porObra = useMemo(() => {
    const grouped: Record<string, { obraNome: string; items: MaterialAlerta[] }> = {};
    filtrados.forEach(item => {
      if (!grouped[item.obra_id]) {
        grouped[item.obra_id] = { obraNome: item.obra_nome, items: [] };
      }
      grouped[item.obra_id].items.push(item);
    });
    return Object.entries(grouped);
  }, [filtrados]);

  const isLoading = alertasQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground shadow-md">
        <div className="container py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-secondary-foreground hover:bg-secondary-foreground/10 w-8 h-8 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">Alertas de Estoque</h1>
                <p className="text-[10px] text-secondary-foreground/70">
                  Materiais abaixo do nível mínimo
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 pb-24 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{alertas.length}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Materiais em alerta</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{obrasComAlertas.length}</p>
                  <p className="text-xs text-muted-foreground leading-tight">Obras com alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar material ou obra..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={obraFiltro} onValueChange={setObraFiltro}>
            <SelectTrigger className="w-auto min-w-[140px] h-10 gap-1.5">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <SelectValue placeholder="Todas as obras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as obras</SelectItem>
              {obrasComAlertas.map(obra => (
                <SelectItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Nenhum alerta de estoque</h2>
            <p className="text-sm text-muted-foreground">
              Todos os materiais estão acima do nível mínimo. 
            </p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para os filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {porObra.map(([obraId, { obraNome, items }]) => (
              <div key={obraId}>
                {/* Obra header */}
                <button
                  onClick={() => navigate(`/obra/${obraId}`)}
                  className="flex items-center gap-2 mb-2 group w-full text-left"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {obraNome}
                  </span>
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {items.length}
                  </Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                </button>

                {/* Materials list */}
                <div className="space-y-2">
                  {items.map(item => {
                    const pctAtual = item.qtd_minima > 0
                      ? Math.min(100, Math.round((item.qtd_atual / item.qtd_minima) * 100))
                      : 0;
                    return (
                      <Card key={item.id} className="border-destructive/30">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate">{item.nome}</span>
                                {item.categoria && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                                    {item.categoria}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span>
                                  Atual: <span className="font-semibold text-destructive">
                                    {formatQty(item.qtd_atual, item.unidade)} {item.unidade}
                                  </span>
                                </span>
                                <span>
                                  Mín: <span className="font-semibold">
                                    {formatQty(item.qtd_minima, item.unidade)} {item.unidade}
                                  </span>
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-destructive transition-all"
                                  style={{ width: `${pctAtual}%` }}
                                />
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <Badge variant="destructive" className="text-xs">
                                -{formatQty(item.qtd_faltante, item.unidade)} {item.unidade}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SuporteVipButton />
    </div>
  );
}

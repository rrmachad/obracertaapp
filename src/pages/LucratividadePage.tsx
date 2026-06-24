import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home, ChevronRight, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useCurrency } from '@/hooks/useCurrency';
import { FeatureBlockedOverlay } from '@/components/FeatureBlockedOverlay';
import { SuporteVipButton } from '@/components/SuporteVipButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ObraLucratividade {
  id: string;
  nome: string;
  valorReceita: number | null;
  custoMateriais: number;
  custoMaoDeObra: number;
  custoTotal: number;
  lucro: number | null;
  roi: number | null;
}

export function LucratividadePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits } = usePlanLimits();
  const { formatCurrency } = useCurrency();

  const dataQuery = useQuery({
    queryKey: ['lucratividade', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Obras do usuário
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id, nome, valor_receita')
        .eq('user_id', user.id);
      if (obrasError) throw obrasError;
      if (!obras?.length) return [];

      const obraIds = obras.map(o => o.id);

      // 2. Materiais (mapeia material_id → obra_id e material_id → preco_unitario de referência)
      const { data: materiais } = await supabase
        .from('materiais')
        .select('id, obra_id, preco_unitario')
        .in('obra_id', obraIds);

      const materialToObra: Record<string, string> = {};
      const materialPreco: Record<string, number | null> = {};
      (materiais ?? []).forEach(m => {
        materialToObra[m.id] = m.obra_id;
        materialPreco[m.id] = m.preco_unitario != null ? Number(m.preco_unitario) : null;
      });
      const materialIds = Object.keys(materialToObra);

      // 3. Todas as saídas — preco_unitario_momento pode ser NULL para entradas antigas
      const { data: saidas } = materialIds.length > 0
        ? await supabase
            .from('movimentacao_estoque')
            .select('material_id, quantidade, preco_unitario_momento')
            .eq('tipo', 'saida')
            .in('material_id', materialIds)
        : { data: [] };

      // 4. Medições (custo de mão de obra pago)
      const { data: medicoes } = await supabase
        .from('medicoes')
        .select('obra_id, valor_liquido_a_pagar')
        .in('obra_id', obraIds);

      // 5. Agrupa por obra
      const result: ObraLucratividade[] = obras.map(obra => {
        const valorReceita = obra.valor_receita != null ? Number(obra.valor_receita) : null;

        const custoMateriais = (saidas ?? [])
          .filter(s => materialToObra[s.material_id] === obra.id)
          .reduce((sum, s) => {
            // Fallback: preco_unitario_momento (capturado no momento) → preco_unitario atual do material → 0
            const preco = s.preco_unitario_momento != null
              ? Number(s.preco_unitario_momento)
              : (materialPreco[s.material_id] ?? 0);
            return sum + Number(s.quantidade) * preco;
          }, 0);

        const custoMaoDeObra = (medicoes ?? [])
          .filter(m => m.obra_id === obra.id)
          .reduce((sum, m) => sum + Number(m.valor_liquido_a_pagar || 0), 0);

        const custoTotal = custoMateriais + custoMaoDeObra;
        const lucro = valorReceita != null ? valorReceita - custoTotal : null;
        const roi = valorReceita != null && valorReceita > 0 ? (lucro! / valorReceita) * 100 : null;

        return { id: obra.id, nome: obra.nome, valorReceita, custoMateriais, custoMaoDeObra, custoTotal, lucro, roi };
      });

      // Ordena: obras com receita informada primeiro
      return result.sort((a, b) => {
        if (a.valorReceita != null && b.valorReceita == null) return -1;
        if (a.valorReceita == null && b.valorReceita != null) return 1;
        return 0;
      });
    },
    enabled: !!user?.id,
  });

  const data = dataQuery.data ?? [];
  const dataComReceita = data.filter(o => o.valorReceita != null);
  const totalReceita = dataComReceita.reduce((s, o) => s + (o.valorReceita ?? 0), 0);
  const totalCustoMat = data.reduce((s, o) => s + o.custoMateriais, 0);
  const totalCustoMO = data.reduce((s, o) => s + o.custoMaoDeObra, 0);
  const totalLucro = dataComReceita.reduce((s, o) => s + (o.lucro ?? 0), 0);
  const roiGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

  const chartData = dataComReceita.map(o => ({
    nome: o.nome.length > 18 ? o.nome.slice(0, 16) + '…' : o.nome,
    lucro: o.lucro ?? 0,
  }));

  if (!limits.canAccessDashboardLucratividade) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container flex h-14 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="font-bold">{t('profitability.title')}</h1>
          </div>
        </header>
        <FeatureBlockedOverlay featureKey="lucratividade" onUpgradeClick={() => navigate('/dashboard')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex h-14 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-bold">{t('profitability.title')}</h1>
        </div>
      </header>

      <nav className="container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" /> {t('breadcrumb.dashboard')}
            </button>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-foreground font-medium">{t('breadcrumb.profitability')}</li>
        </ol>
      </nav>

      <main className="container pb-8 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Receita contratada</p>
              <p className="text-xl font-bold">{formatCurrency(totalReceita)}</p>
              {data.some(o => o.valorReceita == null) && (
                <p className="text-xs text-amber-600 mt-1">{data.filter(o => o.valorReceita == null).length} obra(s) sem receita</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Custo de materiais</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalCustoMat)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Custo de mão de obra</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalCustoMO)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{t('profitability.totalProfit')} / ROI</p>
              <p className={`text-xl font-bold ${totalLucro >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatCurrency(totalLucro)}
              </p>
              <p className={`text-sm font-medium ${roiGeral >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {roiGeral.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" /> {t('profitability.profitByWork')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `${t('purchases.work')}: ${label}`} />
                  <Bar dataKey="lucro" name={t('profitability.profit')} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.lucro >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {data.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">{t('profitability.noData')}</h3>
              <p className="text-muted-foreground">{t('profitability.noDataDesc')}</p>
            </CardContent>
          </Card>
        )}

        {/* Per-obra detail */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('profitability.detailByWork')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.map((obra) => (
                  <div key={obra.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium leading-tight">{obra.nome}</p>
                      {obra.roi != null ? (
                        <Badge variant={obra.lucro! >= 0 ? 'default' : 'destructive'}>
                          ROI: {obra.roi.toFixed(1)}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-400 gap-1">
                          <AlertTriangle className="w-3 h-3" /> sem receita
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 text-xs text-muted-foreground gap-2">
                      <div>
                        <p>Receita</p>
                        <p className="font-medium text-foreground">
                          {obra.valorReceita != null ? formatCurrency(obra.valorReceita) : '—'}
                        </p>
                      </div>
                      <div>
                        <p>Mat. consumidos</p>
                        <p className="font-medium text-destructive">{formatCurrency(obra.custoMateriais)}</p>
                      </div>
                      <div>
                        <p>Mão de obra</p>
                        <p className="font-medium text-destructive">{formatCurrency(obra.custoMaoDeObra)}</p>
                      </div>
                      <div>
                        <p>{t('profitability.profit')}</p>
                        {obra.lucro != null ? (
                          <p className={`font-medium ${obra.lucro >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {formatCurrency(obra.lucro)}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>

                    {obra.valorReceita == null && (
                      <p className="text-xs text-amber-600">
                        Edite esta obra e preencha o "Valor do contrato" para ver o lucro.
                      </p>
                    )}
                    {obra.custoMateriais === 0 && obra.custoMaoDeObra === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum custo registrado ainda — registre entradas/saídas de estoque com preço e/ou medições.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <SuporteVipButton />
    </div>
  );
}

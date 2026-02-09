import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ChevronRight, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { FeatureBlockedOverlay } from '@/components/FeatureBlockedOverlay';
import { SuporteVipButton } from '@/components/SuporteVipButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ObraLucratividade {
  nome: string;
  contrato: number;
  custoMateriais: number;
  custoMaoDeObra: number;
  custoTotal: number;
  lucro: number;
  roi: number;
}

const formatCurrency = (val: number) => 
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function LucratividadePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits } = usePlanLimits();

  const dataQuery = useQuery({
    queryKey: ['lucratividade', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user obras
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('user_id', user.id);
      if (obrasError) throw obrasError;
      if (!obras?.length) return [];

      const obraIds = obras.map(o => o.id);

      // Get cronograma items (contract values)
      const { data: cronItens } = await supabase
        .from('cronograma_itens')
        .select('obra_id, valor_contrato_mao_de_obra')
        .in('obra_id', obraIds);

      // Get medicoes (payments made)
      const { data: medicoes } = await supabase
        .from('medicoes')
        .select('obra_id, valor_liquido_a_pagar')
        .in('obra_id', obraIds);

      // Get materiais (cost estimate)
      const { data: materiais } = await supabase
        .from('materiais')
        .select('obra_id, preco_unitario, qtd_atual')
        .in('obra_id', obraIds);

      const result: ObraLucratividade[] = obras.map(obra => {
        // Total contract value = sum of all item contract values
        const contrato = (cronItens || [])
          .filter(ci => ci.obra_id === obra.id && ci.valor_contrato_mao_de_obra)
          .reduce((sum, ci) => sum + Number(ci.valor_contrato_mao_de_obra || 0), 0);

        // Cost of labor = sum of payments made
        const custoMaoDeObra = (medicoes || [])
          .filter(m => m.obra_id === obra.id)
          .reduce((sum, m) => sum + Number(m.valor_liquido_a_pagar || 0), 0);

        // Cost of materials = sum of (preco_unitario * qtd used)
        const custoMateriais = (materiais || [])
          .filter(m => m.obra_id === obra.id && m.preco_unitario)
          .reduce((sum, m) => sum + Number(m.preco_unitario || 0) * Number(m.qtd_atual || 0), 0);

        const custoTotal = custoMaoDeObra + custoMateriais;
        const lucro = contrato - custoTotal;
        const roi = contrato > 0 ? ((lucro / contrato) * 100) : 0;

        return { nome: obra.nome, contrato, custoMateriais, custoMaoDeObra, custoTotal, lucro, roi };
      }).filter(o => o.contrato > 0); // Only show obras with contracts

      return result;
    },
    enabled: !!user?.id,
  });

  const data = dataQuery.data || [];
  const totalLucro = data.reduce((sum, o) => sum + o.lucro, 0);
  const totalContrato = data.reduce((sum, o) => sum + o.contrato, 0);
  const roiGeral = totalContrato > 0 ? ((totalLucro / totalContrato) * 100) : 0;

  if (!limits.canAccessDashboardLucratividade) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container flex h-14 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold">Dashboard de Lucratividade</h1>
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold">Dashboard de Lucratividade</h1>
        </div>
      </header>

      <nav className="container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" /> Dashboard
            </button>
          </li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-foreground font-medium">Lucratividade</li>
        </ol>
      </nav>

      <main className="container pb-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Contratado</p>
              <p className="text-xl font-bold">{formatCurrency(totalContrato)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Lucro Total</p>
              <p className={`text-xl font-bold ${totalLucro >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {formatCurrency(totalLucro)}
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">ROI Geral</p>
              <p className={`text-xl font-bold ${roiGeral >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {roiGeral.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5" />
                Lucro por Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    labelFormatter={(label) => `Obra: ${label}`}
                  />
                  <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={index} fill={entry.lucro >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Nenhum dado disponível</h3>
              <p className="text-muted-foreground">Cadastre valores de contrato nos itens do cronograma para ver a lucratividade.</p>
            </CardContent>
          </Card>
        )}

        {/* Detail table */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento por Obra</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.map((obra, i) => (
                  <div key={i} className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{obra.nome}</p>
                      <Badge variant={obra.lucro >= 0 ? 'default' : 'destructive'}>
                        ROI: {obra.roi.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-muted-foreground gap-2">
                      <div>
                        <p>Contrato</p>
                        <p className="font-medium text-foreground">{formatCurrency(obra.contrato)}</p>
                      </div>
                      <div>
                        <p>Custos</p>
                        <p className="font-medium text-foreground">{formatCurrency(obra.custoTotal)}</p>
                      </div>
                      <div>
                        <p>Lucro</p>
                        <p className={`font-medium ${obra.lucro >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {formatCurrency(obra.lucro)}
                        </p>
                      </div>
                    </div>
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
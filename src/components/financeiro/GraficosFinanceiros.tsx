import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Medicao } from '@/types/database';
import { TrendingUp } from 'lucide-react';

interface GraficosFinanceirosProps {
  medicoes: Medicao[];
}

export function GraficosFinanceiros({ medicoes }: GraficosFinanceirosProps) {
  const chartData = useMemo(() => {
    return [...medicoes]
      .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime())
      .map((m, i) => ({
        nome: `Med ${i + 1}`,
        data: new Date(m.data_medicao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        bruto: Number(m.valor_bruto_medido),
        retido: Number(m.valor_retencao_tecnica),
        liquido: Number(m.valor_liquido_a_pagar),
        percentual: Number(m.percentual_atual),
      }));
  }, [medicoes]);

  const cumulativeData = useMemo(() => {
    let acumBruto = 0;
    let acumPago = 0;
    return chartData.map(d => {
      acumBruto += d.bruto;
      acumPago += d.liquido;
      return { ...d, acumBruto, acumPago };
    });
  }, [chartData]);

  if (medicoes.length < 2) return null;

  const formatCurrency = (v: number) => `R$ ${(v / 1000).toFixed(1)}k`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução por Medição
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="bruto" name="Bruto" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="liquido" name="Líquido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulativeData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="acumBruto" name="Total Medido" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="acumPago" name="Total Pago" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
